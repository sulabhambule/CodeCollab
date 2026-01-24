import Room from "../models/Room.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ======================
    // JOIN ROOM
    // ======================
    socket.on("join", async ({ roomId, userName }) => {
      socket.join(roomId);

      // 1️⃣ Create room if it doesn't exist (PERSISTENT)
      await Room.updateOne(
        { roomId },
        {
          $setOnInsert: {
            roomId,
            code: "// Start coding...",
            language: "javascript",
            users: [],
          },
        },
        { upsert: true },
      );

      // 2️⃣ Add user safely (no duplicates)
      await Room.updateOne(
        { roomId },
        {
          $addToSet: {
            users: { socketId: socket.id, userName },
          },
        },
      );

      // 3️⃣ Fetch fresh room state
      const room = await Room.findOne({ roomId });

      // 4️⃣ Send full state to joining user
      socket.emit("roomJoined", {
        code: room.code,
        language: room.language,
        users: room.users,
      });

      // 5️⃣ Update others
      socket.to(roomId).emit("usersUpdate", room.users);
    });

    // ======================
    // CODE CHANGE (REALTIME + DB)
    // ======================
    socket.on("codeChange", async ({ roomId, code }) => {
      // Save latest code
      await Room.updateOne({ roomId }, { $set: { code } });

      // Broadcast to others
      socket.to(roomId).emit("codeUpdate", code);
    });

    // ======================
    // LANGUAGE CHANGE
    // ======================
    socket.on("languageChange", async ({ roomId, language }) => {
      await Room.updateOne({ roomId }, { $set: { language } });

      io.to(roomId).emit("languageUpdate", language);
    });

    // ======================
    // TYPING INDICATOR
    // ======================
    socket.on("typing", ({ roomId, userName }) => {
      socket.to(roomId).emit("userTyping", userName);
    });

    // ======================
    // CLEANUP (DO NOT DELETE ROOM)
    // ======================
    const cleanup = async () => {
      // 1️⃣ Find the room where this socket exists
      const room = await Room.findOne({
        "users.socketId": socket.id,
      });

      if (!room) return;

      // 2️⃣ Remove the user
      await Room.updateOne(
        { roomId: room.roomId },
        { $pull: { users: { socketId: socket.id } } },
      );

      // 3️⃣ Fetch updated users list
      const updatedRoom = await Room.findOne({ roomId: room.roomId });

      // 4️⃣ Notify remaining users
      io.to(room.roomId).emit("usersUpdate", updatedRoom.users);
    };

    socket.on("leaveRoom", cleanup);
    socket.on("disconnect", cleanup);
  });
}
