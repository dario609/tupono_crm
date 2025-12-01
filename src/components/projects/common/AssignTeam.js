import { useState } from "react";

export default function AssignTeam({ teams = [], teamMembers = [], team_id = "", onChange, loading = false }) {
    const [selectedTeam, setSelectedTeam] = useState("");

    const handleAddTeam = (id) => {
        if (!id) return;
        setSelectedTeam("");
        const event = {
            target: {
                name: "team_id",
                value: id
            }
        };
        onChange(event);
    };

    const handleRemoveTeam = () => {
        const event = {
            target: {
                name: "team_id",
                value: ""
            }
        };
        onChange(event);
    };

    const selectedTeamObject = team_id ? teams.find((t) => t._id === team_id) : null;

    if (loading) {
        return (
            <div className="col-md-4 mt-2">
                    <label>Assign Team</label>
                    <div className="skeleton skeleton-line" style={{ height: '38px', borderRadius: '4px' }} />
                    <div className="mt-3 d-flex flex-wrap gap-2">
                        <div className="skeleton skeleton-line" style={{ width: '120px', height: '32px', borderRadius: '20px' }} />
                    </div>
            </div>
        );
    }

    return (
        <div className="col-md-4 mt-2">
                <label className="mb-1">Assign Team</label>
                <select
                    className="form-control form-select"
                    value={selectedTeam}
                    onChange={(e) => handleAddTeam(e.target.value)}
                    disabled={loading}
                >
                    <option value="">Select Team</option>
                    {teams.length > 0 &&
                        teams.map((t) => (
                            <option
                                key={t._id}
                                value={t._id}
                                disabled={team_id === t._id}
                            >
                                {t.title}
                            </option>
                        ))
                    }
                </select>

                {selectedTeamObject && (
                    <div className="mt-3 d-flex flex-wrap gap-2">
                        <div key={selectedTeamObject._id} className="hapu-chip">
                            <span>{selectedTeamObject.title}</span>
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={handleRemoveTeam}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {teamMembers.length > 0 && (
                    <div className="mt-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {teamMembers.map((m) => (
                            <span key={`tm-${m._id}`} className="badge badge-primary badge-pill" style={{ padding: '4px 10px' }}>{m.name}</span>
                        ))}
                    </div>
                )}
            </div>
    )
}