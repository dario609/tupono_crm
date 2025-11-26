import { useEffect, useState, useRef } from "react";
import EngagementApi from "../api/engagementApi";
import HapuListsApi from "../api/hapulistsApi";
import ProjectsApi from "../api/projectsApi";
import CalendarApi from "../api/calendarApi";
import { AuthApi } from "../api/authApi";
import validateEngagement from "../utils/validators/engagements";

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

export default function useEngagementForm(navigate) {
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [engagements, setEngagements] = useState([]);
    const [hapus, setHapus] = useState([]);
    const [projects, setProjects] = useState([]);
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
            .then(([engRes, hapuRes, projRes, authRes]) => {
                setEngagements(engRes?.data?.data || []);
                setHapus(hapuRes?.data || []);
                setProjects(projRes?.data || []);
                setCurrentUser(authRes?.user);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!validateForm()) return;

        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            if (key === "hapus") return; // handled below
            formData.append(key, val);
        });

        form.hapus.forEach((h) => formData.append("hapus[]", h));

        try {
            const res = await EngagementApi.create(formData);
            if (res.success) {
                if (form.add_to_calendar && currentUser) {
                    try {
                        const project = projects.find(p => p._id === form.project);
                        const title = `${form.purpose} - ${project?.name ?? "Engagement"}`;
                        const description =
                            `Engagement Type: ${form.engage_type}\n` +
                            `Purpose: ${form.purpose}\n` +
                            `People: ${form.engage_num}\n` +
                            `Outcome: ${form.outcome}`;

                        const start = new Date(form.engage_date).toISOString().slice(0, 16);
                        const end = new Date(new Date(form.engage_date).getTime() + 3600000)
                            .toISOString()
                            .slice(0, 16);

                        await CalendarApi.create({
                            title,
                            description,
                            start,
                            end,
                            color: "#2563eb",
                            assignments: [{ refType: "user", refId: currentUser.id }]
                        });
                    } catch (calendarErr) {
                        console.error("Calendar error:", calendarErr);
                    }
                }

                setSuccess("Engagement created successfully" +
                    (form.add_to_calendar ? " and added to calendar" : "")
                );

                setTimeout(() => {
                    setSuccess("");
                    setForm(initialForm);
                    navigate("/engagement-tracker");
                }, 1800);
            }
        } catch (err) {
            console.error("Failed:", err);
        }
    };

    return {
        form,
        setForm,
        errors,
        success,
        loading,
        hapus,
        projects,
        handleSave,
    };
}
