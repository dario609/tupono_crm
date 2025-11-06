import api from "./axiosInstance";

const CalendarApi = {
  list: (params) => api.get("/admin/calendar", { params }),
  create: (payload) => api.post("/admin/calendar", payload),
  remove: (id) => api.delete(`/admin/calendar/${id}`),
  summary: (params) => api.get("/admin/calendar/summary", { params }),
  invite: (id, payload) => api.post(`/admin/calendar/${id}/invite`, payload),
};

export default CalendarApi;


