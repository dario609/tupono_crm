import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthApi } from "../api/authApi";
import PermissionsApi from "../api/permissionsApi";

const AuthContext = createContext({
  user: null,
  permissions: {},
  loading: true,
  refresh: async () => { },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      setLoading(true);
      const me = await AuthApi.check();
      if (me?.authenticated) setUser(me.user);
      const perms = await PermissionsApi.me();
      setPermissions(perms?.data || {});
    }
    catch (err) {
      console.log("AuthProvider - error loading auth state:", err);
    }
    finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const value = useMemo(() => ({
    user,
    permissions,
    loading,
  }), [user, permissions, loading]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


