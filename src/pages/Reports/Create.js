import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";

const CreateReport = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    project_title: "",
    project_description: "",
    start_date: "",
    end_date: "",
    project_status: "",
    risks: "",
    opportunities: "",
    recommendations: "1. That this report is received and accepted\n\n2. That the Invoice(s) attached are approved for payment.",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

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
      const data = await ReportsApi.create(form);
      if (data?.success === false) throw new Error(data?.message || "Failed to create report");
      setSuccess("Report created successfully");
      setTimeout(() => navigate("/reports"), 900);
    } catch (err) {
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add Report</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/reports" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
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
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Report Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" name="project_title" value={form.project_title} onChange={onChange} maxLength={80} placeholder="Report Name" required />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Assign To</label>
                        <select className="form-control" disabled>
                          <option value="">Select Project</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Start Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="start_date" name="start_date" value={form.start_date} onChange={onChange} required placeholder="dd/mm/yyyy" data-date={form.start_date ? formatDateForDisplay(form.start_date) : "dd/mm/yyyy"} onFocus={(e)=>e.target.showPicker && e.target.showPicker()} onClick={(e)=>e.target.showPicker && e.target.showPicker()} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>End Date <span className="text-danger">*</span></label>
                        <input type="date" className="form-control" id="end_date" name="end_date" value={form.end_date} onChange={onChange} required placeholder="dd/mm/yyyy" data-date={form.end_date ? formatDateForDisplay(form.end_date) : "dd/mm/yyyy"} onFocus={(e)=>e.target.showPicker && e.target.showPicker()} onClick={(e)=>e.target.showPicker && e.target.showPicker()} />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group mb-2">
                        <label>Status <span className="text-danger">*</span></label>
                        <select name="project_status" className="form-control" value={form.project_status} onChange={onChange} required>
                          <option value="">Select Status</option>
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="form-group">
                        <label className="mb-2">Description (<small>Purpose of the role</small>)</label>
                        <textarea className="form-control" id="project_description" name="project_description" rows={3} maxLength={5000} value={form.project_description} onChange={onChange} placeholder="Description"></textarea>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="mb-2">Opportunities</label>
                        <textarea className="form-control" id="opportunities" name="opportunities" rows={3} maxLength={5000} value={form.opportunities} onChange={onChange} placeholder="Opportunities"></textarea>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="mb-2">Risks</label>
                        <textarea className="form-control" id="risks" name="risks" rows={3} maxLength={5000} value={form.risks} onChange={onChange} placeholder="Risks"></textarea>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label className="mb-2">Recommendations</label>
                        <textarea className="form-control" id="recommendations" name="recommendations" rows={3} maxLength={5000} value={form.recommendations} onChange={onChange} placeholder="Recommendations"></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer1 text-center mt-3">
                    <button type="button" className="btn btn-danger btn-rounded btn-fw" onClick={() => navigate("/reports")}>Cancel</button>
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

export default CreateReport;


