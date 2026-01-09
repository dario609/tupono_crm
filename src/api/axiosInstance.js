// src/api/axiosInstance.js
import axios from "axios";

const normalizeBaseUrl = (url) => {
  let normalized = (url || "").trim();
  if (!normalized) return "http://localhost:5000/api";

  if (/^:\d+(\/|$)/.test(normalized)) {
    normalized = `localhost${normalized}`; 
  }

  if (!/^https?:\/\//i.test(normalized)) {
    const protocol = typeof window !== "undefined" && window.location?.protocol ? window.location.protocol : "http:";
    // Also handle leading "//host" inputs
    if (/^\/\//.test(normalized)) {
      normalized = `${protocol}${normalized}`; // protocol already has the colon
    } else {
      normalized = `${protocol}//${normalized}`;
    }
  }

  return normalized.replace(/\/+$/, "");
};

const getBaseUrl = () => {
  const fromEnv = (`${process.env.REACT_APP_TUPONO_API_URL}` || "").trim();
  // Only trust env var if it's a proper absolute URL
  if (/^https?:\/\//i.test(fromEnv)) {
    try {
      const u = new URL(fromEnv);
      const isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(u.hostname);
      const isHttps = u.protocol === "https:";
      if (process.env.NODE_ENV === "production") {
        // In production, ignore localhost URLs; prefer Render default unless a proper HTTPS external URL is provided
        if (!isLocal && isHttps) return fromEnv.replace(/\/+$/, "");
        return "https://tupono-crm-backend.onrender.com/api";
      }
      return fromEnv.replace(/\/+$/, "");
    } catch (_) {
      // fall through to defaults
    }
  }

  // Production default → Render backend
  if (process.env.NODE_ENV === "production") {
    return "https://tupono-crm-backend.onrender.com/api";
  }
  // Development default
  return "http://localhost:5000/api";
};

const API_BASE_URL = normalizeBaseUrl(getBaseUrl());

/**
 * Axios instance with cookie support
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ This is what allows cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Optional interceptors for debugging or global error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    // Backend uses 'msg' field, fallback to 'message'
    const msg =
      error?.response?.data?.msg || error?.response?.data?.message || "An unexpected server error occurred.";
    // Handle unauthorized globally → redirect to login
    if (status === 401 && typeof window !== "undefined") {
      try {
        // optional cleanup
        window.localStorage.removeItem("auth_user");
      } catch {}
      // Avoid redirect loops if we are already on login
      const atLogin = window.location.pathname === "/";
      if (!atLogin) {
        window.location.assign("/");
      }
    }
    console.error("❌ API Error:", msg);
    return Promise.reject(new Error(msg));
  }
);

export default api;

