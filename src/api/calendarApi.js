import api from "./axiosInstance";

const CalendarApi = {
  list: (params) => api.get("/admin/calendar", { params }),
  getById: (id) => api.get(`/admin/calendar/${id}`),
  create: (payload) => api.post("/admin/calendar", payload),
  update: (id, payload) => api.put(`/admin/calendar/${id}`, payload),
  remove: (id) => api.delete(`/admin/calendar/${id}`),
  summary: (params) => api.get("/admin/calendar/summary", { params }),
  invite: (id, payload) => api.post(`/admin/calendar/${id}/invite`, payload),
  createLink: (id) => api.post(`/admin/calendar/${id}/create-link`, {}),
  createTeamsLink: (id) => api.post(`/admin/calendar/${id}/teams-link`, {}),
};

export default CalendarApi;


