import api from "./axiosInstance";

const EngagementApi = {
  list: (params) => api.get("/admin/engagements", { params }),
  create: (formData) =>
    api.post("/admin/engagements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default EngagementApi;