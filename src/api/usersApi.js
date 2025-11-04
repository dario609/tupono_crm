import api from "./axiosInstance";

const UsersApi = {
  list: (params) => api.get("/admin/users", { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  create: (formData) => api.post("/admin/users", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/admin/users/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id, status) => api.post(`/admin/users/${id}/status`, { status }),
  removeProfileImage: (id) => api.post(`/admin/users/${id}/profile-image/remove`),
};

export default UsersApi;


