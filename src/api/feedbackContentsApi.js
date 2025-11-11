import api from "./axiosInstance";

const FeedbackContentsApi = {
  list: (params) => api.get("/admin/feedback-contents", { params }),
  getById: (id) => api.get(`/admin/feedback-contents/${id}`),
  create: (payload) => api.post("/admin/feedback-contents", payload),
  update: (id, payload) => api.put(`/admin/feedback-contents/${id}`, payload),
  remove: (id) => api.delete(`/admin/feedback-contents/${id}`),
};

export default FeedbackContentsApi;


