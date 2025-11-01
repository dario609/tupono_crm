import React, { useState } from "react";
import logo from "../../../assets/images/logo.png";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "../../../api/authApi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  const submitForgotForm = async () => {
    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please enter your email address!",
      });
      return;
    }

    try {
      showLoader();
      const res = await AuthApi.resetPassword(email);

      hideLoader();

    //   if (res.data.success === "true" || res.data.success === true) {
    //     Swal.fire({
    //       icon: "success",
    //       title: "Success",
    //       text: res.data.message || "Check your email for the reset link.",
    //     }).then(() => navigate("/"));
    //   } 
    //   else {
    //     Swal.fire({
    //       icon: "error",
    //       title: "Error!",
    //       text: res.data.message || "Something went wrong, please try again.",
    //     });
    //   }
    } catch (err) {
        console.log(err)
      hideLoader();
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          err.response?.data?.message ||
          "Something went wrong, please try again.",
      });
    }
  };

  return (
    <div className="container-scroller">
      {/* Loader Overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}

      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="content-wrapper d-flex align-items-center auth px-0">
          <div className="row w-100 mx-0">
            <div className="col-lg-4 mx-auto">
              <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                <div className="brand-logo text-center mb-3">
                  <img src={logo} alt="Tupono Consulting" />
                </div>
                <h4 className="text-center mb-4">Forgot Password</h4>

                <div className="form-group">
                  <div className="input-group mb-3">
                    <span className="input-group-text bg-transparent">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-person"
                        viewBox="0 0 16 16"
                      >
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      className="form-control ps-15 bg-transparent"
                      placeholder="Email ID"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-primary w-100 mt-3 btn-rounded"
                      onClick={() => navigate("/")}
                    >
                      Back To Login
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className="btn btn-primary w-100 mt-3 btn-rounded"
                      onClick={submitForgotForm}
                    >
                      Get Reset Link
                    </button>
                  </div>
                </div>

                <div className="row mt-5">
                  <div className="col-12 mt-xl-2">
                    <p className="text-muted fw-medium text-center">
                      Copyright {new Date().getFullYear()} Tupono Consulting
                      LTD. All Rights Reserved.
                      <br />
                      Designed and Developed by{" "}
                      <a
                        href="https://www.connectinfosoft.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        Connect Infosoft
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


