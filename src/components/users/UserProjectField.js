export const UserProjectField = ({ projects, form, onChange }) => (
  <div className="col-md-4 mb-2">
    <label>Project *</label>
    <select
      className="form-select mt-1"
      name="project_id"
      value={form.project_id}
      onChange={onChange}
      required
    >
      <option value="">Select Project</option>
      {projects.map((p) => (
        <option key={p._id} value={p._id}>
          {p.name}
        </option>
      ))}
    </select>
  </div>
);