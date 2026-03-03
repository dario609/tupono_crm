import { NavLink } from "react-router-dom";
import {
  formatOwnerName,
  formatRoheName,
  formatTeamName,
  formatHapuNames,
  HapuLinks,
  StatusBadge,
} from "../../utils/projects/projectFormatters";
import ProjectActions from "./ProjectActions";

const   ProjectsTableRow = ({
  project,
  index,
  page,
  perpage,
  navigate,
  handleDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const sn = perpage === -1 ? index + 1 : (page - 1) * perpage + index + 1;

  const {
    _id,
    name,
    start_date,
    end_date,
    owner,
    rohe,
    team_id,
    teams,
    hapus,
    status,
  } = project;

  return (
    <tr id={`row-${_id}`}>
      <td>{sn}</td>

      <td>
        <NavLink 
          to={`/projects/${_id}/edit`} 
          className="text-primary"
          style={{ textDecoration: "none", fontWeight: 500 }}
        >
          <span
            title={name?.length > 40 ? name : undefined}
            data-toggle={name?.length > 40 ? "tooltip" : undefined}
          >
            {name?.length > 40 ? name.slice(0, 40) + "..." : name}
          </span>
        </NavLink>
      </td>

      <td>{start_date ? new Date(start_date).toLocaleDateString("en-GB") : ""}</td>
      <td>{end_date ? new Date(end_date).toLocaleDateString("en-GB") : ""}</td>

      <td>{formatOwnerName(owner)}</td>
      <td>
        {Array.isArray(teams) && teams.length ? (
          <>
            {teams.map((t, idx) => (
              <span key={t._id || idx}>
                {idx > 0 && ", "}
                {t._id ? (
                  <NavLink
                    to={`/teams/${t._id}/edit`}
                    className="text-primary"
                    style={{ textDecoration: "none", fontWeight: 500 }}
                  >
                    {formatTeamName(t)}
                  </NavLink>
                ) : (
                  formatTeamName(t)
                )}
              </span>
            ))}
          </>
        ) : team_id?._id ? (
          <NavLink
            to={`/teams/${team_id._id}/edit`}
            className="text-primary"
            style={{ textDecoration: "none", fontWeight: 500 }}
          >
            {formatTeamName(team_id)}
          </NavLink>
        ) : (
          "-"
        )}
      </td>
      <td>{formatRoheName(rohe)}</td>   
      <td><HapuLinks hapus={hapus} /></td>
      <td><StatusBadge status={status} /></td>
      <td className="text-center">
        <ProjectActions
          projectId={_id}
          onEdit={(id) => navigate(`/projects/${id}/edit`)}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      </td>
    </tr>
  );
};

export default ProjectsTableRow;
