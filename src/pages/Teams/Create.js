import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import ProjectsApi from "../../api/projectsApi";

const CreateTeam = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    title: "",
    status: "active",
    project_id: "",
    description: "",
    user_id: [],
  });

  const [titleGhost, setTitleGhost] = useState("");
  const [descGhost, setDescGhost] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const projectsJson = await ProjectsApi.list({ perpage: -1 });
        setProjects(projectsJson?.data || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!form.project_id) {
      setUsers([]);
      return;
    }
    (async () => {
      try {
        const usersJson = await UsersApi.list({ perpage: -1, project: form.project_id });
        setUsers(usersJson?.data || []);
      } catch {
        setUsers([]);
      }
    })();
  }, [form.project_id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "project_id") {
      setForm((f) => ({ ...f, project_id: value, user_id: [] }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSuggest = (field, setter) => (e) => setter("");

  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';

  const canSubmit =
    form.title.trim().length > 0 &&
    String(form.status || "").trim().length > 0 &&
    String(form.project_id || "").trim().length > 0 &&
    form.user_id.length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    if (!canSubmit) {
      setError("Please fill Team Name, Status, Select Project and Select Team members.");
      return;
    }
    try {
      setLoading(true);
      const data = await TeamsApi.create(form);
      if (data?.success === false) throw new Error(data?.message || "Failed to create team");
      setSuccess("Team created successfully");
      setTimeout(() => navigate("/teams"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add Team</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/teams" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
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

                <form ref={formRef} onSubmit={onSubmit} noValidate className="col-md-12">
                  <div className="modal-body pt-2">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Team Name <span className="text-danger">*</span></label>
                          <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
                            <pre className="autocomplete-shadow" style={{ position: 'absolute', top: 0, left: 0, padding: '0.375rem 0.75rem', zIndex: 1, color: 'rgba(0,0,0,0.3)', width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', overflow: 'hidden', margin: 0, lineHeight: '22px', fontSize: 14 }}>{titleGhost}</pre>
                            <input type="text" className="form-control" placeholder="Enter Team Name" name="title" id="title" autoComplete="off" spellCheck={false} required maxLength={80} value={form.title} onChange={(e) => { onChange(e); handleSuggest('title', setTitleGhost)(e); }} />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group mb-2">
                          <label>Status <span className="text-danger">*</span></label>
                          <select name="status" className="form-control form-select" required value={form.status} onChange={onChange}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6 mt-0">
                        <div className="form-group mb-2">
                          <label>Select Project <span className="text-danger">*</span></label>
                          <select
                            name="project_id"
                            className="form-control form-select"
                            required
                            value={form.project_id}
                            onChange={onChange}
                          >
                            <option value="">Select Project</option>
                            {projects.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="col-md-6 mt-0">
                        <div className="form-group">
                          <label className="form-label">Select Team members <span className="text-danger">*</span></label>
                          <Select
                            isMulti
                            options={users.map((u) => ({ value: u._id, label: userLabel(u) }))}
                            value={form.user_id.map((id) => {
                              const u = users.find((x) => x._id === id);
                              return u ? { value: u._id, label: userLabel(u) } : null;
                            }).filter(Boolean)}
                            onChange={(selected) => setForm((f) => ({ ...f, user_id: selected ? selected.map((s) => s.value) : [] }))}
                            isDisabled={!form.project_id}
                            placeholder={form.project_id ? "Select team members..." : "Select project first"}
                            noOptionsMessage={() => (form.project_id ? "No users in this project" : "Select project first")}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="mb-0">Description</label>
                          <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
                            <pre className="textarea-autocomplete-shadow" style={{ position: 'absolute', top: 0, left: 0, padding: '0.375rem 0.75rem', zIndex: 1, color: 'rgba(0,0,0,0.3)', width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', pointerEvents: 'none', overflow: 'hidden', lineHeight: '39px', fontSize: 12, margin: 0 }}>{descGhost}</pre>
                            <textarea className="form-control" maxLength={400} id="description" name="description" placeholder="Description" autoComplete="off" spellCheck={false} rows={3} value={form.description} onChange={(e) => { onChange(e); handleSuggest('description', setDescGhost)(e); }}></textarea>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="modal-footer1 text-center mt-3">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate('/teams')}>Cancel</button>
                    <button type="submit" disabled={loading || !canSubmit} className="btn btn-primary btn-rounded btn-fw" style={{marginLeft: '8px'}}>{loading ? 'Saving...' : 'Save'}</button>
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

export default CreateTeam;


