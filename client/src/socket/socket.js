import { io } from "socket.io-client";

//  https://codecollab-x7b5.onrender.com/

const socket = io("http://34.207.131.98:8080", {
  autoConnect: false,

  transports: ["polling", "websocket"],

  withCredentials: true,
});


// const socket = io("http://localhost:5000/", {
//   autoConnect: false,

//   transports: ["polling", "websocket"],

//   withCredentials: true,
// });

export default socket;