import api from "./axiosInstance";

const AssessmentApi = {
  list: (params) => api.get("/admin/assessments", { params }),
  getById: (id) => api.get(`/admin/assessments/${id}`),
  create: (payload) => api.post("/admin/assessments", payload),
  update: (id, payload) => api.put(`/admin/assessments/${id}`, payload),
  remove: (id) => api.delete(`/admin/assessments/${id}`),
};

export default AssessmentApi;


