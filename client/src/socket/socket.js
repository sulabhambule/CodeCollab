import { io } from "socket.io-client";

// backend server URL
const SERVER_URL = "http://localhost:5000";

// create socket instance (singleton)
const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
