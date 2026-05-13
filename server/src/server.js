import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";
import rateLimit from "express-rate-limit";
import { createAdapter } from "@socket.io/redis-adapter";

// Routes, Database, and Socket handlers
import aiRoutes from "./routes/aiRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import connectDB from "./db/connectDB.js";
import setupSocket from "./socket/socketHandler.js";

dotenv.config();

// 1. Initialize App & Server 
const app = express();
const server = http.createServer(app);

// 2. Middleware Configuration
const allowedOrigins = [
  "http://34.207.131.98:5173",
  "https://code-collab-one-bay.vercel.app", // Production
  "http://localhost:5173", // Local React/Vite
  "http://localhost:3000", // Local generic
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // max 100 requests per IP
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

// 3. Routes
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.use("/api", aiRoutes);
app.use("/code", codeRoutes);

// 4. Socket.IO Setup & Rate Limiting
const io = new Server(server, {
  cors: corsOptions, // Reuse the same options
  transports: ["websocket", "polling"],
});

// Socket Rate Limiting
const ipRequestMap = new Map();

io.use((socket, next) => {
  const rawIp = socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
  const ip = rawIp.split(",")[0].trim();
  const now = Date.now();
  const windowTime = 60 * 1000; // 1 min
  const limit = 50;

  if (!ipRequestMap.has(ip)) {
    ipRequestMap.set(ip, []);
  }

  const timestamps = ipRequestMap.get(ip);

  // remove old timestamps
  while (timestamps.length && timestamps[0] < now - windowTime) {
    timestamps.shift();
  }

  if (timestamps.length >= limit) {
    return next(new Error("Rate limit exceeded"));
  }

  timestamps.push(now);
  next();
});

// Cleanup memory for Socket Rate Limiter
setInterval(() => {
  ipRequestMap.clear();
}, 10 * 60 * 1000);

setupSocket(io);

// 5. Redis Adapter & Server Initialization
const redisUri = process.env.REDIS_URI;
const pubClient = createClient({ url: redisUri });
const subClient = pubClient.duplicate();

async function startServer() {
  // Connect DB
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }

  // Connect Redis and setup Adapter
  try {
    await pubClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter attached to Socket.IO");
  } catch (err) {
    console.error("Redis connection failed:", err.message);
    console.log("Running in single-server mode (no scaling)");
  }

  // Start HTTP Server
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();


