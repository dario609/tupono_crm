import api from "./axiosInstance";

const TasksApi = {
  list: (params) => api.get("/admin/tasks", { params }),
  assignees: (projectId) => api.get("/admin/tasks/assignees", { params: { projectId } }),
  getById: (id) => api.get(`/admin/tasks/${id}`),
  create: (payload) => api.post("/admin/tasks", payload),
  update: (id, payload) => api.put(`/admin/tasks/${id}`, payload),
  remove: (id) => api.delete(`/admin/tasks/${id}`),
};

export default TasksApi;


