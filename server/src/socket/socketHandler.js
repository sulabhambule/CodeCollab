import Room from "../models/Room.js";

export default function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // ======================
    // JOIN ROOM
    // ======================
    socket.on("join", async ({ roomId, userName }) => {
      socket.join(roomId);

      // Create room if not exists
      await Room.updateOne(
        { roomId },
        {
          $setOnInsert: {
            roomId,
            code: "// Start coding...",
            language: "Java",
            users: [],
          },
        },
        { upsert: true },
      );

      // Add user atomically (NO save)
      await Room.updateOne(
        { roomId },
        {
          $addToSet: {
            users: { socketId: socket.id, userName },
          },
        },
      );

      const room = await Room.findOne({ roomId });

      // Send full state to new user
      socket.emit("roomJoined", {
        code: room.code,
        language: room.language,
        users: room.users,
      });

      // Notify others
      socket.to(roomId).emit("usersUpdate", room.users);
    });

    // ======================
    // CODE CHANGE
    // ======================
    socket.on("codeChange", async ({ roomId, code }) => {
      await Room.updateOne({ roomId }, { $set: { code } });

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
    // CLEANUP (LEAVE / DISCONNECT)
    // ======================
    const cleanup = async () => {
      const room = await Room.findOneAndUpdate(
        { "users.socketId": socket.id },
        { $pull: { users: { socketId: socket.id } } },
        { new: true },
      );

      if (!room) return;

      io.to(room.roomId).emit("usersUpdate", room.users);
    };

    socket.on("leaveRoom", cleanup);
    socket.on("disconnect", cleanup);
  });
}
