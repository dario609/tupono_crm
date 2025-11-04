import api from "./axiosInstance";

const HapuListsApi = {
  list: (params) => api.get("/admin/hapulists", { params }),
  create: (payload) => api.post("/admin/hapulists", payload),
  remove: (id) => api.delete(`/admin/hapulists/${id}`),
};

export default HapuListsApi;


