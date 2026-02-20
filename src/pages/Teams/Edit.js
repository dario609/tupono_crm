import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import UsersApi from "../../api/usersApi";
import TeamsApi from "../../api/teamsApi";
import HapuListsApi from "../../api/hapulistsApi";

const initialForm = {
  title: "",
  status: "active",
  hapu: "",
  description: "",
  user_id: [],
}
const EditTeam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [titleGhost, setTitleGhost] = useState("");
  const [descGhost, setDescGhost] = useState("");

  const userLabel = (u) => `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'User';
  const userHapus = (u) => {
    if (Array.isArray(u?.hapu)) return u.hapu;
    if (typeof u?.hapu === "string" && u.hapu.trim()) return [u.hapu.trim()];
    return [];
  };
  const normalizedSelectedHapu = String(form.hapu || "").toLowerCase().trim();
  const filteredUsers = users.filter((u) =>
    userHapus(u).some((h) => String(h).toLowerCase().trim() === normalizedSelectedHapu)
  );

  useEffect(() => {
    (async () => {
      try {
        const [uJson, hapusJson, tJson] = await Promise.all([
          UsersApi.list({ perpage: -1 }),
          HapuListsApi.list({ perpage: -1 }),
          TeamsApi.getById(id),
        ]);
        setUsers(uJson?.data || []);
        setHapus(hapusJson?.data || []);

        if (tJson?.data) {
          const teamHapu = tJson.data.hapu && String(tJson.data.hapu).trim() ? tJson.data.hapu : "";
          setForm({
            title: tJson.data.title || "",
            status: tJson.data.status || "active",
            hapu: teamHapu,
            description: tJson.data.description || "",
            user_id: Array.isArray(tJson.data.user_id) ? tJson.data.user_id : [],
          });
        }
      } catch { }
    })();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === "hapu") {
      setForm((f) => ({ ...f, hapu: value, user_id: [] }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSuggest = (_field, setter) => () => setter("");

  const canSubmit =
    form.title.trim().length > 0 &&
    String(form.status || "").trim().length > 0 &&
    String(form.hapu || "").trim().length > 0 &&
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
      setError("Please fill Team Name, Status, Select Hapu and Select Team members.");
      return;
    }
    try {
      setLoading(true);
      const data = await TeamsApi.update(id, form);
      if (data?.success === false) throw new Error(data?.message || "Failed to update team");
      setSuccess("Team updated successfully");
      setTimeout(() => navigate("/teams"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Edit Team</h6>
        <div>
          <Link to="/teams" className="btn btn-primary btn-rounded btn-fw" style={{ fontSize: '15px' }}>
            <i className="ti ti-arrow-circle-left ms-1"></i> Back
          </Link>
        </div>
      </div>

      <div className="row card-body pt-0">
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
                        <label>Select Hapu <span className="text-danger">*</span></label>
                        <select
                          name="hapu"
                          className="form-control form-select"
                          required
                          value={form.hapu}
                          onChange={onChange}
                        >
                          <option value="">Select Hapu</option>
                          {hapus.map((h) => {
                            const hapuName = h?.hapu_name || h?.name || "";
                            if (!hapuName) return null;
                            return (
                              <option key={h._id || hapuName} value={hapuName}>
                                {hapuName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="col-md-6 mt-0">
                      <div className="form-group">
                        <label className="form-label">Select Team members <span className="text-danger">*</span></label>
                        <Select
                          isMulti
                          options={filteredUsers.map((u) => ({ value: u._id, label: userLabel(u) }))}
                          value={form.user_id.map((uid) => {
                            const u = users.find((x) => x._id === uid);
                            return u ? { value: u._id, label: userLabel(u) } : null;
                          }).filter(Boolean)}
                          onChange={(selected) => setForm((f) => ({ ...f, user_id: selected ? selected.map((s) => s.value) : [] }))}
                          isDisabled={!form.hapu}
                          placeholder={form.hapu ? "Select team members..." : "Select hapu first"}
                          noOptionsMessage={() => (form.hapu ? "No users in this hapu" : "Select hapu first")}
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
                          <textarea className="form-control" maxLength={500} id="description" name="description" placeholder="Description" autoComplete="off" spellCheck={false} rows={3} value={form.description} onChange={(e) => { onChange(e); handleSuggest('description', setDescGhost)(e); }}></textarea>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="modal-footer1 text-center mt-3">
                  <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate('/teams')}>Cancel</button>
                  <button type="submit" disabled={loading || !canSubmit} className="btn btn-primary btn-rounded btn-fw" style={{ marginLeft: '8px' }}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTeam;


