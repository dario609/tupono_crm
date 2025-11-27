import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import EngagementApi from "../../api/engagementApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow";
import Swal from "sweetalert2";
import EngageHapuForm from "../../components/engagements/create/engageHapu";
import EngageTotalHours from "../../components/engagements/create/engageTotalHours";
import EngageTimeSelector from "../../components/engagements/create/engageTimeSelector";
import EngageDateForm from "../../components/engagements/create/engageDateForm";
import "../../styles/engagementAdd.css";

const initialForm = {
    engage_date: "",
    engage_type: "",
    purpose: "",
    engage_num: "",
    outcome: "",
    hapus: [],
    project: "",
    meeting_minutes: null,
    total_hours: "",
    time_start: "00:00",
    time_finish: "00:00",
};

export default function EngagementTrackerEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(initialForm);
    const [hapus, setHapus] = useState([]);
    const [projects, setProjects] = useState([]);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState("");
    const [originalMeetingMinutes, setOriginalMeetingMinutes] = useState(null);

    const validateForm = () => {
        const e = {};

        if (!form.engage_date) e.engage_date = "Date is required";
        if (!form.engage_type) e.engage_type = "Engagement Type is required";
        if (!form.purpose) e.purpose = "Purpose is required";
        if (!form.engage_num || form.engage_num <= 0)
            e.engage_num = "Number of people is required";
        if (!form.hapus || form.hapus.length === 0)
            e.hapus = "Hapū is required";
        if (!form.project) e.project = "Project is required";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // Load engagement + lists
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [engRes, hapuRes, projRes] = await Promise.all([
                    EngagementApi.getById(id),
                    HapuListsApi.list(),
                    ProjectsApi.list(),
                ]);

                setHapus(hapuRes?.data || []);
                setProjects(projRes?.data || []);

                const e = engRes?.data;

                setForm({
                    engage_date: e.engage_date?.substring(0, 10) || "",
                    engage_type: e.engage_type || "",
                    purpose: e.purpose || "",
                    engage_num: e.engage_num || "",
                    outcome: e.outcome || "",
                    hapus: e.hapus.map((h) => h._id) || [],
                    project: e.project?._id || "",
                    meeting_minutes: null, // new upload only
                    total_hours: e.total_hours || "",
                    time_start: e.time_start || "00:00",
                    time_finish: e.time_finish || "00:00",
                });

                // Store original meeting minutes path
                if (e.meeting_minutes) {
                    setOriginalMeetingMinutes(e.meeting_minutes);
                }
            } catch (err) {
                Swal.fire("Error", "Unable to load engagement", "error");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const addHapu = (id) => {
        if (!id) return;
        setForm((f) => {
            if (f.hapus.includes(id)) return f;
            return { ...f, hapus: [...f.hapus, id] };
        });
    };

    const removeHapu = (id) => {
        setForm((f) => ({
            ...f,
            hapus: f.hapus.filter((x) => x !== id),
        }));
    };

    // Calculate total hours from time_start and time_finish
    const calculateTotalHours = (startTime, finishTime) => {
        if (!startTime || !finishTime || startTime === "00:00" || finishTime === "00:00") {
            return "";
        }

        // Parse time strings to get hours and minutes
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [finishHours, finishMinutes] = finishTime.split(':').map(Number);

        // Convert to total minutes for easier calculation
        const startTotalMinutes = startHours * 60 + startMinutes;
        let finishTotalMinutes = finishHours * 60 + finishMinutes;

        // Handle case where finish time is next day (e.g., start 23:00, finish 01:00)
        if (finishTotalMinutes < startTotalMinutes) {
            finishTotalMinutes += 24 * 60; // Add 24 hours in minutes
        }

        // Calculate difference in minutes
        const diffMinutes = finishTotalMinutes - startTotalMinutes;

        // Convert to hours with proper decimal (60 minutes = 1 hour)
        const totalHours = diffMinutes / 60;

        // Round to 2 decimal places
        return Math.round(totalHours * 100) / 100;
    };

    // Validate that time_finish is later than time_start
    const validateTimeRange = (startTime, finishTime) => {
        if (!startTime || !finishTime || startTime === "00:00" || finishTime === "00:00") {
            return { isValid: true, error: "" };
        }

        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [finishHours, finishMinutes] = finishTime.split(':').map(Number);

        const startTotalMinutes = startHours * 60 + startMinutes;
        let finishTotalMinutes = finishHours * 60 + finishMinutes;

        // Check if finish is on the same day and later than start
        if (finishTotalMinutes <= startTotalMinutes) {
            // Check if it's a next-day scenario (e.g., 23:00 to 01:00)
            const nextDayFinish = finishTotalMinutes + (24 * 60);
            if (nextDayFinish <= startTotalMinutes) {
                return { isValid: false, error: "Time Finish must be later than Time Start" };
            }
        }

        return { isValid: true, error: "" };
    };

    // Auto-calculate total hours when time_start or time_finish changes
    useEffect(() => {
        if (form.time_start && form.time_finish && form.time_start !== "00:00" && form.time_finish !== "00:00") {
            // Validate time range
            const validation = validateTimeRange(form.time_start, form.time_finish);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, time_finish: validation.error }));
                return;
            } else {
                // Clear error if validation passes
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.time_finish;
                    return newErrors;
                });
            }

            const calculatedHours = calculateTotalHours(form.time_start, form.time_finish);
            const currentHours = parseFloat(form.total_hours) || 0;
            if (calculatedHours !== "" && Math.abs(calculatedHours - currentHours) > 0.01) {
                setForm(prev => ({ ...prev, total_hours: calculatedHours.toString() }));
            }
        } else if ((!form.time_start || form.time_start === "00:00") && (!form.time_finish || form.time_finish === "00:00")) {
            // Clear total hours if times are reset
            if (form.total_hours !== "") {
                setForm(prev => ({ ...prev, total_hours: "" }));
            }
            // Clear time_finish error
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.time_finish;
                return newErrors;
            });
        }
    }, [form.time_start, form.time_finish]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);

        try {
            const fd = new FormData();
            fd.append("engage_date", form.engage_date);
            fd.append("engage_type", form.engage_type);
            fd.append("purpose", form.purpose);
            fd.append("engage_num", form.engage_num);
            fd.append("project", form.project);
            fd.append("outcome", form.outcome);
            fd.append("total_hours", form.total_hours || "0");
            fd.append("time_start", form.time_start || "");
            fd.append("time_finish", form.time_finish || "");

            if (form.meeting_minutes)
                fd.append("meeting_minutes", form.meeting_minutes);

            form.hapus.forEach((h) => fd.append("hapus[]", h));

            const res = await EngagementApi.update(id, fd);


            if (res.success) {
                setSuccess("Engagement updated successfully");
                Swal.fire("Updated", "Engagement saved successfully", "success");
                navigate("/engagement-tracker");
            }
        } catch (err) {
            console.log('err', err)
            Swal.fire("Error", err.response?.data?.message || "Server error", "error");
        } finally {
            setSaving(false);
        }
    };

    return loading ? (
        <EditProjectSkeleton />
    ) : (
        <div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
                <h6 className="fw-semibold mb-0" style={{ fontSize: "20px" }}>
                    Edit Engagement
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

                <div className="card-body pt-0">
                    <h5 className="fw-semibold mb-3 mt-2">Update Engagement</h5>

                    <div className="row">
                        {/* Date */}
                        <EngageDateForm
                            value={form.engage_date}
                            error={errors.engage_date}
                            onChange={(value) => setForm({ ...form, engage_date: value })}
                        />

                        {/* Type */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Type of Engagement</label>
                            <select
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
                            {errors.purpose && <div className="invalid-feedback">{errors.purpose}</div>}
                        </div>

                        {/* People */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Number of People in Engagement</label>
                            <input
                                type="number"
                                className={`form-control ${errors.engage_num ? "is-invalid" : ""}`}
                                value={form.engage_num}
                                onChange={(e) => setForm({ ...form, engage_num: e.target.value })}
                            />
                            {errors.engage_num && <div className="invalid-feedback">{errors.engage_num}</div>}
                        </div>

                        {/* Projects */}
                        <div className="col-md-4 mb-3">
                            <label className="form-label">Allocated Project</label>
                            <select
                                className={`form-control ${errors.project ? "is-invalid" : ""}`}
                                value={form.project}
                                onChange={(e) => setForm({ ...form, project: e.target.value })}
                            >
                                <option value="">Select Project</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            {errors.project && <div className="invalid-feedback">{errors.project}</div>}
                        </div>
                        {/* Hapu multi-select */}
                        <EngageHapuForm
                            value={form.hapus}
                            error={errors.hapus}
                            hapus={hapus}
                            addHapu={addHapu}
                            removeHapu={removeHapu}
                        />

                        {/* Total Hours */}
                        <EngageTotalHours
                            value={form.total_hours}
                            error={errors.total_hours}
                            onChange={(value) => setForm({ ...form, total_hours: value })}
                            readOnly={true}
                        />

                        {/* Time Start */}
                        <EngageTimeSelector
                            value={form.time_start}
                            error={errors.time_start}
                            onChange={(value) => setForm({ ...form, time_start: value })}
                            label="Time Start"
                        />

                        {/* Time Finish */}
                        <EngageTimeSelector
                            value={form.time_finish}
                            error={errors.time_finish}
                            onChange={(value) => setForm({ ...form, time_finish: value })}
                            label="Time Finish"
                        />



                        {/* Outcome */}
                        <div className="col-12 mb-3">
                            <label className="form-label">Outcome of Meeting / Engagement</label>
                            <textarea
                                rows={4}
                                className={`form-control ${errors.outcome ? "is-invalid" : ""}`}
                                value={form.outcome}
                                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                            ></textarea>
                            {errors.outcome && <div className="invalid-feedback">{errors.outcome}</div>}
                        </div>

                        {/* Attachment */}
                        <div className="col-12 mb-3">
                            <label className="form-label">Replace Meeting Minutes</label>
                            <input
                                type="file"
                                className={`form-control ${errors.meeting_minutes ? "is-invalid" : ""}`}
                                onChange={(e) => setForm({ ...form, meeting_minutes: e.target.files[0] })}
                            />
                            {errors.meeting_minutes && (
                                <div className="invalid-feedback">{errors.meeting_minutes}</div>
                            )}
                            {originalMeetingMinutes && (
                                <div className="mt-2">
                                    <small className="text-muted">Current file: </small>
                                    <span style={{ color: "#667eea", fontWeight: 500 }}>
                                        {originalMeetingMinutes.split('/').pop() || originalMeetingMinutes}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-rounded mt-2"
                        disabled={saving}
                        onClick={handleSave}
                    >
                        {saving ? "Saving..." : "Update Engagement"}
                    </button>
                </div>
            </div>
        </div>
    );
}
