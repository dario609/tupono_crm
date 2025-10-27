// src/routes/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthApi } from "./authApi";

const PrivateRoute = () => {
  const [isAuth, setIsAuth] = useState(null); // null = loading

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await AuthApi.check()
        setIsAuth(res.authenticated);
      } catch (err) {
        setIsAuth(false);
      }
    };
    verifyAuth();
  }, []);
  if (isAuth === null) return <div></div>; // you can replace with spinner

  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
