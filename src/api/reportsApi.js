import api from "./axiosInstance";

const ReportsApi = {
  list: (params) => api.get("/admin/reports", { params }),
  getById: (id) => api.get(`/admin/reports/${id}`),
  create: (payload) => api.post("/admin/reports", payload),
  update: (id, payload) => api.put(`/admin/reports/${id}`, payload),
  remove: (id) => api.delete(`/admin/reports/${id}`),

  createReceipt: (payload) =>
    api.post(`/admin/reports/receipts`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateReceipt: (reportId, data) =>
    api.put(`/admin/reports/receipts/${reportId}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteReceipt: (reportId) => api.delete(`/admin/reports/receipts/${reportId}`),

  exportPDF: (id) => api.get(`/admin/reports/${id}/export-pdf`, { responseType: "blob" }),
  sendEmail: (id) => api.post(`/admin/reports/${id}/email`),
  receipts: (reportId, params) => api.get(`/admin/reports/receipts`, { params: { report_id: reportId, ...params } }),

  travelLogs: (reportId, params) =>
    api.get(`/admin/reports/travelLogs/${reportId}`, { params }),
  createTravelLog: (payload) => api.post(`/admin/reports/travelLogs`, payload),
  updateTravelLog: (id, payload) => api.put(`/admin/reports/travelLogs/${id}`, payload),
  deleteTravelLog: (id) => api.delete(`/admin/reports/travelLogs/${id}`),
};

export default ReportsApi;


