import api from "./axiosInstance";

const TemplatesApi = {
  listMine: () => api.get("/admin/templates"),
  getById: (id) => api.get(`/admin/templates/${id}`),
  create: (payload) => api.post("/admin/templates", payload),
  update: (id, payload) => api.put(`/admin/templates/${id}`, payload),
  remove: (id) => api.delete(`/admin/templates/${id}`),
};

export default TemplatesApi;


