import api from "./axiosInstance";

const RoheApi = {
  list: (params) => api.get("/admin/rohe", { params }),
  create: (payload) => api.post("/admin/rohe", payload),
  remove: (id) => api.delete(`/admin/rohe/${id}`),
};

export default RoheApi;


