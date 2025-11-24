import React, { useState, useEffect } from "react";
import EngagementApi from "../../api/engagementApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import CalendarApi from "../../api/calendarApi";
import { useNavigate } from "react-router-dom";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow.js";
import { AuthApi } from "../../api/authApi";

const initialForm = {
    engage_date: "",
    engage_type: "",
    purpose: "",
    engage_num: "",
    outcome: "",
    hapus: [],
    project: "",
    meeting_minutes: null,
    add_to_calendar: false,
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
    const [currentUser, setCurrentUser] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        if (!form.engage_date) newErrors.engage_date = "Date is required";
        if (!form.engage_type) newErrors.engage_type = "Engagement Type is required";
        if (!form.purpose) newErrors.purpose = "Purpose is required";
        if (!form.engage_num || form.engage_num <= 0)
            newErrors.engage_num = "Number of people is required";
        if (!form.hapus || form.hapus.length === 0) newErrors.hapus = "Hapū is required";
        if (!form.project) newErrors.project = "Project is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            EngagementApi.list(),
            HapuListsApi.list(),
            ProjectsApi.list(),
            AuthApi.check(),
        ]).then(([engagementsRes, hapusRes, projectsRes, authRes]) => {
            setEngagements(engagementsRes?.data?.data || []);
            setHapus(hapusRes?.data || []);
            setProjects(projectsRes?.data || []);
            setCurrentUser(authRes?.user);
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!validateForm()) return;
        const formData = new FormData();
        formData.append('engage_date', form.engage_date);
        formData.append('engage_type', form.engage_type);
        formData.append('purpose', form.purpose);
        formData.append('engage_num', form.engage_num);
        formData.append('project', form.project);
        formData.append('outcome', form.outcome);
        formData.append('meeting_minutes', form.meeting_minutes);
        form.hapus.forEach((h) => formData.append("hapus[]", h));
        setErrors({});

        try {
            const res = await EngagementApi.create(formData);
            if (res.success) {
                // If "Add to Calendar" is checked, create calendar event
                if (form.add_to_calendar && currentUser) {
                    try {
                        const project = projects.find(p => p._id === form.project);
                        const projectName = project ? project.name : "Engagement";
                        const title = `${form.purpose} - ${projectName}`;
                        const description = `Engagement Type: ${form.engage_type}\nPurpose: ${form.purpose}\nNumber of People: ${form.engage_num}\nOutcome: ${form.outcome}`;
                        
                        // Convert engage_date to datetime format (start and end)
                        const engageDate = new Date(form.engage_date);
                        const start = engageDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
                        const endDate = new Date(engageDate);
                        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
                        const end = endDate.toISOString().slice(0, 16);

                        await CalendarApi.create({
                            title,
                            description,
                            start,
                            end,
                            color: "#2563eb",
                            link: "",
                            assignments: currentUser ? [{ refType: 'user', refId: currentUser.id, color: "#2563eb" }] : []
                        });
                    } catch (calendarErr) {
                        console.error("Failed to create calendar event:", calendarErr);
                        // Don't fail the whole operation if calendar creation fails
                    }
                }

                setSuccess("Engagement created successfully" + (form.add_to_calendar ? " and added to calendar" : ""));
                setTimeout(() => {
                    setSuccess("");
                    navigate("/engagement-tracker");
                }, 2000);
                setForm(initialForm);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Server error";
            console.error("Error creating engagement:", err);
        }
    };

    const addHapu = (id) => {
        if (!id) return;

        setForm((f) => {
            if (f.hapus.includes(id)) return f; // avoid duplicates
            return { ...f, hapus: [...f.hapus, id] };
        });
    };

    const removeHapu = (id) => {
        setForm((f) => ({
            ...f,
            hapus: f.hapus.filter((x) => x !== id),
        }));
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

                        <div className="col-md-4 mb-3">
                            <label className="form-label">Hapū Engaged</label>

                            <select
                                className={`form-control ${errors.hapus ? "is-invalid" : ""}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) addHapu(val);
                                }}
                            >
                                <option value="">Select Hapū</option>
                                {hapus.map((h) => (
                                    <option key={h._id} value={h._id}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>

                            {errors.hapus && <div className="invalid-feedback">{errors.hapus}</div>}

                            {form.hapus.length > 0 && (
                                <div className="mt-2" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {form.hapus.map((hid) => {
                                        const h = hapus.find((hh) => hh._id === hid);
                                        if (!h) return null;

                                        return (
                                            <span
                                                key={hid}
                                                className="badge bg-primary"
                                                style={{ padding: "4px 8x", fontSize: "14px" }}
                                            >
                                                {h.name}
                                                <button
                                                    type="button"
                                                    className="btn btn-link btn-sm"
                                                    onClick={() => removeHapu(hid)}
                                                    style={{ color: "#fff", marginLeft: 6, textDecoration: "none" }}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
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
                        </div>

                        {/* Attachment */}
                        <div className="col-12 mb-3">
                            <label className="form-label">Attach Meeting Minutes</label>
                            <input
                                name="meeting_minutes"
                                type="file"
                                className={`form-control`}
                                onChange={(e) =>
                                    setForm({ ...form, meeting_minutes: e.target.files[0] })
                                }
                            />
                        </div>

                        {/* Add to Calendar Checkbox */}
                        <div className="col-12 mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="add_to_calendar"
                                    checked={form.add_to_calendar}
                                    style={{ marginLeft: "5px" }}
                                    onChange={(e) =>
                                        setForm({ ...form, add_to_calendar: e.target.checked })
                                    }
                                />
                                <label className="form-check-label" style={{padding: "7px"}} htmlFor="add_to_calendar">
                                    Add to Calendar
                                </label>
                            </div>
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
