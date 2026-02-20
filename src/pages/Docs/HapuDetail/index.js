import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import HapuListsApi from "../../../api/hapulistsApi";
import "./HapuDetail.css";

const HapuDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await HapuListsApi.getDetail(id);
        setData(res?.data || null);
      } catch (err) {
        setError(err.message || "Failed to load Hapū details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="card mt-3">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mt-2 mb-0">Loading Hapū details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card mt-3">
        <div className="card-body text-center py-5">
          <i className="ti ti-alert-circle text-danger" style={{ fontSize: 48 }} />
          <p className="text-danger mt-2 mb-2">{error || "Hapū not found"}</p>
          <Link to="/docs/rohe-hapu" className="btn btn-outline-primary">
            <i className="ti ti-arrow-left me-1" /> Back to Rohe & Hapū
          </Link>
        </div>
      </div>
    );
  }

  const { hapu, users, teams, projects, documents } = data;
  const roheName = hapu?.rohe?.name || "—";

  return (
    <div className="card mt-3">
      {/* Header */}
      <div className="card-body border-bottom bg-light">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              <i className="ti ti-arrow-left" />
            </button>
            <div>
              <h5 className="fw-semibold mb-0" style={{ color: "#1a1a2e" }}>
                {hapu?.name || "Hapū"}
              </h5>
              <small className="text-muted">Region: {roheName}</small>
            </div>
          </div>
          <Link to="/docs/rohe-hapu" className="btn btn-primary btn-sm">
            <i className="ti ti-map-pin me-1" /> Rohe & Hapū
          </Link>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-4">
          {/* Users */}
          <div className="col-lg-6">
            <div className="hapu-section border rounded-3 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                
                <div>
                  <h6 className="fw-semibold mb-0">Users</h6>
                  <small className="text-muted">{users?.length || 0} members</small>
                </div>
              </div>
              {users?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {users.map((u) => (
                    <li key={u._id} className="list-group-item px-0 py-2 border-0 hapu-list-item">
                      <Link to={`/users/${u._id}/edit`} className="text-decoration-none text-dark">
                        {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email || "User"}
                      </Link>
                      {u.email && <small className="text-muted d-block">{u.email}</small>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0 small">No users in this Hapū</p>
              )}
            </div>
          </div>

          {/* Teams */}
          <div className="col-lg-6">
            <div className="hapu-section border rounded-3 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
               
                <div>
                  <h6 className="fw-semibold mb-0">Teams</h6>
                  <small className="text-muted">{teams?.length || 0} teams</small>
                </div>
              </div>
              {teams?.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {teams.map((t) => (
                    <li key={t._id} className="list-group-item px-0 py-2 border-0 hapu-list-item">
                      <Link to={`/teams/${t._id}/edit`} className="text-decoration-none text-dark fw-medium">
                        {t.title || "Team"}
                      </Link>
                      <span className={`badge ms-2 ${t.status === "active" ? "bg-success" : "bg-secondary"}`}>
                        {t.status || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0 small">No team from this Hapū</p>
              )}
            </div>
          </div>

          {/* Projects */}
          <div className="col-12">
            <div className="hapu-section border rounded-3 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="hapu-section-icon bg-info bg-opacity-10 text-info">
                  <i className="ti ti-briefcase text-white" />
                </span>
                <div>
                  <h6 className="fw-semibold mb-0">Projects</h6>
                  <small className="text-muted">{projects?.length || 0} projects</small>
                </div>
              </div>
              {projects?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Owner</th>
                        <th>Team</th>
                        <th>Status</th>
                        <th>Dates</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p._id} className="hapu-list-item">
                          <td>
                            <Link to={`/projects/${p._id}/edit`} className="text-decoration-none fw-medium">
                              {p.name || "—"}
                            </Link>
                          </td>
                          <td>{p.owner ? `${p.owner.first_name ?? ""} ${p.owner.last_name ?? ""}`.trim() || p.owner.email : "—"}</td>
                          <td>{p.team_id?.title || "—"}</td>
                          <td>
                            <span className={`badge ${p.status === "active" ? "bg-success" : p.status === "complete" ? "bg-info" : "bg-secondary"}`}>
                              {p.status || "—"}
                            </span>
                          </td>
                          <td>
                            {p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} – {p.end_date ? new Date(p.end_date).toLocaleDateString() : "—"}
                          </td>
                          <td>
                            <Link to={`/projects/${p._id}/edit`} className="btn btn-sm btn-primary">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0 small">No projects for this Hapū</p>
              )}
            </div>
          </div>

          {/* Files & Folders */}
          <div className="col-12">
            <div className="hapu-section border rounded-3 p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="hapu-section-icon bg-warning bg-opacity-10 text-warning">
                  <i className="ti ti-folder text-white" />
                </span>
                <div>
                  <h6 className="fw-semibold mb-0">Files & Folders</h6>
                  <small className="text-muted">
                    Documents Hapū members have access to ({documents?.length || 0} items)
                  </small>
                </div>
              </div>
              {documents?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Path</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((d) => (
                        <tr key={d._id} className="hapu-list-item">
                          <td>
                            <i className={`ti ${d.type === "folder" ? "ti-folder" : "ti-file"} me-2 text-muted`} />
                            {d.name || "—"}
                          </td>
                          <td className="text-muted small">{d.path || "—"}</td>
                          <td>
                            <span className="badge bg-light text-dark">{d.type || "—"}</span>
                          </td>
                          <td>{d.type === "folder" ? "—" : d.size ? `${(d.size / 1024).toFixed(1)} KB` : "—"}</td>
                          <td>
                            <Link to={`/documents?path=${encodeURIComponent(d.path || "/")}`} className="btn btn-sm btn-outline-secondary">
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0 small">No files or folders with Hapū member access</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HapuDetail;
