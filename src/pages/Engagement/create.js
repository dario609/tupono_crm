import React, { useState, useEffect, useRef } from "react";
import EngagementApi from "../../api/engagementApi";
import HapuListsApi from "../../api/hapulistsApi";
import ProjectsApi from "../../api/projectsApi";
import CalendarApi from "../../api/calendarApi";
import { useNavigate } from "react-router-dom";
import { EditProjectSkeleton } from "../../components/common/SkelentonTableRow.js";
import { AuthApi } from "../../api/authApi";
import validateEngagement from "../../utils/validators/engagements";
import EngagementCreateForm from "../../components/engagements/create/engagementCreateForm";
import EngageCreateNotification from "../../components/engagements/create/engageCreateNotification";
import EngageCreateHeader from "../../components/engagements/create/engageCreateHeader";


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
    total_hours: "",
    time_start: "00:00",
    time_finish: "00:00",
};

export default function EngagementTrackerPage() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const dateInputRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(initialForm);
    const [engagements, setEngagements] = useState([]);
    const [hapus, setHapus] = useState([]);
    const [projects, setProjects] = useState([]);
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const validateForm = () => {
        const validateErrors = validateEngagement(form);
        setErrors(validateErrors);
        return Object.keys(validateErrors).length === 0;
    };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            EngagementApi.list(),
            HapuListsApi.list(),
            ProjectsApi.list(),
            AuthApi.check(),
        ])
            .then(([engagementsRes, hapusRes, projectsRes, authRes]) => {
                setEngagements(engagementsRes?.data?.data || []);
                setHapus(hapusRes?.data || []);
                setProjects(projectsRes?.data || []);
                setCurrentUser(authRes?.user);
            })
            .finally(() => setLoading(false));
    }, []);


    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        const formData = new FormData();
        formData.append('engage_date', form.engage_date);
        formData.append('engage_type', form.engage_type);
        formData.append('purpose', form.purpose);
        formData.append('engage_num', form.engage_num);
        formData.append('project', form.project);
        formData.append('outcome', form.outcome);
        formData.append('total_hours', form.total_hours || "0");
        formData.append('time_start', form.time_start || "");
        formData.append('time_finish', form.time_finish || "");
        if (form.meeting_minutes instanceof File) {
            formData.append('meeting_minutes', form.meeting_minutes);
        }

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
            console.log(err);
            console.error("Error creating engagement:", err);
        }
        finally {
            setSaving(false);
        }
    };

    return loading ? (
        <EditProjectSkeleton />
    ) : (
        <div>
            <EngageCreateHeader title="Engagement Tracker" />
            <div className="card mt-3 p-1">
                <EngageCreateNotification success={success} />

                <EngagementCreateForm
                    saving={saving}
                    form={form}
                    errors={errors}
                    setForm={setForm}
                    handleSave={handleSave}
                    projects={projects}
                    hapus={hapus}
                />
            </div>
        </div>
    );
}
