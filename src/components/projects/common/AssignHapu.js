import { useState } from "react";

export default function AssignHapu({ hapus = [], selectedHapus = [], onAdd, onRemove, disabled = false, belongTo='project' }) {
    const [selectedHapu, setSelectedHapu] = useState("");

    const handleAddHapu = (id) => {
        if (!id) return;
        setSelectedHapu("");
        onAdd(id);
    };

    const selectedHapuObjects = selectedHapus
        .map((id) => hapus.find((h) => h._id === id))
        .filter(Boolean);

    return (
        <div className={`col-md-4 mt-2 ${belongTo === 'assessment' ? 'col-md-6 mt-3' : ''}`}>
                { 
                  belongTo === 'assessment' 
                  ? <label className="mb-2">Participants</label> 
                  : <label className="mb-1">Assign Hapū (multiple)</label>}
                <select
                    className="form-control"
                    value={selectedHapu}
                    onChange={(e) => handleAddHapu(e.target.value)}
                    disabled={disabled}
                >
                    <option value="">Select Hapū</option>
                    {hapus.length > 0 &&
                        hapus.map((h) => (
                            <option
                                key={h._id}
                                value={h._id}
                                disabled={selectedHapus.includes(h._id)}
                            >
                                {h.hapu_name || h.name || ""}
                            </option>
                        ))
                    }
                </select>

                <div className="mt-3 d-flex flex-wrap gap-2">
                    {selectedHapuObjects.map((h) => (
                        <div key={h._id} className="hapu-chip">
                            <span>{h.hapu_name || h.name || ""}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => onRemove(h._id)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
    );
}