import React, { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import Swal from "sweetalert2";
import $ from "jquery";
import "jquery-mask-plugin";
import "bootstrap/dist/css/bootstrap.min.css";

const ProfileManagement = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Fetch user details
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/users/${userId}`);
        setUser(data.user);
      } catch (err) {
        setErrors(["Failed to load user data."]);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    $("#phone").mask("(000) 000-0000");
    $("#zip_code").mask("000000");
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setUser({ ...user, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccess("");

    const formData = new FormData();
    Object.entries(user).forEach(([key, val]) => formData.append(key, val));
    formData.append("user_id", user._id);

    try {
      const res = await axios.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(res.data.message || "Profile updated successfully!");
    } catch (err) {
      setErrors([err.response?.data?.message || "Failed to update profile."]);
    }
  };

  if (!user) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container-full">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 card mt-3">
        <div className="col-12 card-body">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb breadcrumb-custom">
              <li className="breadcrumb-item">
                <a href="/dashboard" style={{ textDecoration: "none" }}>
                  Dashboard
                </a>
              </li>
              <li className="breadcrumb-item active">
                <span>Edit Profile</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="card mt-3 h-100 w-100">
        <div className="row card-body">
          <ul
            className="nav border-gradient-tab nav-pills d-inline-flex p-3"
            id="pills-tab"
            style={{ borderBottom: "0px" }}
          >
            <li className="nav-item">
              <button
                className="nav-link d-flex align-items-center px-24 active"
                onClick={() => (window.location.href = "/profile")}
              >
                Edit Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link d-flex align-items-center px-24"
                onClick={() => (window.location.href = "/change-password")}
              >
                Change Password
              </button>
            </li>
          </ul>

          {/* Left profile card */}
          <div className="col-xl-4 col-lg-5">
            <div className="card text-center">
              <div className="card-body">
                <img
                  src={
                    user.profile_image
                      ? `/uploads/users/${user.profile_image}`
                      : "/assets/images/user.jpg"
                  }
                  className="bg-light w-50 h-50 rounded-circle avatar-lg img-thumbnail"
                  alt="profile"
                  style={{
                    objectFit: "cover",
                    height: "200px",
                    width: "200px",
                  }}
                />
                <h4 className="mb-0 mt-2">
                  {user.first_name} {user.last_name}
                </h4>

                <div className="text-start mt-3">
                  <p>
                    <strong>Phone Number:</strong>{" "}
                    <span className="ms-2">{user.phone}</span>
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <span className="ms-2">{user.email}</span>
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    <span className="ms-2">{user.address}</span>
                  </p>
                  <p>
                    <strong>City:</strong>{" "}
                    <span className="ms-2">{user.city}</span>
                  </p>
                  <p>
                    <strong>State:</strong>{" "}
                    <span className="ms-2">{user.state}</span>
                  </p>
                  <p>
                    <strong>County:</strong>{" "}
                    <span className="ms-2">{user.country}</span>
                  </p>
                  <p>
                    <strong>Zip Code:</strong>{" "}
                    <span className="ms-2">{user.zip_code}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="col-xl-8 col-lg-7">
            <div className="card">
              <div className="card-body">
                <div className="tab-content" style={{ borderTop: "1px solid #dee2e6" }}>
                  <div className="tab-pane show active" id="settings">
                    {success && (
                      <div className="alert alert-success alert-dismissible fade show">
                        <ul style={{ listStyle: "none", marginBottom: 0 }}>
                          <li>{success}</li>
                        </ul>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="alert"
                        ></button>
                      </div>
                    )}
                    {errors.length > 0 && (
                      <div className="alert alert-danger alert-dismissible fade show">
                        <ul style={{ listStyle: "none", marginBottom: 0 }}>
                          {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="btn-close"
                          data-bs-dismiss="alert"
                        ></button>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                      <h5 className="mb-4 display-5">
                        <i className="mdi mdi-account-circle me-1"></i> Personal Info
                      </h5>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            First Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="first_name"
                            value={user.first_name}
                            onChange={handleChange}
                            maxLength="50"
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Last Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="last_name"
                            value={user.last_name}
                            onChange={handleChange}
                            maxLength="50"
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-12 mb-3">
                          <label className="form-label">
                            Address <span className="text-danger">*</span>
                          </label>
                          <textarea
                            className="form-control"
                            name="address"
                            rows="2"
                            maxLength="250"
                            value={user.address}
                            onChange={handleChange}
                            required
                          ></textarea>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            City <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="city"
                            value={user.city}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            State <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="state"
                            value={user.state}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            County <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="country"
                            value={user.country}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Zip Code <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            id="zip_code"
                            className="form-control"
                            name="zip_code"
                            value={user.zip_code}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            Phone Number <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            id="phone"
                            className="form-control"
                            name="phone"
                            value={user.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Profile Image</label>
                          <input
                            type="file"
                            className="form-control"
                            name="profile_image"
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          type="submit"
                          className="btn btn-primary btn-rounded btn-fw"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfileManagement;