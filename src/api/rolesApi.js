import api from "./axiosInstance";

export const RolesApi = {
  async getRoles({ search = "", perpage = 10, page = 1 }) {
    return api.get("/admin/roles", {
      params: { 
          search,
          perpage: perpage || "", 
          page 
        },
    });
  },
  async manageRoleStatus({ roleId }) {
    return api.put(`/admin/roles/${roleId}/status`,{ roleId });
  },

  async deleteRole({ roleId }) {
    return api.delete(`/admin/roles/${roleId}`);
  },

  async createRole({role_name}) {
    return api.post(`/admin/roles/create`,{
      role_name: role_name  
    });
  }
};
