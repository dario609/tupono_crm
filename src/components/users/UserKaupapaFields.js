export const UserKaupapaFields = ({ form, onChange, hapus = [] }) => (
    <>
      <div className="col-md-6 mb-2">
        <label>Hapū</label>
        <select
          className="form-control mt-1"
          name="hapu"
          value={form.hapu}
          onChange={onChange}
        >
          <option value="">Select Hapū</option>
          {hapus.map((h) => (
            <option key={h._id} value={h.hapu_name || h.name || ""}>
              {h.hapu_name || h.name || ""}
            </option>
          ))}
        </select>
      </div>
  
      <div className="col-md-6 mb-2">
        <label>Iwi</label>
        <textarea
          rows={2}
          className="form-control mt-1"
          name="iwi"
          value={form.iwi}
          onChange={onChange}
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Marae</label>
        <textarea
          rows={2}
          className="form-control mt-1"
          name="marae"
          value={form.marae}
          onChange={onChange}
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Maunga</label>
        <textarea
          rows={2}
          className="form-control mt-1"
          name="maunga"
          value={form.maunga}
          onChange={onChange}
        />
      </div>
  
      <div className="col-md-4 mb-2">
        <label>Awa</label>
        <textarea
          rows={2}
          className="form-control mt-1"
          name="awa"
          value={form.awa}
          onChange={onChange}
        />
      </div>
    </>
  );
  