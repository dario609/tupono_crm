import api from "./axiosInstance";

export const RolesApi = {
  async getRoles({ search = "", perpage = 10, page = 1 }) {
    return api.get("/admin/roles", {
      params: { search, perpage, page },
    });
  },
};
