import api from "./axiosInstance";

const ReportsApi = {
  list: (params) => api.get("/admin/reports", { params }),
  getById: (id) => api.get(`/admin/reports/${id}`),
  create: (payload) => api.post("/admin/reports", payload),
  update: (id, payload) => api.put(`/admin/reports/${id}`),
  remove: (id) => api.delete(`/admin/reports/${id}`),
};

export default ReportsApi;


