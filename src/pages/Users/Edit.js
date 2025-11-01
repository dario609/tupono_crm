import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const onlyLetters = (s) => s.replace(/[^a-zA-Z\s]/g, "");
const onlyDigits = (s) => s.replace(/\D/g, "");
const formatPhone = (s) => {
  const d = onlyDigits(s).slice(0, 10);
  const a = d.slice(0, 3), b = d.slice(3, 6), c = d.slice(6, 10);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `(${a}) ${b}`;
  return `(${a}) ${b}-${c}`;
};
const formatZip = (s) => onlyDigits(s).slice(0, 10);

const EditUser = () => {
  const { id } = useParams();
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
  const [profileImage, setProfileImage] = useState(null);
  const [existingProfile, setExistingProfile] = useState("");
  const formRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, userRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/roles?perpage=-1", { credentials: "include" }),
          fetch(`http://localhost:5000/api/admin/users/${id}`, { credentials: "include" }),
        ]);
        const rolesJson = await rolesRes.json();
        const userJson = await userRes.json();
        setRoles(rolesJson?.data || []);
        if (userJson?.success && userJson?.data) {
          const u = userJson.data;
          setForm({
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            email: u.email || "",
            password: "",
            confirm_password: "",
            phone: u.phone || "",
            city: u.city || "",
            country: u.country || "",
            zip_code: u.zip_code || "",
            address: u.address || "",
            role_id: u.role_id?._id || u.role_id || "",
          });
          setExistingProfile(u.profile_image || "");
        }
      } catch { }
    })();
  }, [id]);

  const setConfirmValidity = (pwd, confirm) => {
    if (!confirmRef.current) return;
    if ((confirm || pwd) && pwd !== confirm) confirmRef.current.setCustomValidity("Passwords do not match");
    else confirmRef.current.setCustomValidity("");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === "first_name" || name === "last_name") next = onlyLetters(value).slice(0, 30);
    else if (name === "phone") next = formatPhone(value);
    else if (name === "zip_code") next = formatZip(value);
    setForm((prev) => {
      const updated = { ...prev, [name]: next };
      if (name === "password" || name === "confirm_password") {
        setConfirmValidity(updated.password, updated.confirm_password);
      }
      return updated;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    if (form.password !== form.confirm_password) {
      setConfirmValidity(form.password, form.confirm_password);
      formRef.current?.reportValidity();
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (profileImage) fd.append("profile_image", profileImage);
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Failed to update user");
      setSuccess("User updated successfully");
      setTimeout(() => navigate("/users"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const removeProfile = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${id}/profile-image/remove`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json?.success) setExistingProfile("");
    } catch {}
  };

  const resolveImageUrl = (p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return `http://localhost:5000${p.startsWith('/') ? p : '/' + p}`;
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Edit User</h6>
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

                <form ref={formRef} onSubmit={onSubmit} noValidate>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>First Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" name="first_name" value={form.first_name} onChange={onChange} placeholder="First Name" required maxLength={30} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Last Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" name="last_name" value={form.last_name} onChange={onChange} placeholder="Last Name" required maxLength={30} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Email <span className="text-danger">*</span></label>
                        <input type="email" className="form-control" name="email" value={form.email} onChange={onChange} placeholder="Email" required maxLength={80} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group position-relative mb-2">
                        <label>Password</label>
                        <input type={showPwd ? "text" : "password"} className="form-control" name="password" value={form.password} onChange={onChange} placeholder="Password" maxLength={50} id="password" />
                        <span className="position-absolute end-0 pe-3" style={{ top: "60%" }}>
                          <i className={`fa ${showPwd ? "fa-eye-slash" : "fa-eye"}`} style={{ cursor: "pointer" }} onClick={() => setShowPwd((s) => !s)}></i>
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group position-relative mb-2">
                        <label>Confirm Password</label>
                        <input type={showConfirmPwd ? "text" : "password"} className="form-control" name="confirm_password" value={form.confirm_password} onChange={onChange} placeholder="Confirm Password" maxLength={50} id="confirm_password" ref={confirmRef} />
                        <span className="position-absolute end-0 pe-3" style={{ top: "60%" }}>
                          <i className={`fa ${showConfirmPwd ? "fa-eye-slash" : "fa-eye"}`} style={{ cursor: "pointer" }} onClick={() => setShowConfirmPwd((s) => !s)}></i>
                        </span>
                      </div>
                    </div>
                    <input type="hidden" name="id" value={id} />

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="text" className="form-control" name="phone" value={form.phone} onChange={onChange} placeholder="Phone Number" maxLength={20} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Profile Photo</label>
                        <input type="file" className="form-control" name="profile_image" accept="image/*" onChange={(e) => setProfileImage(e.target.files?.[0] || null)} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>City</label>
                        <input type="text" className="form-control" name="city" value={form.city} onChange={onChange} placeholder="City" maxLength={50} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>County</label>
                        <input type="text" className="form-control" name="country" value={form.country} onChange={onChange} placeholder="County" maxLength={50} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>ZIP Code</label>
                        <input type="text" className="form-control" name="zip_code" value={form.zip_code} onChange={onChange} placeholder="Zip Code" maxLength={10} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Address</label>
                        <input type="text" className="form-control" name="address" value={form.address} onChange={onChange} placeholder="Address" maxLength={150} />
                      </div>
                    </div>

                    <div className="col-md-4" id="assign-div">
                      <div className="form-group">
                        <label>Assign Role <span className="text-danger">*</span></label>
                        <select className="form-select" name="role_id" value={form.role_id} onChange={onChange} required>
                          <option value="">Select Role</option>
                          {roles.map((r) => (
                            <option key={r._id} value={r._id}>{r.role_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {existingProfile && (
                      <div className="col-md-12 mb-3" id="profile_image_div">
                        Uploaded Profile Image:<br />
                        <img src={resolveImageUrl(existingProfile)} className="bg-light mt-2 avatar-lg img-thumbnail" alt="profile" style={{ objectFit: "contain", height: 150, width: 150 }} />
                        <span className="text-danger" style={{ position: "relative", top: -55, right: 28, cursor: "pointer", backgroundColor: "#fff", borderRadius: "50%", padding: "2px 6px", border: "1px solid #00000047" }} onClick={removeProfile}>X</span>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer1 text-center mt-2">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate("/users")}>Cancel</button>
                    <button type="submit" disabled={loading} className="btn btn-primary btn-rounded btn-fw">{loading ? "Saving..." : "Save"}</button>
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

export default EditUser;


