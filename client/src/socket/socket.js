import { io } from "socket.io-client";

const socket = io(
  "https://codecollab-production-e4e3.up.railway.app",
  {
    autoConnect: false,
    transports: ["polling", "websocket"], // IMPORTANT ORDER
  }
);

export default socket;
