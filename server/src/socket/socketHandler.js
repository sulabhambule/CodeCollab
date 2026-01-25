import Room from "../models/Room.js";

const disconnectTimeouts = new Map();
const typingUsers = new Map();

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // JOIN ROOM - "Safe" Version
    socket.on("join", async ({ roomId, userName }) => {
      try {
        console.log(
          `User ${userName} (${socket.id}) attempting to join room ${roomId}`,
        );

        const pendingDisconnect = disconnectTimeouts.get(userName);
        if (pendingDisconnect) {
          clearTimeout(pendingDisconnect.timeoutId);
          disconnectTimeouts.delete(userName);
        }

        socket.join(roomId);
        // 2. Initialize Room (if it doesn't exist)
        let room = await Room.findOne({ roomId });

        if (!room) {
          console.log(`Creating new room: ${roomId}`);
          room = await Room.create({
            roomId,
            code: "// Start coding...",
            language: "javascript",
            users: [],
          });
        }

        // 3. Check if user is already in the list
        const userIndex = room.users.findIndex((u) => u.userName === userName);

        if (userIndex !== -1) {
          // Update existing user's socket ID
          room.users[userIndex].socketId = socket.id;
          console.log(`Updated socket ID for existing user: ${userName}`);
        } else {
          // Add new user
          room.users.push({ socketId: socket.id, userName });
          console.log(`Added new user: ${userName}`);
        }
        await room.save();
        console.log(`Room ${roomId} now has ${room.users.length} users`);

        // 5. Send success to the user
        socket.emit("roomJoined", {
          code: room.code,
          language: room.language,
          users: room.users,
        });
        const isTrulyNew = !pendingDisconnect && userIndex === -1;
        if (isTrulyNew) {
          socket
            .to(roomId)
            .emit("user-joined", { socketId: socket.id, userName });
        }
      } catch (err) {
        console.error("CRITICAL ERROR in Join Handler:", err);
        socket.emit("roomJoined", {
          error: true,
          message: "Failed to join room. Please try again.",
        });
      }
    });

    // CODE CHANGE (REALTIME + DB)
    socket.on("codeChange", async ({ roomId, code }) => {
      await Room.updateOne({ roomId }, { $set: { code } });
      socket.to(roomId).emit("codeUpdate", code);
    });

    socket.on("languageChange", async ({ roomId, language }) => {
      await Room.updateOne({ roomId }, { $set: { language } });

      io.to(roomId).emit("languageUpdate", language);
    });

    socket.on("typing", ({ roomId, userName }) => {
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

    socket.on("codeExecution", ({ roomId, output, running, userName }) => {
      console.log(`Code execution by ${userName} in room ${roomId}`);
      io.to(roomId).emit("outputUpdate", { output, running, userName });
    });

    socket.on("cursorMove", ({ roomId, userName, position }) => {
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
      const socketId = socket.id;
      console.log(`User ${userName} disconnecting from room ${room.roomId}`);

      const DISCONNECT_DELAY = 30000;
      const disconnectRoomId = room.roomId;

      // Cancel any existing timeout for this user
      if (disconnectTimeouts.has(userName)) {
        const existing = disconnectTimeouts.get(userName);
        clearTimeout(existing.timeoutId);
        console.log(`Cancelled previous timeout for ${userName}`);
      }

      const timeoutId = setTimeout(async () => {
        const currentTimeout = disconnectTimeouts.get(userName);
        if (!currentTimeout || currentTimeout.timeoutId !== timeoutId) {
          console.log(
            `Timeout for ${userName} was cancelled, skipping removal`,
          );
          return;
        }

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

    const instantCleanup = async () => {
      console.log(`User explicitly leaving (socket ${socket.id})`);

      // 1️⃣ Find the room where this socket exist
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

      if (disconnectTimeouts.has(userName)) {
        const existing = disconnectTimeouts.get(userName);
        clearTimeout(existing.timeoutId);
        disconnectTimeouts.delete(userName);
        console.log(`Cancelled pending timeout for ${userName}`);
      }

      await Room.updateOne(
        { roomId: room.roomId },
        { $pull: { users: { userName } } },
      );

      const updatedRoom = await Room.findOne({ roomId: room.roomId });
      console.log(
        `Room ${room.roomId} now has ${updatedRoom.users.length} users after instant cleanup`,
      );

      io.to(room.roomId).emit("user-left", userName);

      // 🔹 Remove cursor for this user
      io.to(room.roomId).emit("cursorRemove", { userName });

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
