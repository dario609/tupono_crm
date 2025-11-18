import api from "./axiosInstance";

const EngagementApi = {
  list: (params) => api.get("/admin/engagements", { params }),
  getById: (id) => api.get(`/admin/engagements/${id}`),
  create: (formData) =>
    api.post("/admin/engagements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, formData) =>
    api.put(`/admin/engagements/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => api.delete(`/admin/engagements/${id}`),
};

export default EngagementApi;