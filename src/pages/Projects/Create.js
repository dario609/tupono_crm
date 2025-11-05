import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import RoheApi from "../../api/roheApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";

const CreateProject = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rohes, setRohes] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    owner: "",
    team_id: "",
    rohe: "",
    hapus: [],
    report_types: [],
    report_phase: "Phase 1",
    status: "0",
    description: "",
  });


  const [hapuInput, setHapuInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [uJson, tJson, rJson] = await Promise.all([
          UsersApi.list({ perpage: -1 }),
          TeamsApi.list({ perpage: -1 }),
          RoheApi.list({ perpage: -1 }),
        ]);
        setUsers(uJson?.data || []);
        setTeams(tJson?.data || []);
        setRohes(rJson?.data || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!form.rohe) { setHapus([]); return; }
      try {
        const json = await HapuListsApi.list({ rohe_id: form.rohe });
        setHapus(json?.data || []);
      } catch {}
    })();
  }, [form.rohe]);

  // Load team members when a team is selected
  useEffect(() => {
    (async () => {
      if (!form.team_id) { setTeamMembers([]); return; }
      try {
        const json = await TeamsApi.getById(form.team_id);
        const members = json?.data?.members || [];
        setTeamMembers(members);
      } catch {
        setTeamMembers([]);
      }
    })();
  }, [form.team_id]);

  const formatDateForDisplay = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  useEffect(() => {
    const endInput = document.getElementById("end_date");
    if (endInput) endInput.min = form.start_date || "";
  }, [form.start_date]);

  const onChange = (e) => {
    const { name, value, multiple, options, type, checked } = e.target;
    if (multiple) {
      const values = Array.from(options).filter(o => o.selected).map(o => o.value);
      setForm((f) => ({ ...f, [name]: values }));
      return;
    }
    // no report type handling
    setForm((f) => ({ ...f, [name]: value }));
  };

  // removed add/remove Rohe/Hapu functions

  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';
  const parseHapuIdFromOption = (val) => {
    const match = hapus.find((x) => (x?.name || "").toLowerCase() === String(val).toLowerCase());
    return match?._id || null;
  };
  const addHapuByLabel = (val) => {
    const id = parseHapuIdFromOption(val);
    if (!id) return setHapuInput("");
    setForm((f) => ({ ...f, hapus: f.hapus.includes(id) ? f.hapus : [...f.hapus, id] }));
    setHapuInput("");
  };
  const removeHapuFromList = (id) => setForm((f) => ({ ...f, hapus: f.hapus.filter((x) => x !== id) }));
  // removed Assigned To helpers

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        owner: form.owner || undefined,
        team_id: form.team_id || undefined,
        rohe: form.rohe || undefined,
        hapus: form.hapus,
        status: form.status,
        description: form.description,
      };
      const data = await ProjectsApi.create(payload);
      if (data?.success === false) throw new Error(data?.message || "Failed to create project");
      setSuccess("Project created successfully");
      setTimeout(() => navigate("/projects"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add New Project</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/projects" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
              <i className="ti ti-arrow-circle-left ms-1"></i> Back
            </Link>
          </li>
        </ul>
      </div>

      <section className="card mt-3">
        <div className="row card-body pt-0">
          <div className="col-12">
            <div className="box">
              <div className="box-body p-15 pt-0">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show" style={{marginTop: '10px'}}>
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
                  <div className="row p-1">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Project Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" name="name" value={form.name} onChange={onChange} maxLength={150} placeholder="Project Name" required />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Start Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="start_date" name="start_date" value={form.start_date} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e)=>e.target.showPicker && e.target.showPicker()} onClick={(e)=>e.target.showPicker && e.target.showPicker()} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>End Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="end_date" name="end_date" value={form.end_date} onChange={onChange} required placeholder="dd/mm/yyyy" onFocus={(e)=>e.target.showPicker && e.target.showPicker()} onClick={(e)=>e.target.showPicker && e.target.showPicker()} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Project Owner</label>
                        <select className="form-control form-select" name="owner" value={form.owner} onChange={onChange}>
                          <option value="">Select Owner</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>{`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Assigned To removed */}

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Assign Team</label>
                        <select className="form-control form-select" name="team_id" value={form.team_id} onChange={onChange}>
                          <option value="">Select Team</option>
                          {teams.map((t) => (
                            <option key={t._id} value={t._id}>{t.title}</option>
                          ))}
                        </select>
                        {teamMembers.length > 0 && (
                          <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {teamMembers.map((m) => (
                              <span key={`tm-${m._id}`} className="badge badge-primary" style={{ padding: '3px 10px' }}>{m.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Status <span className="text-danger">*</span></label>
                        <select className="form-control form-select" name="status" value={form.status} onChange={onChange} required>
                          <option value="0">Active</option>
                          <option value="1">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Assign a Rohe</label>
                        <select className="form-control form-select" name="rohe" value={form.rohe} onChange={onChange}>
                          <option value="">Select Rohe</option>
                          {rohes.map((r) => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Assign Hapū (multiple)</label>
                        <input
                          className="form-control"
                          placeholder="Search and select hapū"
                          list="hapuOptions"
                          value={hapuInput}
                          onChange={(e) => setHapuInput(e.target.value)}
                          onBlur={(e) => addHapuByLabel(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHapuByLabel(hapuInput); } }}
                          disabled={!form.rohe}
                        />
                        <datalist id="hapuOptions">
                          {hapus.map((h) => (
                            <option key={`hapu-${h._id}`} value={h.name} />
                          ))}
                        </datalist>
                        {form.hapus?.length > 0 && (
                          <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {form.hapus.map((hid) => {
                              const h = hapus.find((x) => x._id === hid);
                              if (!h) return null;
                              return (
                                <span key={`tag-hapu-${hid}`} className="badge badge-primary" style={{ padding: '0px 7px' }}>
                                  {h.name}
                                  <button type="button" className="btn btn-link btn-sm" onClick={() => removeHapuFromList(hid)} style={{ color: '#fff', textDecoration: 'none', marginLeft: 6, padding: '3px 5px' }}>×</button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    

                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" maxLength={500} id="description" name="description" value={form.description} onChange={onChange} placeholder="Description" rows={3}></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer1 text-center mt-2">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" style={{marginRight: '5px'}} onClick={() => navigate("/projects")}>Cancel</button>
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

export default CreateProject;


