import React, { useEffect, useState, useRef } from "react";
import AssessmentApi from "../../api/assessmentApi";
import ProjectsApi from "../../api/projectsApi";
import axios from "../../api/axiosInstance";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import WriteFeedbackInline from "./WriteFeedbackInline";
import AssessmentFormSkeleton from "../../components/assessments/AssessmentFormSkeleton";
import AssignHapu from "../../components/projects/common/AssignHapu";

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
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const [params] = useSearchParams();
  const editId = urlId || params.get("id");
  const dateRef = useRef(null);
  const [expandedHapus, setExpandedHapus] = useState(new Set());

  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      try {
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
              participants: (d.participants || []).map(p => String(p?._id || p)),
              facilitating_agent: d.facilitating_agent || "",
              review_state: d.review_state || "incomplete",
              feedbackSheets: (d.feedbacks || []).map(f => ({
                hapuId: f.hapu_id?._id || f.hapu_id,
                hapuName: f.hapu_id?.hapu_name || "",
                sheet: f.content_id?.sheet || null
              })),
            });
          }
        }
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [editId]);

  const addHapu = (id) => {
    if (!id) return;
    const idStr = String(id);
    if (form.participants.includes(idStr)) return;
    setForm((f) => ({ ...f, participants: [...f.participants, idStr] }));
  };

  const removeHapu = (id) => {
    const idStr = String(id);
    setForm((f) => ({ ...f, participants: f.participants.filter((pid) => String(pid) !== idStr) }));
  };

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
        if (typeof el.__getSheetData === "function") {
          const data = el.__getSheetData();
          if (data && data.cells?.length) {
            feedbackSheets.push({ hapuId, hapuName, sheet: data });
          }
        }
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

  if (initialLoading) {
    return <AssessmentFormSkeleton />;
  }

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
              <AssignHapu
                hapus={hapu}
                selectedHapus={form.participants}
                onAdd={addHapu}
                onRemove={removeHapu}
                belongTo='assessment'
              />
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
                    const isExpanded = expandedHapus.has(id);
                    
                    return (
                      <div className="col-12" key={id}>
                        <div className="card">
                          <div 
                            className="card-header d-flex justify-content-between align-items-center"
                            style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
                            onClick={() => {
                              setExpandedHapus(prev => {
                                const next = new Set(prev);
                                if (next.has(id)) {
                                  next.delete(id);
                                } else {
                                  next.add(id);
                                }
                                return next;
                              });
                            }}
                          >
                            <h6 className="mb-0 fw-semibold">Feedback for: {name}</h6>
                            <i 
                              className={`mdi ${isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down'}`}
                              style={{ fontSize: '20px', color: '#6c757d' }}
                            />
                          </div>
                          {isExpanded && (
                            <div className="card-body">
                              <WriteFeedbackInline hapuId={id} hapuName={name} initialSheet={existing?.sheet || null} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 pull-right">
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


