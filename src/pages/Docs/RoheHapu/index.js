import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const RoheHapuPage = () => {
  const [rohes, setRohes] = useState([]);
  const [hapu, setHapu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRohe, setNewRohe] = useState("");
  const [selectedRohe, setSelectedRohe] = useState("");
  const [newHapu, setNewHapu] = useState("");

  const loadRohes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/rohe?perpage=-1", { credentials: "include" });
      const json = await res.json();
      setRohes(json?.data || []);
    } catch {}
  };

  const loadHapu = async (roheId = "") => {
    try {
      const q = roheId ? `?rohe_id=${encodeURIComponent(roheId)}` : "";
      const res = await fetch(`http://localhost:5000/api/admin/hapulists${q}`, { credentials: "include" });
      const json = await res.json();
      setHapu(json?.data || []);
    } catch {}
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
      const res = await fetch("http://localhost:5000/api/admin/rohe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      await res.json();
      setNewRohe("");
      await loadRohes();
    } finally {
      setLoading(false);
    }
  };

  const deleteRohe = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this Rohe? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      await fetch(`http://localhost:5000/api/admin/rohe/${id}`, { method: "DELETE", credentials: "include" });
      if (selectedRohe === id) setSelectedRohe("");
      await loadRohes();
      await loadHapu(selectedRohe);
      await Swal.fire({ title: 'Deleted!', text: 'Rohe deleted', icon: 'success', timer: 1500, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  const addHapu = async () => {
    const name = newHapu.trim();
    if (!name || !selectedRohe) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/admin/hapulists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, rohe_id: selectedRohe }),
      });
      await res.json();
      setNewHapu("");
      await loadHapu(selectedRohe);
    } finally {
      setLoading(false);
    }
  };

  const deleteHapu = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this Hapū? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      await fetch(`http://localhost:5000/api/admin/hapulists/${id}`, { method: "DELETE", credentials: "include" });
      await loadHapu(selectedRohe);
      await Swal.fire({ title: 'Deleted!', text: 'Hapū deleted', icon: 'success', timer: 1500, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">Rohe & Hapu Management</h6>
      </div>

      <div className="row card-body pt-0">
        <div className="col-md-6">
          <div className="box">
            <div className="box-body p-15 pt-2">
              <h6>Ngā Rohe</h6>
              <div className="input-group mb-2">
                <input type="text" className="form-control" placeholder="Rohe name" value={newRohe} onChange={(e) => setNewRohe(e.target.value)} />
                <button className="btn btn-primary" disabled={loading} onClick={addRohe}>Add</button>
              </div>
              <ul className="list-group">
                {rohes.map((r) => (
                  <li key={r._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{r.name}</span>
                    <div>
                      <button className="btn btn-sm btn-secondary me-2" onClick={() => { setSelectedRohe(r._id); loadHapu(r._id); }}>View Hapu</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRohe(r._id)}>Delete</button>
                    </div>
                  </li>
                ))}
                {rohes.length === 0 && <li className="list-group-item">No Rohes</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="box">
            <div className="box-body p-15 pt-2">
              <h6>Ngā Hapū</h6>
              <div className="mb-2">
                <select className="form-control form-select" value={selectedRohe} onChange={(e) => { setSelectedRohe(e.target.value); loadHapu(e.target.value); }}>
                  <option value="">All Rohes</option>
                  {rohes.map((r) => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group mb-2">
                <input type="text" className="form-control" placeholder="Hapū name" value={newHapu} onChange={(e) => setNewHapu(e.target.value)} />
                <button className="btn btn-primary" disabled={loading || !selectedRohe} onClick={addHapu}>Add</button>
              </div>
              <ul className="list-group">
                {hapu.map((h) => (
                  <li key={h._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{h.name}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteHapu(h._id)}>Delete</button>
                  </li>
                ))}
                {hapu.length === 0 && <li className="list-group-item">No Hapū</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoheHapuPage;


