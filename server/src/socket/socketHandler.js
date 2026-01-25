import Room from "../models/Room.js";

// 🕒 Store for graceful disconnect timeouts (userName -> {timeoutId, roomId})
const disconnectTimeouts = new Map();

// 🎯 Store for typing status tracking (roomId -> Set<userName>)
// Prevents redundant "user is typing" broadcasts
const typingUsers = new Map();

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // JOIN ROOM
    socket.on("join", async ({ roomId, userName }) => {
      console.log(`User ${userName} (${socket.id}) joining room ${roomId}`);

      // 🔥 Check if user is reconnecting (page refresh)
      const pendingDisconnect = disconnectTimeouts.get(userName);
      const isReconnecting = !!pendingDisconnect;

      // CANCEL any pending disconnect timeout for this user
      if (isReconnecting) {
        console.log(
          `Clearing disconnect timeout for ${userName} (page refresh detected)`,
        );
        clearTimeout(pendingDisconnect.timeoutId);
        disconnectTimeouts.delete(userName);
      }

      socket.join(roomId);

      // Create room if not exists
      await Room.updateOne(
        { roomId },
        {
          $setOnInsert: {
            roomId,
            code: "// Start coding...",
            language: "javascript",
          },
        },
        { upsert: true },
      );

      // 🔒 ATOMIC OPERATION: Remove ALL duplicates first, then add exactly once
      // This prevents race conditions during rapid refreshes
      const result = await Room.findOneAndUpdate(
        { roomId },
        {
          $pull: {
            users: {
              $or: [{ socketId: socket.id }, { userName: userName }],
            },
          },
        },
        { new: false }, // Return document BEFORE update
      );

      // Check if this user existed before removal
      const userExistedBefore = result?.users?.some(
        (u) => u.userName === userName,
      );

      // Now add the user (guaranteed to be unique)
      await Room.updateOne(
        { roomId },
        {
          $push: {
            users: { socketId: socket.id, userName },
          },
        },
      );

      const room = await Room.findOne({ roomId });
      console.log(`Room ${roomId} now has ${room.users.length} users`);

      // ✅ OPTIMIZED: Send full snapshot to the joining user
      socket.emit("roomJoined", {
        code: room.code,
        language: room.language,
        users: room.users,
      });

      // ✅ OPTIMIZED: Send delta update ONLY if truly new (not a reconnection)
      // User is "new" if they had a pending timeout OR didn't exist before
      const isTrulyNew = !isReconnecting && !userExistedBefore;

      if (isTrulyNew) {
        const newUser = { socketId: socket.id, userName };
        socket.to(roomId).emit("user-joined", newUser);
        console.log(`Broadcasting user-joined for ${userName} (new user)`);
      } else {
        console.log(
          `Skipping user-joined broadcast for ${userName} (reconnection)`,
        );
      }
    });

    // CODE CHANGE (REALTIME + DB)
    socket.on("codeChange", async ({ roomId, code }) => {
      // Save latest code
      await Room.updateOne({ roomId }, { $set: { code } });

      // Broadcast to others
      socket.to(roomId).emit("codeUpdate", code);
    });

    // LANGUAGE CHANGE
    socket.on("languageChange", async ({ roomId, language }) => {
      await Room.updateOne({ roomId }, { $set: { language } });

      io.to(roomId).emit("languageUpdate", language);
    });

    // ✅ OPTIMIZED TYPING INDICATOR (with redundancy prevention)
    socket.on("typing", ({ roomId, userName }) => {
      // Initialize Set for this room if not exists
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }

      const roomTypingUsers = typingUsers.get(roomId);

      // Only broadcast if user is NOT already marked as typing
      if (!roomTypingUsers.has(userName)) {
        roomTypingUsers.add(userName);
        socket.to(roomId).emit("user-typing", userName);
        console.log(`${userName} started typing in ${roomId}`);
      }
    });

    // ✅ STOP TYPING INDICATOR
    socket.on("stop-typing", ({ roomId, userName }) => {
      if (!typingUsers.has(roomId)) return;

      const roomTypingUsers = typingUsers.get(roomId);

      // Only broadcast if user was marked as typing
      if (roomTypingUsers.has(userName)) {
        roomTypingUsers.delete(userName);
        socket.to(roomId).emit("user-stopped-typing", userName);
        console.log(`${userName} stopped typing in ${roomId}`);

        // Clean up empty Sets
        if (roomTypingUsers.size === 0) {
          typingUsers.delete(roomId);
        }
      }
    });

    // CODE EXECUTION OUTPUT (BROADCAST TO ALL)
    socket.on("codeExecution", ({ roomId, output, running, userName }) => {
      console.log(`Code execution by ${userName} in room ${roomId}`);
      // Broadcast to ALL users in the room (including sender)
      io.to(roomId).emit("outputUpdate", { output, running, userName });
    });

    // 📍 CURSOR POSITION UPDATE (BROADCAST TO OTHERS)
    socket.on("cursorMove", ({ roomId, userName, position }) => {
      // Broadcast to everyone EXCEPT sender
      socket.to(roomId).emit("cursorUpdate", { userName, position });
    });

    // CLEANUP (DO NOT DELETE ROOM)
    const cleanup = async () => {
      console.log(`Cleaning up socket ${socket.id}`);

      // 1️⃣ Find the room where this socket exists
      const room = await Room.findOne({
        "users.socketId": socket.id,
      });

      if (!room) {
        console.log(`No room found for socket ${socket.id}`);
        return;
      }

      // 2️⃣ Find the userName for this socket (needed for timeout tracking)
      const user = room.users.find((u) => u.socketId === socket.id);
      if (!user) {
        console.log(`No user found for socket ${socket.id}`);
        return;
      }

      const { userName } = user;
      const socketId = socket.id; // Capture socket ID for verification
      console.log(`User ${userName} disconnecting from room ${room.roomId}`);

      // 🕒 GRACEFUL DISCONNECT: Set a timeout instead of immediate removal
      const DISCONNECT_DELAY = 30000; // Increased to 30s to be safe
      const disconnectRoomId = room.roomId; // Capture in closure

      // Cancel any existing timeout for this user
      if (disconnectTimeouts.has(userName)) {
        const existing = disconnectTimeouts.get(userName);
        clearTimeout(existing.timeoutId);
        console.log(`Cancelled previous timeout for ${userName}`);
      }

      // Schedule removal after delay
      const timeoutId = setTimeout(async () => {
        // 1️⃣ Verify this timeout matches the current pending one
        const currentTimeout = disconnectTimeouts.get(userName);
        if (!currentTimeout || currentTimeout.timeoutId !== timeoutId) {
          console.log(
            `Timeout for ${userName} was cancelled, skipping removal`,
          );
          return;
        }

        // 2️⃣ SAFEGUARD: Check if user has reconnected with a NEW socket
        // Check DB to see if the current user's socketId matches the one that disconnected
        const checkRoom = await Room.findOne({ roomId: disconnectRoomId });
        const currentUser = checkRoom?.users?.find(
          (u) => u.userName === userName,
        );

        // If user exists but has a DIFFERENT socket ID, they reconnected! Abort.
        if (currentUser && currentUser.socketId !== socketId) {
          console.log(
            `User ${userName} reconnected (Socket mismatch), aborting removal.`,
          );
          disconnectTimeouts.delete(userName); // Cleanup
          return;
        }

        console.log(
          `Disconnect timeout expired for ${userName}, removing from room`,
        );

        // 3️⃣ Remove the user
        await Room.updateOne(
          { roomId: disconnectRoomId },
          { $pull: { users: { userName } } },
        );

        // 4️⃣ Fetch updated users list (for logging)
        const updatedRoom = await Room.findOne({ roomId: disconnectRoomId });
        if (updatedRoom) {
          console.log(
            `Room ${disconnectRoomId} now has ${updatedRoom.users.length} users after cleanup`,
          );
        }

        // 5️⃣ OPTIMIZED: Send delta update (only removed user) to others
        io.to(disconnectRoomId).emit("user-left", userName);

        // 🔹 Remove cursor for this user
        io.to(disconnectRoomId).emit("cursorRemove", { userName });

        // 6️⃣ Clean up typing status
        if (typingUsers.has(disconnectRoomId)) {
          typingUsers.get(disconnectRoomId).delete(userName);
        }

        // 7️⃣ Clean up timeout tracker
        disconnectTimeouts.delete(userName);
      }, DISCONNECT_DELAY);

      // Store the timeout with roomId
      disconnectTimeouts.set(userName, { timeoutId, roomId: disconnectRoomId });
      console.log(
        `Disconnect timeout set for ${userName} in room ${disconnectRoomId} (${DISCONNECT_DELAY}ms)`,
      );

      // 8️⃣ Leave the socket room immediately
      socket.leave(room.roomId);
    };

    // 🚪 INSTANT REMOVAL when user explicitly leaves
    const instantCleanup = async () => {
      console.log(`User explicitly leaving (socket ${socket.id})`);

      // 1️⃣ Find the room where this socket exists
      const room = await Room.findOne({
        "users.socketId": socket.id,
      });

      if (!room) {
        console.log(`No room found for socket ${socket.id}`);
        return;
      }

      // 2️⃣ Find the userName
      const user = room.users.find((u) => u.socketId === socket.id);
      if (!user) {
        console.log(`No user found for socket ${socket.id}`);
        return;
      }

      const { userName } = user;
      console.log(`User ${userName} explicitly leaving room ${room.roomId}`);

      // 🔥 Cancel any pending disconnect timeout
      if (disconnectTimeouts.has(userName)) {
        const existing = disconnectTimeouts.get(userName);
        clearTimeout(existing.timeoutId);
        disconnectTimeouts.delete(userName);
        console.log(`Cancelled pending timeout for ${userName}`);
      }

      // ⚡ INSTANT REMOVAL (no timeout)
      await Room.updateOne(
        { roomId: room.roomId },
        { $pull: { users: { userName } } },
      );

      // Fetch updated users list
      const updatedRoom = await Room.findOne({ roomId: room.roomId });
      console.log(
        `Room ${room.roomId} now has ${updatedRoom.users.length} users after instant cleanup`,
      );

      // 📢 Notify everyone immediately
      io.to(room.roomId).emit("user-left", userName);

      // 🔹 Remove cursor for this user
      io.to(room.roomId).emit("cursorRemove", { userName });

      // Clean up typing status
      if (typingUsers.has(room.roomId)) {
        typingUsers.get(room.roomId).delete(userName);
      }

      // Leave the socket room
      socket.leave(room.roomId);
    };

    socket.on("leaveRoom", instantCleanup); // Instant removal
    socket.on("disconnect", cleanup); // Graceful timeout
  });
}
