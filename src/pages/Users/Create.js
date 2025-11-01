import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const onlyLetters = (s) => s.replace(/[^a-zA-Z\s]/g, "");

const CreateUser = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    city: "",
    country: "",
    zip_code: "",
    address: "",
    role_id: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/roles?perpage=-1", { credentials: "include" });
        const json = await res.json();
        setRoles(json?.data || []);
      } catch {}
    })();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.first_name &&
      form.last_name &&
      form.email &&
      form.password &&
      form.confirm_password &&
      form.role_id &&
      form.password === form.confirm_password
    );
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!canSubmit) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Failed to create user");
      }
      setSuccess("User created successfully");
      setTimeout(() => navigate("/users"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add User</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/users" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
              <i className="ti ti-arrow-circle-left ms-1"></i> Back
            </Link>
          </li>
        </ul>
      </div>

      <section className="card mt-3">
        <div className="row card-body">
          <div className="col-12">
            <div className="box">
              <div className="box-body p-15 pt-0">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show">
                    <ul style={{ listStyle: "none", marginBottom: 0 }}>
                      <li>{success}</li>
                    </ul>
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    <ul style={{ listStyle: "none", marginBottom: 0 }}>
                      <li>{error}</li>
                    </ul>
                  </div>
                )}

                <form onSubmit={onSubmit}>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>First Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="first_name"
                          value={form.first_name}
                          onChange={(e) => onChange({ target: { name: "first_name", value: onlyLetters(e.target.value).slice(0, 30) } })}
                          placeholder="First Name"
                          required
                          maxLength={30}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Last Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="last_name"
                          value={form.last_name}
                          onChange={(e) => onChange({ target: { name: "last_name", value: onlyLetters(e.target.value).slice(0, 30) } })}
                          placeholder="Last Name"
                          required
                          maxLength={30}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={form.email}
                          onChange={onChange}
                          placeholder="Email"
                          required
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group position-relative mb-2">
                        <label>Password <span className="text-danger">*</span></label>
                        <input
                          type={showPwd ? "text" : "password"}
                          className="form-control"
                          name="password"
                          value={form.password}
                          onChange={onChange}
                          placeholder="Password"
                          required
                          maxLength={50}
                          id="password"
                        />
                        <span className="position-absolute end-0 translate-middle-y pe-3" style={{ top: "70%" }}>
                          <i
                            className={`fa ${showPwd ? "fa-eye-slash" : "fa-eye"}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowPwd((s) => !s)}
                          ></i>
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group position-relative mb-2">
                        <label>Confirm Password <span className="text-danger">*</span></label>
                        <input
                          type={showConfirmPwd ? "text" : "password"}
                          className="form-control"
                          name="confirm_password"
                          value={form.confirm_password}
                          onChange={onChange}
                          placeholder="Confirm Password"
                          required
                          maxLength={50}
                          id="confirm_password"
                        />
                        <span className="position-absolute end-0 translate-middle-y pe-3" style={{ top: "70%" }}>
                          <i
                            className={`fa ${showConfirmPwd ? "fa-eye-slash" : "fa-eye"}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowConfirmPwd((s) => !s)}
                          ></i>
                        </span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="phone"
                          value={form.phone}
                          onChange={onChange}
                          placeholder="Phone Number"
                          maxLength={20}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Profile Photo</label>
                        <input type="file" className="form-control" disabled />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>City</label>
                        <input
                          type="text"
                          className="form-control"
                          name="city"
                          value={form.city}
                          onChange={onChange}
                          placeholder="City"
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>County</label>
                        <input
                          type="text"
                          className="form-control"
                          name="country"
                          value={form.country}
                          onChange={onChange}
                          placeholder="County"
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>ZIP Code</label>
                        <input
                          type="text"
                          className="form-control"
                          name="zip_code"
                          value={form.zip_code}
                          onChange={onChange}
                          placeholder="Zip Code"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Address</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address"
                          value={form.address}
                          onChange={onChange}
                          placeholder="Address"
                          maxLength={150}
                        />
                      </div>
                    </div>

                    <div className="col-md-4" id="assign-div">
                      <div className="form-group">
                        <label>Assign Role <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="role_id"
                          value={form.role_id}
                          onChange={onChange}
                          required
                        >
                          <option value="">Select Role</option>
                          {roles.map((r) => (
                            <option key={r._id} value={r._id}>{r.role_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer1 text-center mt-2">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate("/users")}>Cancel</button>
                    <button type="submit" disabled={!canSubmit || loading} className="btn btn-primary btn-rounded btn-fw">{loading ? "Saving..." : "Save"}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CreateUser;


