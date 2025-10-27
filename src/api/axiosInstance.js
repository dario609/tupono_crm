// src/api/axiosInstance.js
import axios from "axios";
// Load base URL from environment or fallback
const API_BASE_URL = process.env.REACT_APP_TUPONO_API_URL || "http://localhost:5000/api";

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

