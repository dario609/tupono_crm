import api from "./axiosInstance";

const UsersApi = {
  list: (params) => api.get("/admin/users", { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  getUserReport: (id) => api.get(`/admin/users/${id}/report`),
  create: (formData) => api.post("/admin/users", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/admin/users/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id, status) => api.post(`/admin/users/${id}/status`, { status }),
  removeProfileImage: (id) => api.post(`/admin/users/${id}/profile-image/remove`),
  updateProfile: (id, formData) => api.put(`/admin/users/${id}/profile`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  changePassword: (id, data) => api.post(`/admin/users/${id}/change-password`, data),
  sendBulkEmail: (data) => api.post("/admin/users/send-bulk-email", data),
};

export default UsersApi;


