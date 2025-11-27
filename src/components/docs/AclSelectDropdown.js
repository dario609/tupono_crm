import { useState } from "react";

export default function AclSelectDropdown({ users = [], teams = [], selectedUsers = [], selectedTeams = [], onAdd, onRemove }) {    
    const [selectedValue, setSelectedValue] = useState("");
    const handleAdd = (value) => {
      if (!value) return;
      setSelectedValue("");
      if (value.startsWith('team_')) {
        const teamId = value.replace('team_', '');
        // Check if team is already selected (compare as strings)
        const isAlreadySelected = selectedTeams.some(tid => String(tid) === String(teamId));
        if (!isAlreadySelected) {
          onAdd('team', teamId);
        }
      } else {
        // Check if user is already selected (compare as strings)
        const isAlreadySelected = selectedUsers.some(uid => String(uid) === String(value));
        if (!isAlreadySelected) {
          onAdd('user', value);
        }
      }
    };
    // Get selected user and team objects
    const selectedUserObjects = selectedUsers
      .map((id) => users.find((u) => String(u._id) === String(id)))
      .filter(Boolean);
  
    const selectedTeamObjects = selectedTeams
      .map((id) => teams.find((t) => String(t._id) === String(id)))
      .filter(Boolean);
  
    return (
      <div>
        <select
          className="form-control"
          value={selectedValue}
          onChange={(e) => handleAdd(e.target.value)}
        >
          <option value="">Select User or Team</option>
          <optgroup label="Users">
            {users.map(u => {
              const isSelected = selectedUsers.some(uid => String(uid) === String(u._id));
              return (
                <option
                  key={u._id}
                  value={u._id}
                  disabled={isSelected}
                >
                  {`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}
                </option>
              );
            })}
          </optgroup>
          <optgroup label="Teams">
            {teams.map(t => {
              const isSelected = selectedTeams.some(tid => String(tid) === String(t._id));
              return (
                <option
                  key={t._id}
                  value={`team_${t._id}`}
                  disabled={isSelected}
                >
                  {t.title}
                </option>
              );
            })}
          </optgroup>
        </select>
  
        <div className="mt-3 d-flex flex-wrap gap-2">
          {selectedUserObjects.map((u) => (
            <div key={`user-${u._id}`} className="hapu-chip">
              <span>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove('user', String(u._id))}
              >
                ×
              </button>
            </div>
          ))}
          {selectedTeamObjects.map((t) => (
            <div key={`team-${t._id}`} className="hapu-chip">
              <span>{t.title}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove('team', String(t._id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
    }