import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import RoheApi from "../../../api/roheApi";
import HapuListsApi from "../../../api/hapulistsApi";
import "./RoheHapu.css";

const RoheHapuPage = () => {
  const [rohes, setRohes] = useState([]);
  const [hapu, setHapu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRohe, setNewRohe] = useState("");
  const [selectedRohe, setSelectedRohe] = useState("");
  const [newHapu, setNewHapu] = useState("");

  const loadRohes = async () => {
    try {
      const json = await RoheApi.list({ perpage: -1 });
      setRohes(json?.data || []);
    } catch { }
  };

  const loadHapu = async (roheId = "") => {
    try {
      const json = await HapuListsApi.list(roheId ? { rohe_id: roheId } : {});
      setHapu(json?.data || []);
    } catch { }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadRohes();
      await loadHapu();
      setLoading(false);
    })();
  }, []);

  const addRohe = async () => {
    const name = newRohe.trim();
    if (!name) return;
    try {
      setLoading(true);
      await RoheApi.create({ name });
      setNewRohe("");
      await loadRohes();
      Swal.fire({ title: "Added!", text: `Region "${name}" created successfully.`, icon: "success", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.message || "Could not add region. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteRohe = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Deleting this region will also remove all its Hapū. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      await RoheApi.remove(id);
      if (selectedRohe === id) {
        setSelectedRohe("");
        setHapu([]);
      }
      await loadRohes();
      await loadHapu(selectedRohe === id ? "" : selectedRohe);
      Swal.fire({ title: "Deleted", text: "Region removed successfully.", icon: "success", timer: 1500, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const addHapu = async () => {
    const name = newHapu.trim();
    if (!name || !selectedRohe) return;
    try {
      setLoading(true);
      await HapuListsApi.create({ name, rohe_id: selectedRohe });
      setNewHapu("");
      await loadHapu(selectedRohe);
      Swal.fire({ title: "Added!", text: `Hapū "${name}" created successfully.`, icon: "success", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.message || "Could not add Hapū. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHapu = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This Hapū will be removed. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      await HapuListsApi.remove(id);
      await loadHapu(selectedRohe);
      Swal.fire({ title: "Deleted", text: "Hapū removed successfully.", icon: "success", timer: 1500, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const selectedRoheName = rohes.find((r) => r._id === selectedRohe)?.name || "";

  return (
    <div className="card mt-3" style={{ maxWidth: 1200, marginLeft: "auto", marginRight: "auto" }}>
      {/* Header with explanation */}
      <div className="card-body pb-0">
        <h5 className="fw-semibold mb-2" style={{ color: "#1a1a2e" }}>
          Ngā Rohe me ngā Hapū
        </h5>
        <p className="text-muted mb-0" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
          Manage <strong>Rohe</strong> (regions) and <strong>Hapū</strong> (sub-tribes) for your organisation. Add a region first, then add Hapū to each region.
        </p>
      </div>

      <div className="card-body pt-4">
        <div className="row g-4">
          {/* Regions (Rohe) section */}
          <div className="col-lg-6">
            <div className="border rounded-3 p-4 h-100" style={{ backgroundColor: "#fafbfc" }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, backgroundColor: "#e8f4fd" }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 20, color: "#0d6efd" }} />
                </span>
                <div>
                  <h6 className="fw-semibold mb-0" style={{ color: "#1a1a2e" }}>Regions (Rohe)</h6>
                  <small className="text-muted">Geographic or organisational areas</small>
                </div>
              </div>

              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter region name..."
                  value={newRohe}
                  onChange={(e) => setNewRohe(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRohe()}
                />
                <button className="btn btn-primary px-4" disabled={loading || !newRohe.trim()} onClick={addRohe}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  ) : (
                    <>
                      <i className="ti ti-plus me-1" /> Add Region
                    </>
                  )}
                </button>
              </div>

              {rohes.length === 0 ? (
                <div className="text-center py-4 rounded-3" style={{ backgroundColor: "#fff", border: "1px dashed #dee2e6" }}>
                  <i className="ti ti-map-off text-muted" style={{ fontSize: 32 }} />
                  <p className="text-muted mb-0 mt-2">No regions yet</p>
                  <p className="small text-muted mb-0">Add your first region above to get started</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {rohes.map((r) => (
                    <li
                      key={r._id}
                      className={`list-group-item rohe-hapu-item d-flex justify-content-between align-items-center px-3 py-2 border-0 ${selectedRohe === r._id ? "rohe-hapu-item--selected" : ""}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedRohe(r._id);
                        loadHapu(r._id);
                      }}>
                      <span className="fw-medium">{r.name}</span>
                      <div className="d-flex gap-1" >
                        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deleteRohe(r._id); }} title="Delete region">
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Hapū section */}
          <div className="col-lg-6">
            <div className="border rounded-3 p-4 h-100" style={{ backgroundColor: "#fafbfc" }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, backgroundColor: "#e8f5e9" }}>
                  <i className="ti ti-users" style={{ fontSize: 20, color: "#198754" }} />
                </span>
                <div>
                  <h6 className="fw-semibold mb-0" style={{ color: "#1a1a2e" }}>Hapū</h6>
                  <small className="text-muted">
                    {selectedRohe ? `Hapū in ${selectedRoheName}` : "Select a region to manage its Hapū"}
                  </small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted mb-1">Choose a region</label>
                <select
                  className="form-select form-select-lg"
                  value={selectedRohe}
                  onChange={(e) => {
                    setSelectedRohe(e.target.value);
                    loadHapu(e.target.value);
                  }}
                >
                  <option value="">— Select a region —</option>
                  {rohes.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter Hapū name..."
                  value={newHapu}
                  onChange={(e) => setNewHapu(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHapu()} 
                  disabled={!selectedRohe}
                />
                <button className="btn btn-success px-4 text-light" disabled={loading || !selectedRohe || !newHapu.trim()} onClick={addHapu}>
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  ) : (
                    <>
                      <i className="ti ti-plus me-1 text-light" /> Add Hapū
                    </>
                  )}
                </button>
              </div>

              {!selectedRohe ? (
                <div className="text-center py-4 rounded-3" style={{ backgroundColor: "#fff", border: "1px dashed #dee2e6" }}>
                  <i className="ti ti-arrow-left text-muted" style={{ fontSize: 32 }} />
                  <p className="text-muted mb-0 mt-2">Select a region first</p>
                  <p className="small text-muted mb-0">Choose a region from the dropdown above to add or view Hapū</p>
                </div>
              ) : hapu.length === 0 ? (
                <div className="text-center py-4 rounded-3" style={{ backgroundColor: "#fff", border: "1px dashed #dee2e6" }}>
                  <i className="ti ti-users-group text-muted" style={{ fontSize: 32 }} />
                  <p className="text-muted mb-0 mt-2">No Hapū in this region yet</p>
                  <p className="small text-muted mb-0">Add your first Hapū using the field above</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {hapu.map((h) => (
                    <li key={h._id} className="list-group-item rohe-hapu-item d-flex justify-content-between align-items-center px-3 py-2 border-0">
                      <Link to={`/docs/hapu/${h._id}`} className="fw-medium text-decoration-none text-dark flex-grow-1" style={{ cursor: "pointer" }}>
                        {h.name || h.hapu_name}
                      </Link>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deleteHapu(h._id); }} title="Delete Hapū">
                        <i className="ti ti-trash" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoheHapuPage;
