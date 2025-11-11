import React, { useEffect, useState, useRef } from "react";
import AssessmentApi from "../../api/assessmentApi";
import ProjectsApi from "../../api/projectsApi";
import axios from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import WriteFeedbackInline from "./WriteFeedbackInline";

const AddAssessment = () => {
  const [projects, setProjects] = useState([]);
  const [hapu, setHapu] = useState([]);
  const [form, setForm] = useState({
    project_id: "",
    design_stage: "Concept",
    title: "",
    review_date: "",
    participants: [],
    facilitating_agent: "NZTA Design Team",
    review_state: "incomplete",
    isFinished: false,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const dateRef = useRef(null);
  const participantsRef = useRef(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await ProjectsApi.list({ perpage: -1 }).catch(() => ({ data: [] }));
      setProjects(p?.data || []);
      const hl = await axios.get("/admin/hapulists", { params: { perpage: -1 } }).catch(() => ({ data: [] }));
      setHapu(hl?.data?.data || hl?.data || []);
      if (editId) {
        const doc = await AssessmentApi.getById(editId).catch(() => null);
        if (doc?.data) {
          const d = doc.data;
          setForm({
            project_id: d.project_id?._id || d.project_id || "",
            design_stage: d.design_stage || "Concept",
            title: d.title || "",
            review_date: d.review_date ? d.review_date.substring(0, 10) : "",
            participants: (d.participants || []).map(p => p?._id || p),
            facilitating_agent: d.facilitating_agent || "",
            review_state: d.review_state || "incomplete",
            isFinished: !!d.isFinished,
            feedbackSheets: (d.feedbacks || []).map(f => ({
              hapuId: f.hapu_id?._id || f.hapu_id,
              hapuName: f.hapu_id?.hapu_name || "",
              sheet: f.content_id?.sheet || null
            })),
          });
        }
      }
    })();
  }, [editId]);

  // Close participants dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!participantsRef.current) return;
      if (!participantsRef.current.contains(e.target)) setParticipantsOpen(false);
    };
    if (participantsOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [participantsOpen]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const feedbackSheets = [];
      document.querySelectorAll("[data-feedback-sheet]").forEach(el => {
        const hapuId = el.getAttribute("data-hapu-id");
        const hapuName = el.getAttribute("data-hapu-name");
        const data = el.__getSheetData?.(); // We'll define this in WriteFeedbackInline
        if (data) feedbackSheets.push({ hapuId, hapuName, sheet: data });
      });

      const payload = { ...form };
      payload.feedbackSheets = feedbackSheets;

      if (editId) {
        await AssessmentApi.update(editId, payload);
      } else {
        await AssessmentApi.create(payload);
      }
      await Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
      navigate("/assessment");
    } catch (e1) {
      await Swal.fire({ icon: "error", title: "Error", text: e1.message || "Server error", timer: 2000, showConfirmButton: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
        <h6 className="fw-semibold mb-0">{editId ? "Edit Assessment Feedback" : "Add Assessment"}</h6>
      </div>
      <div className="row card-body">
        <div className="col-12">
          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Project</label>
                <select className="form-select" value={form.project_id} onChange={(e) => setForm(f => ({ ...f, project_id: e.target.value }))} required>
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Design Stage</label>
                <select className="form-select" value={form.design_stage} onChange={(e) => setForm(f => ({ ...f, design_stage: e.target.value }))}>
                  <option>Concept</option>
                  <option>Preliminary</option>
                  <option>Detailed</option>
                  <option>Construction Support</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Review Date</label>
                <input
                  ref={dateRef}
                  type="date"
                  className="form-control"
                  style={{ cursor: "pointer" }}
                  value={form.review_date}
                  onClick={() => {
                    if (dateRef.current?.showPicker) {
                      try {
                        dateRef.current.showPicker();
                      } catch (e) {
                        // ignore: some browsers require explicit gesture; fallback to native
                      }
                    }
                  }}
                  onChange={(e) => setForm(f => ({ ...f, review_date: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Participants (Hapū)</label>
                <div className="position-relative" ref={participantsRef}>
                  <button
                    type="button"
                    className="form-select text-start"
                    onClick={() => setParticipantsOpen(v => !v)}
                  >
                    {form.participants.length > 0 ? `${form.participants.length} selected` : "Select Hapū"}
                  </button>
                  {participantsOpen && (
                    <div className="dropdown-menu show w-100 p-2" style={{ maxHeight: 260, overflowY: "auto" }}>
                      {hapu.map(h => {
                        const id = String(h._id);
                        const label = h.hapu_name || h.name;
                        const checked = form.participants.includes(id);
                        return (
                          <label key={id} className="dropdown-item d-flex align-items-center gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input m-0"
                              checked={checked}
                              onChange={() => setForm(f => ({
                                ...f,
                                participants: checked
                                  ? f.participants.filter(pid => pid !== id)
                                  : [...f.participants, id]
                              }))}
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                      {hapu.length === 0 && <div className="dropdown-item text-muted">No hapū found</div>}
                    </div>
                  )}
                </div>
                {Array.isArray(form.participants) && form.participants.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {form.participants.map((id) => {
                      const h = hapu.find(x => String(x._id) === String(id));
                      const label = h?.hapu_name || h?.name || "Unknown";
                      return (
                        <span key={id} className="badge rounded-pill bg-primary d-inline-flex align-items-center" style={{ gap: 6 }}>
                          {label}
                          <button
                            type="button"
                            className="btn-close btn-close-white btn-sm"
                            aria-label="Remove"
                            onClick={() => setForm(f => ({ ...f, participants: f.participants.filter(pid => pid !== id) }))}
                            style={{ fontSize: 8 }}
                          />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Facilitating Agent</label>
                <input type="text" className="form-control" value={form.facilitating_agent} onChange={(e) => setForm(f => ({ ...f, facilitating_agent: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Review Progress</label>
                <select className="form-select" value={form.review_state} onChange={(e) => setForm(f => ({ ...f, review_state: e.target.value }))}>
                  <option value="complete">Complete</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end">
                <div className="form-check">
                  <input className="form-check-input" style={{ marginLeft: '2px' }} type="checkbox" id="isFinished" checked={form.isFinished} onChange={(e) => setForm(f => ({ ...f, isFinished: e.target.checked }))} />
                  <label className="form-check-label" style={{ marginTop: '6px', marginLeft: '2.0rem' }} htmlFor="isFinished">Mark this Assessment as Finished?</label>
                </div>
              </div>
            </div>
            {/* Feedback writer cards for each selected hapū */}
            {Array.isArray(form.participants) && form.participants.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-semibold mb-2">Write Feedback</h6>
                <div className="row g-3">
                  {form.participants.map((id) => {
                    const h = hapu.find((x) => String(x._id) === String(id));
                    const name = h?.hapu_name || h?.name || "Hapū";
                    const existing = form.feedbackSheets?.find(f => String(f.hapuId) === String(id));
                    return (
                      <div className="col-12" key={id}>
                        <WriteFeedbackInline hapuId={id} hapuName={name} initialSheet={existing?.sheet || null} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate("/assessment")}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssessment;


