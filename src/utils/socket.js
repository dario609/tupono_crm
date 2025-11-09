import { io } from "socket.io-client";

let _socket;
export const getSocket = () => {
  if (!_socket) {
    const base = (process.env.REACT_APP_API_WS || "http://localhost:5000");
    _socket = io(base, { withCredentials: true, transports: ["websocket"] });
  }
  return _socket;
};
