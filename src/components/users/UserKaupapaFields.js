import SelectWithAdd from "../common/SelectWithAdd";

export const UserKaupapaFields = ({ form, onChange, hapus = [], onAdd = null }) => (
  <>
    <div className="col-md-4 mb-2">
      <label className="mb-1">Hapū</label>
      <SelectWithAdd
        name="hapu"
        value={form.hapu}
        onChange={onChange}
        options={hapus.map((h) => ({ value: h.hapu_name || h.name || "", label: h.hapu_name || h.name || "" }))}
        placeholder="Hapū"
        onAdd={onAdd}
      />
    </div>

    <div className="col-md-4 mb-2">
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
  