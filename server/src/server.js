import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import connectDb from "./db/connectDb.js";
import setupSocket from "./socket/socketHandler.js";

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // --------------------
  // Middleware
  // --------------------
  app.use(cors());
  app.use(express.json());

  // --------------------
  // Database
  // --------------------
  await connectDb();
  console.log("✅ MongoDB connected");

  // --------------------
  // Socket.IO (for control events)
  // --------------------
  const io = new Server(server, {
    cors: {
      origin: "*", // later: frontend URL
      methods: ["GET", "POST"],
    },
    path: "/socket.io", // Explicit path for Socket.io
    transports: ["websocket", "polling"],
  });

  setupSocket(io);

  // --------------------
  // Routes
  // --------------------
  app.get("/", (req, res) => {
    res.send("Backend running 🚀");
  });

  // --------------------
  // Start server
  // --------------------
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
