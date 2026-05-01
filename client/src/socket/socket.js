import { io } from "socket.io-client";

//  https://codecollab-x7b5.onrender.com/

const socket = io("http://34.207.131.98:8080", {
  autoConnect: false,

  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,        // max 10 retries
  reconnectionDelay: 1000,         // 1s
  reconnectionDelayMax: 5000,      // up to 5s
  timeout: 20000,

  // REQUIRED when backend uses CORS with credentials
  withCredentials: true,
});


// const socket = io("http://localhost:5000/", {
//   autoConnect: false,

//   transports: ["polling", "websocket"],

//   withCredentials: true,
// });

export default socket;