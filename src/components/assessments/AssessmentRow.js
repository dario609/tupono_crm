import { NavLink } from "react-router-dom";
import ActionButton from "../common/ActionButton";
import EditIcon from "../common/icons/EditIcon";
import DeleteIcon from "../common/icons/DeleteIcon";

const AssessmentRow = ({ r, sn, onRemove, onEdit }) => {
    const participants =
      Array.isArray(r.participants) && r.participants.length > 0
        ? r.participants
            .map((p) => {
              // Handle populated objects (should have 'name' field after backend fix)
              if (typeof p === "object" && p !== null) {
                return p.name || p.hapu_name || "-";
              }
              return "-";
            })
            .filter((name) => name !== "-")
            .join(", ") || "-"
        : "-";
    const reviewState = (r.review_state || "").toLowerCase();
    const projectId = r.project_id?._id || r.project_id;
    const projectName = r.project_id?.name || "-";
  
    return (
      <tr>
        <td>{sn}</td>
        <td>
          {projectId && projectName !== "-" ? (
            <NavLink
              to={`/projects/${projectId}/edit`}
              className="text-primary"
              style={{ textDecoration: "none", fontWeight: 500 }}
            >
              {projectName}
            </NavLink>
          ) : (
            "-"
          )}
        </td>
        <td>{r.design_stage}</td>
        <td>{r.title}</td>
        <td>{r.review_date ? new Date(r.review_date).toLocaleDateString() : "-"}</td>
        <td>{participants}</td>
        <td>{r.facilitating_agent || "-"}</td>
  
        <td>
          <span
            className={`badge rounded-pill ${
              reviewState === "complete" ? "bg-success" : "bg-danger text-white"
            }`}
            style={{ minWidth: 88 }}
          >
            {reviewState.charAt(0).toUpperCase() + reviewState.slice(1)}
          </span>
        </td>
  
        <td className="text-center">
          <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "nowrap" }}>
            <ActionButton
              icon={<EditIcon />}
              variant="success"
              title="Edit"  
              onClick={() => onEdit(r._id)}
            />
            <ActionButton 
              icon={<DeleteIcon />}
              variant="danger"
              title="Delete"
              onClick={() => onRemove(r)}
            />
          </div>
        </td>
      </tr>
    );
  };
  
  export default AssessmentRow;
  