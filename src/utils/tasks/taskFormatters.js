/**
 * Task Status Badge Component
 * Beautiful status badges for tasks
 */
export const TaskStatusBadge = ({ status }) => {
  const statusValue = (status || "").toString();
  let badgeClass = "";
  let label = "";
  let icon = "";

  switch (statusValue) {
    case "Just starting":
      badgeClass = "bg-secondary";
      label = "Just Starting";
      break;
    case "Working":
      badgeClass = "bg-info text-white";
      label = "Working";
      break;
    case "Nearly Complete":
      badgeClass = "bg-warning text-white";
      label = "Nearly Complete";
      break;
    case "Complete":
      badgeClass = "bg-success";
      label = "Complete";
      break;
    default:
      badgeClass = "bg-secondary";
      label = statusValue || "Unknown";
      break;
  }

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        fontSize: "0.8rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        textTransform: "none",
        letterSpacing: "0.3px",
      }}
    >
      <span>{label}</span>
    </span>
  );
};

/**
 * Format task status for counting
 */
export const formatTaskStatus = (status) => {
  const s = (status || "").toString();
  if (s === "Just starting") return "just_starting";
  if (s === "Working") return "working";
  if (s === "Nearly Complete") return "nearly_complete";
  if (s === "Complete") return "complete";
  return s.toLowerCase().replace(/\s+/g, "_");
};

