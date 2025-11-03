import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const defaultField = () => ({ key: "", label: "", type: "text", width: 12, required: false, options: [], placeholder: "", defaultValue: "", order: 0 });

const Builder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [template, setTemplate] = useState({ name: "", description: "", visibility: "private", rows: [{ order: 0, fields: [defaultField()] }] });

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await fetch(`http://localhost:5000/api/admin/templates/${id}`, { credentials: 'include' });
        const json = await res.json();
        if (json?.success && json?.data) setTemplate(json.data);
      } catch {}
    })();
  }, [id]);

  const updateField = (rowIdx, fieldIdx, patch) => {
    setTemplate((t) => {
      const rows = [...t.rows];
      const fields = [...rows[rowIdx].fields];
      fields[fieldIdx] = { ...fields[fieldIdx], ...patch };
      rows[rowIdx] = { ...rows[rowIdx], fields };
      return { ...t, rows };
    });
  };

  const addRow = () => setTemplate((t) => ({ ...t, rows: [...t.rows, { order: t.rows.length, fields: [defaultField()] }] }));
  const removeRow = (rowIdx) => setTemplate((t) => ({ ...t, rows: t.rows.filter((_, i) => i !== rowIdx) }));
  const addField = (rowIdx) => setTemplate((t) => {
    const rows = [...t.rows];
    rows[rowIdx] = { ...rows[rowIdx], fields: [...rows[rowIdx].fields, defaultField()] };
    return { ...t, rows };
  });
  const removeField = (rowIdx, fieldIdx) => setTemplate((t) => {
    const rows = [...t.rows];
    rows[rowIdx] = { ...rows[rowIdx], fields: rows[rowIdx].fields.filter((_, i) => i !== fieldIdx) };
    return { ...t, rows };
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      setLoading(true);
      const method = id ? 'PUT' : 'POST';
      const url = id ? `http://localhost:5000/api/admin/templates/${id}` : 'http://localhost:5000/api/admin/templates';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(template) });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'Failed to save template');
      setSuccess('Template saved successfully');
      setTimeout(() => navigate('/templates/create'), 900);
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const renderFieldControl = (f, idx) => {
    const common = { className: 'form-control', defaultValue: f.defaultValue || '', placeholder: f.placeholder || '' };
    switch (f.type) {
      case 'textarea':
        return <textarea {...common} rows={3}></textarea>;
      case 'number':
        return <input type="number" {...common} />;
      case 'date':
        return <input type="date" {...common} onFocus={(e)=>e.target.showPicker && e.target.showPicker()} onClick={(e)=>e.target.showPicker && e.target.showPicker()} />;
      case 'select':
        return (
          <select className="form-control" defaultValue={f.defaultValue || ''}>
            <option value="">Select</option>
            {(f.options || []).map((op, i) => (<option key={i} value={op}>{op}</option>))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="form-check">
            <input type="checkbox" className="form-check-input" defaultChecked={!!f.defaultValue} id={`chk-${idx}`} />
            <label htmlFor={`chk-${idx}`} className="form-check-label">{f.placeholder || 'Check'}</label>
          </div>
        );
      default:
        return <input type="text" {...common} />;
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Report Template Builder</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/reports" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
              <i className="ti ti-arrow-circle-left ms-1"></i> Back
            </Link>
          </li>
        </ul>
      </div>

      <section className="card mt-3">
        <div className="row card-body pt-0">
          <div className="col-12">
            <div className="box">
              <div className="box-body p-15 pt-0">
                {success && (
                  <div className="alert alert-success alert-dismissible fade show">
                    <ul style={{ listStyle: 'none', marginBottom: 0 }}><li>{success}</li></ul>
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    <ul style={{ listStyle: 'none', marginBottom: 0 }}><li>{error}</li></ul>
                  </div>
                )}

                <div className="row">
                  <div className="col-lg-7">
                  <form onSubmit={onSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" value={template.name} onChange={(e)=>setTemplate(t=>({...t,name:e.target.value}))} required maxLength={150} />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Visibility</label>
                        <select className="form-control" value={template.visibility} onChange={(e)=>setTemplate(t=>({...t,visibility:e.target.value}))}>
                          <option value="private">Private</option>
                          <option value="team">Team</option>
                          <option value="public">Public</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Description</label>
                        <textarea className="form-control" rows={2} value={template.description} onChange={(e)=>setTemplate(t=>({...t,description:e.target.value}))} />
                      </div>
                    </div>
                  </div>

                  {template.rows.map((row, rIdx) => (
                    <div key={rIdx} className="border rounded p-2 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>Row {rIdx + 1}</strong>
                        <div>
                          <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={()=>addField(rIdx)}>Add Field</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>removeRow(rIdx)}>Remove Row</button>
                        </div>
                      </div>
                      <div className="row">
                        {row.fields.map((f, fIdx) => (
                          <div key={fIdx} className="col-md-12 mb-2">
                            <div className="row align-items-end">
                              <div className="col-md-2">
                                <label>Key</label>
                                <input className="form-control" value={f.key} onChange={(e)=>updateField(rIdx,fIdx,{key:e.target.value})} placeholder="unique_key" required />
                              </div>
                              <div className="col-md-3">
                                <label>Label</label>
                                <input className="form-control" value={f.label} onChange={(e)=>updateField(rIdx,fIdx,{label:e.target.value})} placeholder="Field Label" required />
                              </div>
                              <div className="col-md-2">
                                <label>Type</label>
                                <select className="form-control" value={f.type} onChange={(e)=>updateField(rIdx,fIdx,{type:e.target.value})}>
                                  <option value="text">Text</option>
                                  <option value="textarea">Textarea</option>
                                  <option value="number">Number</option>
                                  <option value="date">Date</option>
                                  <option value="select">Select</option>
                                  <option value="checkbox">Checkbox</option>
                                </select>
                              </div>
                              <div className="col-md-2">
                                <label>Width</label>
                                <input type="number" min={1} max={12} className="form-control" value={f.width} onChange={(e)=>updateField(rIdx,fIdx,{width:parseInt(e.target.value||'12',10)})} />
                              </div>
                              <div className="col-md-1">
                                <label>Required</label>
                                <input type="checkbox" className="form-check-input" checked={!!f.required} onChange={(e)=>updateField(rIdx,fIdx,{required:e.target.checked})} />
                              </div>
                              <div className="col-md-2 text-end">
                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>removeField(rIdx,fIdx)}>Remove</button>
                              </div>
                            </div>
                            <div className="row mt-2">
                              <div className="col-md-4">
                                <label>Placeholder</label>
                                <input className="form-control" value={f.placeholder||""} onChange={(e)=>updateField(rIdx,fIdx,{placeholder:e.target.value})} />
                              </div>
                              <div className="col-md-4">
                                <label>Default</label>
                                <input className="form-control" value={f.defaultValue||""} onChange={(e)=>updateField(rIdx,fIdx,{defaultValue:e.target.value})} />
                              </div>
                              {f.type === 'select' && (
                                <div className="col-md-4">
                                  <label>Options (comma separated)</label>
                                  <input className="form-control" value={(f.options||[]).join(', ')} onChange={(e)=>updateField(rIdx,fIdx,{options:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-primary" onClick={addRow}>Add Row</button>
                    <div>
                      <button type="button" className="btn btn-danger me-2" onClick={()=>navigate('/templates')}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Template'}</button>
                    </div>
                  </div>
                  </form>
                  </div>
                  <div className="col-lg-5">
                    <div className="border rounded p-2" style={{ background: '#fafafa' }}>
                      <h6 className="fw-semibold mb-3">Preview</h6>
                      <div className="row">
                        {template.rows.map((row, rIdx) => {
                          const clamp = (n) => {
                            const v = parseInt(n ?? 12, 10);
                            if (Number.isNaN(v)) return 12;
                            return Math.min(12, Math.max(1, v));
                          };
                          const widths = row.fields.map((f) => clamp(f.width));
                          let sum = widths.reduce((a,b)=>a+b,0);
                          let norm = widths.slice();
                          if (sum > 12) {
                            norm = widths.map((w) => Math.max(1, Math.floor((w / sum) * 12)));
                            let nsum = norm.reduce((a,b)=>a+b,0);
                            for (let i = 0; nsum < 12 && i < norm.length; i++) { norm[i]++; nsum++; }
                          }
                          return (
                            <div key={`pr-${rIdx}`} className="col-12 mb-2">
                              <div className="row">
                                {row.fields.map((f, fIdx) => (
                                  <div key={`pr-${rIdx}-${fIdx}`} className={`col-md-${norm[fIdx] || clamp(f.width)}`}>
                                    <div className="mb-2">
                                      {f.type !== 'checkbox' && (<label className="form-label">{f.label || f.key}{f.required ? ' *' : ''}</label>)}
                                      {renderFieldControl(f, fIdx)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Builder;


