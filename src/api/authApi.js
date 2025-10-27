import api from "./axiosInstance";

export const AuthApi = {
  // Login — backend sets a cookie (React doesn’t handle token manually)
  async login({ email, password, rememberme }) {
    return api.post("/auth/login", { email, password, rememberme });
  },

  // Logout — backend clears the cookie
  async logout() {
    return api.post("/auth/logout");
  },

  // Current user — backend checks the cookie and returns user data
  async me() {
    return api.get("/auth/me");
  },
};
