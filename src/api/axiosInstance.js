// src/api/axiosInstance.js
import axios from "axios";

// Normalize base URL to always be absolute (adds protocol if missing) and trims trailing slashes
const normalizeBaseUrl = (url) => {
  let normalized = (url || "").trim();
  if (!/^https?:\/\//i.test(normalized)) {
    const protocol = typeof window !== "undefined" && window.location?.protocol ? window.location.protocol : "http:";
    normalized = `${protocol}//${normalized}`;
  }
  return normalized.replace(/\/+$/, "");
};

const inferredFallback = (() => {
  const isProd = process.env.NODE_ENV === "production";
  // When deployed (e.g., on Vercel) and no env var is provided, use Render API
  if (isProd) return "https://tupono-crm-backend.onrender.com/api";
  // Local development
  return "http://localhost:5000/api";
})();

const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_TUPONO_API_URL || inferredFallback
);

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
    const msg =
      error.response?.data?.message || "An unexpected server error occurred.";
    console.error("❌ API Error:", msg);
    return Promise.reject(new Error(msg));
  }
);

export default api;

