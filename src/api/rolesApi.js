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
  async createRole({ role_name }) {
    return api.post("/admin/roles/create", { role_name });
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

  async deleteRole({ roleId }) {
    return api.delete(`/admin/roles/${roleId}`);
  },

  async manageRoleStatus({ roleId }) {
    return api.put(`/admin/roles/${roleId}/status`, { roleId });
  },
};

export default RolesApi;
