import React, { useState, useEffect } from "react";
import EngagementApi from "../../api/engagementApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import { useNavigate } from "react-router-dom";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow.js";

const initialForm = {
    engage_date: "",
    engage_type: "",
    purpose: "",
    engage_num: "",
    outcome: "",
    hapus: "",
    project: "",
    meeting_minutes: null,
};

export default function EngagementTrackerPage() {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(initialForm);
    const [engagements, setEngagements] = useState([]);
    const [hapus, setHapus] = useState([]);
    const [projects, setProjects] = useState([]);
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!form.engage_date) newErrors.engage_date = "Date is required";
        if (!form.engage_type) newErrors.engage_type = "Engagement Type is required";
        if (!form.purpose) newErrors.purpose = "Purpose is required";
        if (!form.engage_num || form.engage_num <= 0)
            newErrors.engage_num = "Number of people is required";
        if (!form.hapus) newErrors.hapus = "Hapū is required";
        if (!form.project) newErrors.project = "Project is required";
        if (!form.outcome) newErrors.outcome = "Outcome is required";
        if (!form.meeting_minutes) newErrors.meeting_minutes = "Meeting minutes file is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            EngagementApi.list(),
            HapuListsApi.list(),
            ProjectsApi.list(),
        ]).then(([engagementsRes, hapusRes, projectsRes]) => {
            setEngagements(engagementsRes?.data?.data || []);
            setHapus(hapusRes?.data || []);
            setProjects(projectsRes?.data || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = () => {
        if (!validateForm()) return;
        const formData = new FormData();
        formData.append('engage_date', form.engage_date);
        formData.append('engage_type', form.engage_type);
        formData.append('purpose', form.purpose);
        formData.append('engage_num', form.engage_num);
        formData.append('hapus', form.hapus);
        formData.append('project', form.project);
        formData.append('outcome', form.outcome);
        formData.append('meeting_minutes', form.meeting_minutes);
        setErrors({});

        EngagementApi.create(formData)
            .then((res) => {
                if (res.success) {
                    setSuccess("Engagement created successfully");
                    setTimeout(() => {
                        setSuccess("");
                        navigate("/engagement-tracker");
                    }, 2000);
                    setForm(initialForm);
                }
                else {
                }
            })
            .catch((err) => {
                const msg = err.response?.data?.message || "Server error";
            });

    };

 
    return loading ? (
        <EditProjectSkeleton />
    ) : (
        <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">

                <h6 className="fw-semibold mb-0" style={{ fontSize: "20px" }}>
                    Engagement Tracker
                </h6>
            </div>

            <div className="card mt-3 p-1">
                {success && (
                    <div className="alert alert-success fade show mt-3">
                        <ul style={{ listStyle: "none", marginBottom: 0 }}>
                            <li>{success}</li>
                        </ul>
                    </div>
                )}
                {/* FORM */}
                <div className="card-body pt-0">
                    <h5 className="fw-semibold mb-3 mt-2">Add New Engagement</h5>

                    <div className="row">
                        {/* Date */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Date of Engagement</label>
                            <input
                                type="date"
                                name="engage_date"
                                className={`form-control ${errors.engage_date ? "is-invalid" : ""}`}
                                value={form.engage_date}
                                onChange={(e) => setForm({ ...form, engage_date: e.target.value })}
                            />
                            {errors.engage_date && <div className="invalid-feedback">{errors.engage_date}</div>}
                        </div>

                        {/* Type */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Type of Engagement</label>
                            <select
                                name="engage_type"
                                className={`form-control ${errors.engage_type ? "is-invalid" : ""}`}
                                value={form.engage_type}
                                onChange={(e) => setForm({ ...form, engage_type: e.target.value })}
                            >
                                <option value="">Select Engagement Type</option>
                                <option>In person meeting</option>
                                <option>Online meeting</option>
                                <option>Telephone Call</option>
                            </select>
                            {errors.engage_type && <div className="invalid-feedback">{errors.engage_type}</div>}
                        </div>

                        {/* Purpose */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Purpose of Engagement</label>
                            <select
                                className={`form-control ${errors.purpose ? "is-invalid" : ""}`}
                                value={form.purpose}
                                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                            >
                                <option value="">Select Purpose</option>
                                <option>Monthly Hapū Hui</option>
                                <option>Workshop Meeting</option>
                                <option>Review Meeting</option>
                                <option>Other</option>
                            </select>
                            {errors.purpose && (
                                <div className="invalid-feedback">{errors.purpose}</div>
                            )}
                        </div>

                        {/* People */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Number of People in Meeting</label>
                            <input
                                type="number"
                                name="engage_num"
                                placeholder="0"
                                className={`form-control ${errors.engage_num ? "is-invalid" : ""}`}
                                value={form.engage_num}
                                onChange={(e) =>
                                    setForm({ ...form, engage_num: e.target.value })
                                }
                            />
                            {errors.engage_num && <div className="invalid-feedback">{errors.engage_num}</div>}
                        </div>

                        {/* Hapu */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Hapū Engaged</label>
                            <select
                                className={`form-control ${errors.hapus ? "is-invalid" : ""}`}
                                value={form.hapus}
                                onChange={(e) => setForm({ ...form, hapus: e.target.value })}
                            >
                                <option value="">Select Hapū</option>
                                {hapus.map((h) => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                            {errors.hapus && <div className="invalid-feedback">{errors.hapus}</div>}
                        </div>

                        {/* Project */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Allocated Project</label>
                            <select
                                className={`form-control ${errors.project ? "is-invalid" : ""}`}
                                value={form.project}
                                onChange={(e) => setForm({ ...form, project: e.target.value })}
                            >
                                <option value="">Select Project</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.project && (
                                <div className="invalid-feedback">{errors.project}</div>
                            )}
                        </div>

                        {/* Outcome */}
                        <div className="col-12 mb-3">
                            <label className="form-label">Outcome of Meeting / Engagement</label>
                            <textarea
                                className={`form-control ${errors.outcome ? "is-invalid" : ""}`}
                                rows="4"
                                placeholder="Describe the outcome..."
                                value={form.outcome}
                                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                            ></textarea>
                            {errors.outcome && (
                                <div className="invalid-feedback">{errors.outcome}</div>
                            )}
                        </div>

                        {/* Attachment */}
                        <div className="col-12 mb-3">
                            <label className="form-label">Attach Meeting Minutes</label>
                            <input
                                name="meeting_minutes"
                                type="file"
                                className={`form-control ${errors.meeting_minutes ? "is-invalid" : ""}`}
                                onChange={(e) =>
                                    setForm({ ...form, meeting_minutes: e.target.files[0] })
                                }
                            />
                            {errors.meeting_minutes && (
                                <div className="invalid-feedback">{errors.meeting_minutes}</div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-rounded mt-2"
                        style={{ fontSize: "15px" }}
                        onClick={handleSave}
                    >
                        Save Engagement
                    </button>
                </div>

            </div>
        </div>
    );
}
