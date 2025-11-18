import api from "./axiosInstance";

export const RolesApi = {
  // Compat alias used by pages: list(params)
  list(params = {}) {
    const { search = "", perpage = 10, page = 1 } = params || {};
    return api.get("/admin/roles", { params: { search, perpage: perpage || "", page } });
  },
  async getRoles({ search = "", perpage = 10, page = 1 }) {
    return api.get("/admin/roles", {
      params: { 
          search,
          perpage: perpage || "", 
          page 
        },
    });
  },
  async editRole({ roleId, role_name }) {
    return api.post(`/admin/roles/edit`, { roleId  });
  },

  async getPermissions({ roleId }) {
    return api.get(`/admin/roles/${roleId}/permissions`);
  },

  async savePermissions({ roleId, permissions }) {
    return api.post(`/admin/roles/${roleId}/permissions`, permissions);
  },

};

export default RolesApi;
