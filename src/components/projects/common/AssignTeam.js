import { useState } from "react";

export default function AssignTeam({
  teams = [],
  selectedTeams = [],
  onChange,
  loading = false,
}) {
  const [dropdownValue, setDropdownValue] = useState("");

  const emitTeams = (nextIds) => {
    onChange({
      target: {
        name: "teams",
        value: nextIds,
      },
    });
  };

  const handleAddTeam = (id) => {
    if (!id || selectedTeams.includes(id)) return;
    emitTeams([...selectedTeams, id]);
    setDropdownValue("");
  };

  const handleRemoveTeam = (id) => {
    emitTeams(selectedTeams.filter((tid) => tid !== id));
  };

  const selectedTeamObjects = teams.filter((t) => selectedTeams.includes(t._id));

  if (loading) {
    return (
      <div className="col-md-4 mt-2">
        <label className="mb-1">Assign Teams</label>
        <div
          className="skeleton skeleton-line"
          style={{ height: "38px", borderRadius: "4px" }}
        />
        <div className="mt-3 d-flex flex-wrap gap-2">
          <div
            className="skeleton skeleton-line"
            style={{
              width: "120px",
              height: "32px",
              borderRadius: "20px",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="col-md-4 mt-2">
      <label className="mb-2" style={{ fontSize: "14px" }}>
        Assign Teams
      </label>
      <select
        className="form-control form-select mt-1"
        value={dropdownValue}
        onChange={(e) => handleAddTeam(e.target.value)}
        disabled={loading}
      >
        <option value="">Select Team</option>
        {teams.length > 0 &&
          teams.map((t) => (
            <option
              key={t._id}
              value={t._id}
              disabled={selectedTeams.includes(t._id)}
            >
              {t.title}
            </option>
          ))}
      </select>

      {selectedTeamObjects.length > 0 && (
        <div className="mt-3 d-flex flex-wrap gap-2">
          {selectedTeamObjects.map((t) => (
            <div key={t._id} className="hapu-chip">
              <span>{t.title}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => handleRemoveTeam(t._id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}