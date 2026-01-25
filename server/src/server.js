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

/* ======================================================
   CORS (Express – REST + Socket handshake)
   ====================================================== */
const FRONTEND_URL = "https://code-collab-sulabh-ambules-projects.vercel.app";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());

/* ======================================================
   Socket.IO
   ====================================================== */
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"], // REQUIRED for Railway
});

setupSocket(io);

/* ======================================================
   Routes
   ====================================================== */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* Start Server */
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Database (non-blocking, safe)
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));
