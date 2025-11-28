import EngageDateForm from "./engageDateForm";
import EngageTypeForm from "./engageTypeForm";
import EngagePurposeForm from "./engagePurpose";
import EngageNumberForm from "./engageNumber";
import EngageProjectForm from "./engageProject";
import EngageHapuForm from "./engageHapu";
import EngageOutcomeForm from "./engageOutcome";
import EngageAttachForm from "../update/EngageAttachForm";
import EngageAddCalendarForm from "./engageAddCalendar";
import EngageTotalHours from "./engageTotalHours";
import EngageTimeSelector from "./engageTimeSelector";
import "../../../styles/engagementAdd.css";

export default function EngagementCreateForm({ form, errors, setForm, handleSave, projects, hapus, saving, onDownloadTemplate }) {

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
    return (
        <div className="card-body pt-0">
            <h5 className="fw-semibold mb-3 mt-2">Add New Engagement</h5>

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
                <EngageNumberForm
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

                <EngageHapuForm
                    value={form.hapus}
                    error={errors.hapus}
                    hapus={hapus}
                    addHapu={addHapu}
                    removeHapu={removeHapu}
                />
                
                <EngageTotalHours
                    value={form.total_hours}
                    error={errors.total_hours}
                    onChange={(value) => setForm({ ...form, total_hours: value })}
                    readOnly={true}
                />
                
                <EngageTimeSelector
                    value={form.time_start}
                    error={errors.time_start}
                    onChange={(value) => setForm({ ...form, time_start: value })}
                    label="Time Start"
                />
                
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
                    onDownloadTemplate={onDownloadTemplate}
                />

                <EngageAddCalendarForm
                    value={form.add_to_calendar}
                    error={errors.add_to_calendar}
                    onChange={(value) => setForm({ ...form, add_to_calendar: value })}
                />
            </div>

            <button
                className="btn btn-primary btn-rounded mt-2"
                style={{ fontSize: "15px" }}
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? (
                    <>
                        <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                        ></span>
                        Creating...
                    </>
                ) : (
                    "Save Engagement"
                )}
            </button>
        </div>
    );
}