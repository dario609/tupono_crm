// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { AuthApi } from "../../api/authApi";
import logo from "../../assets/images/logo.png";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  useEffect(() => {
   const logoutMsg = sessionStorage.getItem("logoutMessage")
   if(logoutMsg) {
    setMessage({type: 'success', text: logoutMsg})
    sessionStorage.removeItem("logoutMessage")
   }
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      await AuthApi.login({email, password, rememberme: remember})
      setMessage({ type: "success", text: "Login successful!" });
      setTimeout(() => (window.location.href = "/dashboard"), 300);
    } 
    catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                <div className="brand-logo text-center mb-3">
                  <img src={logo} alt="Tupono Consulting Ltd." />
                </div>

                <h4 className="text-center">Sign in to continue.</h4>

                {message.text && (
                  <div
                    className={`alert alert-${
                      message.type === "success" ? "success" : "danger"
                    } alert-dismissible fade show mt-3`}
                  >
                    <ul style={{ listStyle: "none", marginBottom: 0 }}>
                      <li>{message.text}</li>
                    </ul>
                    <button
                      type="button"
                      className="btn-close text-white"
                      onClick={() => setMessage({ type: "", text: "" })}
                    ></button>
                  </div>
                )}

                <form className="pt-3" onSubmit={handleSubmit}>
                  <div className="input-group align-items-stretch pb-4">
                    <div className="input-group-prepend bg-transparent">
                      <span className="input-group-text bg-transparent border-right-0">
                        <i className="ti-user text-primary"></i>
                      </span>
                    </div>
                    <input
                      type="email"
                      required
                      className="form-control form-control-lg"
                      placeholder="Email ID"
                      style={{ fontSize: "0.9375rem" }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="input-group align-items-stretch">
                    <div className="input-group-prepend bg-transparent">
                      <span className="input-group-text bg-transparent border-right-0">
                        <i className="ti-lock text-primary"></i>
                      </span>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="form-control form-control-lg"
                      placeholder="Password"
                      style={{ fontSize: "0.9375rem" }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      className="input-group-text bg-transparent"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`fa ${
                          showPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                      ></i>
                    </span>
                  </div>

                  <div className="mt-3 d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-block btn-primary btn-lg fw-medium auth-form-btn"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="d-flex justify-content-between align-items-center my-2">
                    <div className="form-check" style={{ marginTop: "15px" }}>
                      <label className="form-check-label text-muted">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                        />{" "}
                        Keep me signed in
                      </label>
                    </div>
                    <a
                      href="/forgot-password"
                      className="auth-link text-black"
                      style={{ textDecoration: "none" }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
