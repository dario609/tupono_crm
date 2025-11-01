import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  user: null,
  permissions: {},
  loading: true,
  refresh: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      // 1) Check current user
      const uRes = await fetch("http://localhost:5000/api/auth/check", {
        method: "GET",
        credentials: "include",
      });
      if (uRes.ok) {
        const uJson = await uRes.json();
        if (uJson?.authenticated) setUser(uJson.user);
      }

      // 2) Load permissions map
      const pRes = await fetch("http://localhost:5000/api/permissions/me", {
        method: "GET",
        credentials: "include",
      });
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPermissions(pJson?.data || {});
      }
    } finally {
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
    refresh: load,
  }), [user, permissions, loading]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


