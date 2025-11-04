import api from "./axiosInstance";

const PermissionsApi = {
  me: () => api.get("/permissions/me"),
};

export default PermissionsApi;


