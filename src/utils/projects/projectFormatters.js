import { NavLink } from "react-router-dom";

export const formatOwnerName = (owner) =>
    owner ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() : "-";
  
  export const formatRoheName = (rohe) => rohe?.name || "-";
  
  export const formatTeamName = (team) => {
    if (!team) return "-";
    if (typeof team === "string") return team;
    return team.title || team.name || "-";
  };
  
  export const formatHapuNames = (hapus) =>
    Array.isArray(hapus) && hapus.length
      ? hapus.map((h) => h?.name).filter(Boolean).join(", ")
      : "-";

  export const HapuLinks = ({ hapus }) => {
    if (!Array.isArray(hapus) || hapus.length === 0) return "-";
    return (
      <>
        {hapus.map((h, i) => (
          <span key={h?._id || i}>
            {i > 0 && ", "}
            {h?._id ? (
              <NavLink to={`/docs/hapu/${h._id}`} className="text-primary" style={{ textDecoration: "none", fontWeight: 500 }}>
                {h?.name || "—"}
              </NavLink>
            ) : (
              h?.name || "—"
            )}
          </span>
        ))}
      </>
    );
  };
  
  export const formatStatus = (status) => {
    if (typeof status === "number") {
      if (status === 0) return "active";
      if (status === 1) return "inactive";
      if (status === 2) return "complete";
      return "inactive";
    }
    const s = (status || "").toString().toLowerCase();
    if (s === "0" || s === "active") return "active";
    if (s === "1" || s === "inactive") return "inactive";
    if (s === "2" || s === "complete") return "complete";
    return s || "-";
  };
  
  export const StatusBadge = ({ status }) => {
    const statusValue = formatStatus(status);
    let badgeClass = "bg-danger";
    let label = "Inactive";
    
    if (statusValue === "active") {
      badgeClass = "bg-success";
      label = "Active";
    } else if (statusValue === "complete") {
      badgeClass = "bg-info";
      label = "Complete";
    }
    
    return (
      <span
        className={`badge ${badgeClass}`}
        style={{
          padding: "6px 12px",
          borderRadius: "4px",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    );
  };
  