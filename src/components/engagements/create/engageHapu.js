import { useState } from "react";

export default function EngageHapuForm({ value, error, hapus = [], addHapu, removeHapu }) {
    const [selectedHapu, setSelectedHapu] = useState("");

    const handleAddHapu = (id) => {
        if (!id) return;
        setSelectedHapu(id);
        addHapu(id);
    };

    const handleRemoveHapu = (id) => {
        removeHapu(id);
    };

    // Convert the list of IDs (value) into full objects
    const selectedHapuObjects = value
        .map((id) => hapus.find((h) => h._id === id))
        .filter(Boolean); // remove undefined

    return (
        <div className="col-md-4 mb-3">
            <label className="form-label">Hapū</label>

            <select
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={selectedHapu}
                onChange={(e) => handleAddHapu(e.target.value)}
            >
                <option value="">Select Hapū</option>

                {hapus.length > 0 &&
                    hapus.map((h) => (
                        <option
                            key={h._id}
                            value={h._id}
                            disabled={value.includes(h._id)}   // <-- prevent duplicate selection
                        >
                            {h.name}
                        </option>
                    ))
                }
            </select>


            {error && <div className="invalid-feedback">{error}</div>}

            <div className="mt-3 d-flex flex-wrap gap-2">
                {selectedHapuObjects.map((h) => (
                    <div key={h._id} className="hapu-chip">
                        <span>{h.name}</span>
                        <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveHapu(h._id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}
