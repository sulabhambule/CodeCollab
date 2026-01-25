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
   CORS Configuration (Allow Prod + Localhost)
   ====================================================== */
const allowedOrigins = [
  "https://code-collab-one-bay.vercel.app", // Production
  "http://localhost:5173", // Local React/Vite (adjust port if needed)
  "http://localhost:3000", // Local generic
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// Apply to Express
app.use(cors(corsOptions));
app.use(express.json());

/* ======================================================
   Socket.IO
   ====================================================== */
const io = new Server(server, {
  cors: corsOptions, // Reuse the same options
  transports: ["polling", "websocket"],
});

setupSocket(io);

/* ======================================================
   Routes
   ====================================================== */
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

/* ======================================================
   Start Server
   ====================================================== */
const PORT = process.env.PORT || 8080;

// ✅ 0.0.0.0 is crucial for Railway to expose the port
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ======================================================
   Database
   ====================================================== */
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));
