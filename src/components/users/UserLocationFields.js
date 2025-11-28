export const UserLocationFields = ({ form, onChange }) => (
    <>
      <div className="col-md-4 mb-3">
        <label>City</label>
        <input
          className="form-control mt-1"
          name="city"
          value={form.city}
          onChange={onChange}
          placeholder="City"
        />
      </div>
  
      <div className="col-md-4 mb-3">
        <label>Country</label>
        <input
          className="form-control mt-1"
          name="country"
          value={form.country}
          onChange={onChange}
          placeholder="Country"
        />
      </div>
  
      <div className="col-md-4 mb-3">
        <label>Postal Code</label>
        <input
          className="form-control mt-1"
          name="zip_code"
          value={form.zip_code}
          onChange={onChange}
          placeholder="Postal Code"
        />
      </div>
  
      <div className="col-md-4 mb-3">
        <label>Address</label>
        <input
          className="form-control mt-1"
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Full Address"
        />
      </div>
    </>
  );
  