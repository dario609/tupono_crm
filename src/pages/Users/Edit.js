import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import RolesApi from "../../api/rolesApi";
import UsersApi from "../../api/usersApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import { formatPhone, onlyLetters } from "../../utils/formatPhone";


const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone: "",
  organisation: "",
  role_id: "",
  project_id: "",
  hapu: "",
  iwi: "",
  marae: "",
  maunga: "",
  awa: "",
};  

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
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
        const [rolesJson, userJson, hapusJson, projectsJson] = await Promise.all([
          RolesApi.list({ perpage: -1 }),
          UsersApi.getById(id),
          HapuListsApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
          ProjectsApi.list({ perpage: -1 }).catch(() => ({ data: [] })),
        ]);
        setRoles(rolesJson?.data || []);
        setHapus(hapusJson?.data || []);
        let projectsList = [...(projectsJson?.data || [])];
        if (userJson?.success && userJson?.data) {
          const u = userJson.data;
          // Ensure user's current project is in the dropdown (may be missing due to visibility filter)
          const hasUserProject = u.project_id || u.project;
          const userProjectId = String(u.project_id || u.project?._id || "");
          if (hasUserProject && userProjectId && !projectsList.some((p) => String(p._id) === userProjectId)) {
            projectsList = [{ _id: userProjectId, name: u.project?.name || "Current Project" }, ...projectsList];
          }
          // Find hapu name from hapu list if user has hapu
          let hapuValue = "";
          if (Array.isArray(u.hapu) && u.hapu.length > 0 && hapusJson?.data) {
            const userHapuName = u.hapu[0];
            const matchingHapu = hapusJson.data.find(h => (h.hapu_name || h.name || "") === userHapuName);
            if (matchingHapu) {
              hapuValue = matchingHapu.hapu_name || matchingHapu.name || "";
            } else {
              hapuValue = userHapuName;
            }
          }
          setForm({
            first_name: u.first_name || "",
            last_name: u.last_name || "",
            email: u.email || "",
            password: "",
            confirm_password: "",
            phone: u.phone || "",
            organisation: u.organisation || "",
            role_id: u.role_id?._id || u.role_id || "",
            project_id: (u.project_id || u.project?._id) ? String(u.project_id || u.project._id) : "",
            hapu: hapuValue,
            iwi: Array.isArray(u.iwi) ? u.iwi.join(", ") : "",
            marae: Array.isArray(u.marae) ? u.marae.join(", ") : "",
            maunga: Array.isArray(u.maunga) ? u.maunga.join(", ") : "",
            awa: Array.isArray(u.awa) ? u.awa.join(", ") : "",
          });
          setExistingProfile(u.profile_image || "");
        }
        setProjects(projectsList);
      } catch { }
    })();
  }, [id]);

  const setConfirmValidity = (pwd, confirm) => {
    if (!confirmRef.current) return;
    // No password validation - passwords are optional
    confirmRef.current.setCustomValidity("");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === "first_name" || name === "last_name") next = onlyLetters(value).slice(0, 30);
    else if (name === "phone") next = formatPhone(value);
    setForm((prev) => {
      const updated = { ...prev, [name]: next };
      return updated;
    });
  };

  const toArray = (s) => String(s || "").split(/[\n,]/g).map((x)=>x.trim()).filter(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    // No password validation - passwords are optional
    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      // Save hapu as array with single selected hapu name
      fd.set("hapu", JSON.stringify(form.hapu ? [form.hapu] : []));
      fd.set("iwi", JSON.stringify(toArray(form.iwi)));
      fd.set("marae", JSON.stringify(toArray(form.marae)));
      fd.set("maunga", JSON.stringify(toArray(form.maunga)));
      fd.set("awa", JSON.stringify(toArray(form.awa)));
      fd.set("project_id", form.project_id || "");
      if (profileImage) fd.append("profile_image", profileImage);
      const data = await UsersApi.update(id, fd);
      if (data?.success === false) throw new Error(data?.message || "Failed to update user");
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
      const json = await UsersApi.removeProfileImage(id);
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

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Organisation</label>
                        <input type="text" className="form-control" name="organisation" value={form.organisation || ""} onChange={onChange} placeholder="Organisation" maxLength={100} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Project</label>
                        <select className="form-select" name="project_id" value={form.project_id} onChange={onChange}>
                          <option value="">Select Project</option>
                          {projects.map((p) => (
                            <option key={p._id} value={String(p._id)}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kaupapa Māori multi fields */}
                    <div className="col-md-6">
                      <div className="form-group mb-2">
                        <label>Hapū</label>
                        <select className="form-control" name="hapu" value={form.hapu} onChange={onChange}>
                          <option value="">Select Hapū</option>
                          {hapus.map((h) => (
                            <option key={h._id} value={h.hapu_name || h.name || ""}>
                              {h.hapu_name || h.name || ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mb-2">
                        <label>Iwi (comma or newline separated)</label>
                        <textarea className="form-control" rows={2} name="iwi" value={form.iwi} onChange={onChange}></textarea>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Marae (comma or newline separated)</label>
                        <textarea className="form-control" rows={2} name="marae" value={form.marae} onChange={onChange}></textarea>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Maunga (comma or newline separated)</label>
                        <textarea className="form-control" rows={2} name="maunga" value={form.maunga} onChange={onChange}></textarea>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Awa (comma or newline separated)</label>
                        <textarea className="form-control" rows={2} name="awa" value={form.awa} onChange={onChange}></textarea>
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
                    <button type="submit" disabled={loading} className="btn btn-primary btn-rounded btn-fw ml-2" style={{ marginLeft: "5px" }}
                    >{loading ? "Saving..." : "Save"}
                    </button>
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


