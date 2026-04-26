import { io } from "socket.io-client";

const socket = io("https://codecollab-x7b5.onrender.com/", {
  autoConnect: false,

  // ✅ polling first (mandatory for handshake), then websocket
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,        // 🔥 max 10 retries
  reconnectionDelay: 1000,         // 1s
  reconnectionDelayMax: 5000,      // up to 5s
  timeout: 20000,

  // ✅ REQUIRED when backend uses CORS with credentials
  withCredentials: true,
});


// const socket = io("http://localhost:5000/", {
//   autoConnect: false,

//   // ✅ polling first (mandatory for handshake), then websocket
//   transports: ["polling", "websocket"],

//   // ✅ REQUIRED when backend uses CORS with credentials
//   withCredentials: true,
// });

export default socket;