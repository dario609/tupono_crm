export const UserContactFields = ({ form, onChange }) => (
    <>
      <div className="col-md-4 mb-2">
        <label>Phone</label>
        <input
          className="form-control mt-1"
          name="phone"
          value={form.phone}
          onChange={onChange}
        />
      </div>
    </>
  );
  