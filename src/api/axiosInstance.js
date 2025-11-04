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

const getBaseUrl = () => {
  const fromEnv = (process.env.REACT_APP_TUPONO_API_URL || "").trim();
  // Only trust env var if it's a proper absolute URL
  if (/^https?:\/\//i.test(fromEnv)) return fromEnv.replace(/\/+$/, "");

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
    const msg =
      error.response?.data?.message || "An unexpected server error occurred.";
    console.error("❌ API Error:", msg);
    return Promise.reject(new Error(msg));
  }
);

export default api;

