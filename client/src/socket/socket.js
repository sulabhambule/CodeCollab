import { io } from "socket.io-client";

//  https://codecollab-x7b5.onrender.com/

const socket = io("http://34.207.131.98:8080", {
  autoConnect: false,

  // ✅ polling first (mandatory for handshake), then websocket
  transports: ["polling", "websocket"],

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