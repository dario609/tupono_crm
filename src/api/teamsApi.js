import api from "./axiosInstance";

const TeamsApi = {
  list: (params) => api.get("/admin/teams", { params }),
  getById: (id) => api.get(`/admin/teams/${id}`),
  create: (payload) => api.post("/admin/teams", payload),
  update: (id, payload) => api.put(`/admin/teams/${id}`, payload),
  remove: (id) => api.delete(`/admin/teams/${id}`),
  setStatus: (id, status) => api.post(`/admin/teams/${id}/status`, { status }),
};

export default TeamsApi;


