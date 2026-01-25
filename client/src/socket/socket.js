import { io } from "socket.io-client";

// backend server URL
const SERVER_URL = "http://localhost:5000";

// create socket instance (singleton) with optimized settings
const socket = io(SERVER_URL, {
  autoConnect: false,
  path: "/socket.io", // Explicit path
  transports: ["websocket", "polling"], // Try websocket first, fallback to polling

  // ⚡ OPTIMIZATION: Connection & reconnection settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,

  // ⚡ OPTIMIZATION: Timeout settings
  timeout: 10000,

  // ⚡ OPTIMIZATION: Upgrade websocket immediately for lower latency
  upgrade: true,
  rememberUpgrade: true,

  // ⚡ OPTIMIZATION: Heartbeat settings
  pingInterval: 25000,
  pingTimeout: 20000,

  // ⚡ OPTIMIZATION: Force websocket transport for lowest latency
  forceNew: false,
  multiplex: true,
});

export default socket;
