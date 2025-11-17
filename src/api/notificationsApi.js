import api from "./axiosInstance";

const NotificationsApi = {
    list: () => api.get("/notifications"),
    markRead: (id) => api.put(`/notifications/${id}`),
    markAllRead: () => api.post("/notifications/mark-all-read"),
  };
  
export default NotificationsApi;