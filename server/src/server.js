import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./db/connectDB.js";
import setupSocket from "./socket/socketHandler.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// Socket.IO
// --------------------
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // local frontend
      "https://code-collab-sulabh-ambules-projects.vercel.app/",
      "*",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },

  // 🔑 CRITICAL for Railway
  transports: ["websocket"],
});

setupSocket(io);

// --------------------
// Routes
// --------------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// --------------------
// Start server FIRST
// --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --------------------
// Connect DB (async, non-blocking)
// --------------------
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));
