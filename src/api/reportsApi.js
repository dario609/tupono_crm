import api from "./axiosInstance";

const ReportsApi = {
  list: (params) => api.get("/admin/reports", { params }),
  create: (payload) => api.post("/admin/reports", payload),
  remove: (id) => api.delete(`/admin/reports/${id}`),
};

export default ReportsApi;


