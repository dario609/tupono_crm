import api from "./axiosInstance";

const ProjectsApi = {
  list: (params) => api.get("/admin/projects", { params }),
  getById: (id) => api.get(`/admin/projects/${id}`),
  create: (payload) => api.post("/admin/projects", payload),
  update: (id, payload) => api.put(`/admin/projects/${id}`, payload),
  remove: (id) => api.delete(`/admin/projects/${id}`),
};

export default ProjectsApi;


