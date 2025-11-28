export const UserPasswordFields = ({ form, onChange, confirmRef }) => (
    <>
      <div className="col-md-4 mb-2">
        <label>Password *</label>
        <input
          type="password"
          className="form-control mt-1"
          name="password"
          value={form.password}
          onChange={onChange}
          required
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Confirm Password *</label>
        <input
          type="password"
          className="form-control mt-1"
          name="confirm_password"
          value={form.confirm_password}
          onChange={onChange}
          required
          ref={confirmRef}
        />
      </div>
    </>
  );
  