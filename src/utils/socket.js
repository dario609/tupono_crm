import { io } from "socket.io-client";

let _socket;

function resolveWsBase() {
  // 1) Explicit WS base from env
  const fromEnv = (process.env.REACT_APP_API_WS || "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // 2) Derive from API base by stripping /api
  const api = (process.env.REACT_APP_TUPONO_API_URL || "").trim();
  if (api) {
    try {
      const u = new URL(api);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }
  // 3) Fallback to current origin (useful in local dev when proxying)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  // 4) Final fallback - localhost dev
  return "http://localhost:5000";
}

export const getSocket = () => {
  if (!_socket) {
    const base = resolveWsBase();
    _socket = io(base, {
      withCredentials: true,
      transports: ["websocket", "polling"], // allow fallback on some hosts/proxies
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      reconnectionDelayMax: 4000,
    });
  }
  return _socket;
};
