import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

import EngagementApi from "../../api/engagementApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow";
import EngageHapuForm from "../../components/engagements/create/engageHapu";
import EngageTotalHours from "../../components/engagements/create/engageTotalHours";
import EngageTimeSelector from "../../components/engagements/create/engageTimeSelector";
import EngageDateForm from "../../components/engagements/create/engageDateForm";
import UpdateEngageBtn from "../../components/engagements/update/updateEngageBtn";
import EngageTypeForm from "../../components/engagements/update/EngageTypeForm";
import EngagePurposeForm from "../../components/engagements/update/EngagePurposeForm";
import EngagePeopleForm from "../../components/engagements/update/EngagePeopleForm";
import EngageProjectForm from "../../components/engagements/update/EngageProjectForm";
import EngageOutcomeForm from "../../components/engagements/update/EngageOutcomeForm";
import EngageAttachForm from "../../components/engagements/update/EngageAttachForm";
import validateEngagement from "../../utils/validators/engagements";
import { calculateTotalHours, validateTimeRange } from "../../utils/time";


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
        const e = validateEngagement(form);
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

                // Store original meeting minutes filename (prefer filename over path)
                if (e.meeting_minutes) {
                    setOriginalMeetingMinutes(e.meeting_minutes_filename || e.meeting_minutes);
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
            Swal.fire("Error", err.response?.data?.message || "Server error", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await EngagementApi.downloadTemplate();
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Meeting_Minutes_Template.dotx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            Swal.fire("Error", "Unable to download template", "error");
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
                    <h5 className="fw-semibold mb-3 mt-2" >Update Engagement</h5>

                    <div className="row">

                        <EngageDateForm
                            value={form.engage_date}
                            error={errors.engage_date}
                            onChange={(value) => setForm({ ...form, engage_date: value })}
                        />

                        <EngageTypeForm
                            value={form.engage_type}
                            error={errors.engage_type}
                            onChange={(value) => setForm({ ...form, engage_type: value })}
                        />

                        <EngagePurposeForm
                            value={form.purpose}
                            error={errors.purpose}
                            onChange={(value) => setForm({ ...form, purpose: value })}
                        />

                        <EngagePeopleForm
                            value={form.engage_num}
                            error={errors.engage_num}
                            onChange={(value) => setForm({ ...form, engage_num: value })}
                        />

                        <EngageProjectForm
                            value={form.project}
                            error={errors.project}
                            onChange={(value) => setForm({ ...form, project: value })}
                            projects={projects}
                        />
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

                        <EngageOutcomeForm
                            value={form.outcome}
                            error={errors.outcome}
                            onChange={(value) => setForm({ ...form, outcome: value })}
                        />
                        <EngageAttachForm
                            value={form.meeting_minutes}
                            error={errors.meeting_minutes}
                            onChange={(value) => setForm({ ...form, meeting_minutes: value })}
                            onDownloadTemplate={handleDownloadTemplate}
                            originalFile={originalMeetingMinutes}
                        />
                    </div>

                    <UpdateEngageBtn saving={saving} handleSave={handleSave} />
                </div>
            </div>
        </div>
    );
}
