export const UserRoleField = ({ roles, form, onChange }) => (
    <div className="col-md-4 mb-2">
      <label>Role *</label>
      <select
        className="form-select mt-1"
        name="role_id"
        value={form.role_id}
        onChange={onChange}
        required
      >
        <option value="">Select Role</option>
        {roles.map((r) => (
          <option key={r._id} value={r._id}>
            {r.role_name}
          </option>
        ))}
      </select>
    </div>
  );
  