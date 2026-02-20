import api from "./axiosInstance";

const HapuListsApi = {
  list: (params) => api.get("/admin/hapulists", { params }),
  getDetail: (id) => api.get(`/admin/hapulists/${id}/detail`),
  create: (payload) => api.post("/admin/hapulists", payload),
  remove: (id) => api.delete(`/admin/hapulists/${id}`),
};

export default HapuListsApi;


