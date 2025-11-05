import api from "./axiosInstance";

const ReportContentsApi = {
  list: (params) => api.get("/admin/report-contents", { params }),
  getById: (id) => api.get(`/admin/report-contents/${id}`),
  create: (payload) => api.post("/admin/report-contents", payload),
  update: (id, payload) => api.put(`/admin/report-contents/${id}`, payload),
  remove: (id) => api.delete(`/admin/report-contents/${id}`),
};

export default ReportContentsApi;


