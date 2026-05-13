import Room from "../models/Room.js";

const disconnectTimeouts = new Map();
const typingUsers = new Map();
const codeCache = new Map();
const lastSavedCode = new Map();

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    // JOIN
    socket.on("join", async (
      { roomId, userName, userId }
    ) => {
      try {
        //  Cancel pending disconnect 
        const pendingDisconnect = disconnectTimeouts.get(userId);
        if (pendingDisconnect) {
          clearTimeout(pendingDisconnect.timeoutId);
          disconnectTimeouts.delete(userId);
        }

        socket.join(roomId);

        // 2) Initialize Room (if it doesn't exist)
        let room = await Room.findOne({ roomId });

        if (!room) {
          // if room not found create a new room.
          room = await Room.create({
            roomId,
            code: "",
            language: "java",
            users: [],
          });
        }

        // 3. Check if user is already in the list
        const userIndex = room.users.findIndex((u) => u.userId === userId);

        if (userIndex !== -1) {
          // Update existing user's socket ID
          room.users[userIndex].socketId = socket.id;
          room.users[userIndex].userName = userName;
        } else {
          // Add new user
          room.users.push({
            userId,
            socketId: socket.id,
            userName
          });
        }

        await room.save();

        const cachedCode = codeCache.get(roomId);
        //  Send success to the user
        socket.emit("roomJoined", {
          code: cachedCode || room.code, // alwats latest
          language: room.language,
          users: room.users,
        });

        //  Broadcast new user to others in room
        const isTrulyNew = !pendingDisconnect && userIndex === -1;
        if (isTrulyNew) {
          socket
            .to(roomId)
            .emit("user-joined", {
              userId,
              userName,
              socketId: socket.id,
            });
        }
      } catch (err) {
        socket.emit("roomJoined", {
          error: true,
          message: "Failed to join room. Please try again.",
        });
      }
    });

    // CODE CHANGE
    socket.on("codeChange", ({ roomId, code }) => {
      // store in memory
      codeCache.set(roomId, code);
      // broadcast to others.
      socket.to(roomId).emit("codeUpdate", code);
    });

    socket.on("languageChange", async ({ roomId, language }) => {
      await Room.updateOne({ roomId }, { $set: { language } });

      io.to(roomId).emit("languageUpdate", language);
    });

    // TYPING
    socket.on("typing", ({ roomId, userId, userName }) => {
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }

      const roomTypingUsers = typingUsers.get(roomId);

      // Only broadcast if user is NOT already marked as typing
      if (!roomTypingUsers.has(userId)) {
        roomTypingUsers.add(userId);
        socket.to(roomId).emit("user-typing", { userId, userName });
      }
    });

    socket.on("stop-typing", ({ roomId, userId, userName }) => {
      if (!typingUsers.has(roomId)) return;

      const roomTypingUsers = typingUsers.get(roomId);

      // Only broadcast if user was marked as typing
      if (roomTypingUsers.has(userId)) {
        roomTypingUsers.delete(userId);
        socket.to(roomId).emit("user-stopped-typing", { userId, userName });

        if (roomTypingUsers.size === 0) {
          typingUsers.delete(roomId);
        }
      }
    });

    // EXECUTION
    socket.on("codeExecution", ({ roomId, output, running, userId, userName }) => {
      io.to(roomId).emit("outputUpdate", {
        output,
        running,
        userId,
        userName
      });
    });

    // CURSOR
    socket.on("cursorMove", ({ roomId, userId, userName, position }) => {
      socket.to(roomId).emit("cursorUpdate", {
        userId,
        userName,
        position
      });
    });

    // CLEANUP (DO NOT DELETE ROOM)
    const cleanup = async () => {

      // Find the room where this socket exists
      const room = await Room.findOne({
        "users.socketId": socket.id,
      });

      if (!room) return;

      // Find the userName for this socket (needed for timeout tracking)
      const user = room.users.find((u) => u.socketId === socket.id);
      if (!user) return;

      const { userId } = user;
      const socketId = socket.id;
      const roomId = room.roomId;

      const DISCONNECT_DELAY = 20000;

      // Cancel any existing timeout for this user
      if (disconnectTimeouts.has(userId)) {
        const existing = disconnectTimeouts.get(userId);
        clearTimeout(existing.timeoutId);
      }

      const timeoutId = setTimeout(async () => {
        const currentTimeout = disconnectTimeouts.get(userId);
        if (!currentTimeout || currentTimeout.timeoutId !== timeoutId)
          return;

        const checkRoom = await Room.findOne({ roomId: disconnectRoomId });
        const currentUser = checkRoom?.users?.find(
          (u) => u.userId === userId,
        );

        // If user exists but has a DIFFERENT socket ID, they reconnected! Abort.
        if (currentUser && currentUser.socketId !== socketId) {
          disconnectTimeouts.delete(userId); // Cleanup
          return;
        }

        const latestCode = codeCache.get(roomId);

        if (latestCode) {
          await Room.updateOne(
            { roomId: roomId },
            { $set: { code: latestCode } }
          );
        }

        // Remove the user
        await Room.updateOne(
          { roomId: disconnectRoomId },
          { $pull: { users: { userId } } },
        );


        // Send delta update (only removed user) to others
        io.to(disconnectRoomId).emit("user-left", userId);

        io.to(disconnectRoomId).emit("cursorRemove", { userId });

        // Clean up typing status
        if (typingUsers.has(disconnectRoomId)) {
          typingUsers.get(disconnectRoomId).delete(userId);
        }

        // MEMORY CLEANUP
        const updatedRoom = await Room.findOne({ roomId });

        if (!updatedRoom || updatedRoom.users.length === 0) {
          codeCache.delete(roomId);
          lastSavedCode.delete(roomId);
          typingUsers.delete(roomId);
        }

        //  Clean up timeout tracker
        disconnectTimeouts.delete(userId);
      }, DISCONNECT_DELAY);

      // Store the timeout with roomId
      disconnectTimeouts.set(userId, { timeoutId, roomId: roomId });

      //  Leave the socket room immediately
      socket.leave(room.roomId);
    };

    const instantCleanup = async () => {
      // Find the room where this socket exist
      const room = await Room.findOne({
        "users.socketId": socket.id,
      });

      if (!room) return;

      // Find the userName
      const user = room.users.find((u) => u.socketId === socket.id);
      if (!user) return;

      const { userId } = user;

      if (disconnectTimeouts.has(userId)) {
        const existing = disconnectTimeouts.get(userId);
        clearTimeout(existing.timeoutId);
        disconnectTimeouts.delete(userId);
      }

      await Room.updateOne(
        { roomId: room.roomId },
        { $pull: { users: { userId } } },
      );

      io.to(room.roomId).emit("user-left", userId);
      io.to(room.roomId).emit("cursorRemove", { userId });

      // typing cleanup
      if (typingUsers.has(room.roomId)) {
        typingUsers.get(room.roomId).delete(userId);
      }
      // MEMORY CLEANUP 
      const updatedRoom = await Room.findOne({ roomId: room.roomId });

      if (!updatedRoom || updatedRoom.users.length === 0) {
        codeCache.delete(room.roomId);
        lastSavedCode.delete(room.roomId);
        typingUsers.delete(room.roomId);
      }

      // Leave the socket room
      socket.leave(room.roomId);
    };

    socket.on("leaveRoom", instantCleanup); // Instant removal
    socket.on("disconnect", cleanup); // Graceful timeout
  });
}


setInterval(async () => {
  for (const [roomId, code] of codeCache.entries()) {
    try {
      if (lastSavedCode.get(roomId) === code) continue;
      await Room.updateOne(
        { roomId },
        { $set: { code } }
      );
      lastSavedCode.set(roomId, code);
    } catch (err) {
      console.error("DB Save Error:", err);
    }
  }
}, 5000); // every 5 sec.