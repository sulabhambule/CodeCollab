import { io } from "socket.io-client";

const socket = io("https://codecollab-production-cb77.up.railway.app/", {
  autoConnect: false,

  // ✅ polling first (mandatory for handshake), then websocket
  transports: ["polling", "websocket"],

  // ✅ REQUIRED when backend uses CORS with credentials
  withCredentials: true,
});

export default socket;
