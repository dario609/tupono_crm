export const UserBasicFields = ({ form, onChange }) => (
    <>
      <div className="col-md-4 mb-2">
        <label>First Name *</label>
        <input
          className="form-control mt-1"
          name="first_name"
          value={form.first_name}
          onChange={onChange}
          required
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Last Name *</label>
        <input
          className="form-control mt-1"
          name="last_name"
          value={form.last_name}
          onChange={onChange}
          required
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Email *</label>
        <input
          type="email"
          className="form-control mt-1"
          name="email"
          value={form.email}
          required
          onChange={onChange}
        />
      </div>

      <div className="col-md-4 mb-2">
        <label>Organisation</label>
        <input
          type="text"
          className="form-control mt-1"
          name="organisation"
          value={form.organisation || ""}
          onChange={onChange}
          placeholder="Organisation"
        />
      </div>
    </>
  );
  