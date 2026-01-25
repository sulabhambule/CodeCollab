import { io } from "socket.io-client";

// backend server URL
const SERVER_URL = "https://codecollab-production-e4e3.up.railway.app";

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
