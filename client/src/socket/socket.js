import { io } from "socket.io-client";

// const socket = io("https://codecollab-x7b5.onrender.com/", {
//   autoConnect: false,

//   // ✅ polling first (mandatory for handshake), then websocket
//   transports: ["polling", "websocket"],

//   // ✅ REQUIRED when backend uses CORS with credentials
//   withCredentials: true,
// });


const socket = io("http://localhost:5000/" || "https://codecollab-x7b5.onrender.com/", {
  autoConnect: false,

  // ✅ polling first (mandatory for handshake), then websocket
  transports: ["polling", "websocket"],

  // ✅ REQUIRED when backend uses CORS with credentials
  withCredentials: true,
});

export default socket;
