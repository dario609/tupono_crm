import AssignTeam from "../common/AssignTeam";
import AssignHapu from "../common/AssignHapu";

const ProjectFormFields = ({
  form,
  onChange,
  users,
  teams,
  rohés,
  hapus,
  teamMembers,
  addHapu,
  removeHapu,
}) => {
  // Opens native datepicker on click (Chrome/Edge)
  // Note: showPicker requires a user gesture, so we only call it on click, not onFocus
  const openPicker = (e) => {
    try {
      if (e.target.showPicker) {
        e.target.showPicker();
      }
    } catch (err) {
      // Some browsers may not support showPicker or require different handling
      // Fallback to default browser behavior
    }
  };

  return (
    <>
      {/* Project name */}
      <div className="col-md-4">
        <label className="mb-1">Project Name *</label>
        <input
          type="text"
          name="name"
          className="form-control"
          value={form.name}
          onChange={onChange}
          required
        />
      </div>

      {/* Start Date */}
      <div className="col-md-4">
        <label className="mb-1">Start Date *</label>
        <input
          type="date"
          name="start_date"
          className="form-control"
          value={form.start_date}
          onChange={onChange}
          onClick={openPicker}
          required
        />
      </div>

      {/* End Date */}
      <div className="col-md-4">
        <label className="mb-1">End Date *</label>
        <input
          type="date"
          name="end_date"
          className="form-control"
          value={form.end_date}
          onChange={onChange}
          onClick={openPicker}
          required
        />
      </div>

      {/* Owner */}
      <div className="col-md-4 mt-2">
        <label className="mb-1">Owner</label>
        <select
          name="owner"
          className="form-control"
          value={form.owner}
          onChange={onChange}
        >
          <option value="">Select Owner</option>
          {(users || []).map((u) => (
            <option key={u._id} value={u._id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
      </div>

      <AssignTeam
        teams={teams}
        teamMembers={teamMembers}
        team_id={form.team_id}
        onChange={onChange}
      />

      {/* Status */}
      <div className="col-md-4 mt-2">
        <label className="mb-1">Status *</label>
        <select
          name="status"
          className="form-control"
          value={form.status}
          onChange={onChange}
        >
          <option value="0">Active</option>
          <option value="1">Inactive</option>
          <option value="2">Complete</option>
        </select>
      </div>

      {/* Rohe */}
      <div className="col-md-4 mt-2">
        <label className="mb-1">Rohe</label>
        <select
          name="rohe"
          className="form-control"
          value={form.rohe}
          onChange={onChange}
        >
          <option value="">Select Rohe</option>
          {(rohés || []).map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <AssignHapu
        hapus={hapus}
        selectedHapus={form.hapus}
        onAdd={addHapu}
        onRemove={removeHapu}
      />
    </>
  );
};

export default ProjectFormFields;
