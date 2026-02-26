import { ProjectSkeletonRow } from "../../components/common/SkelentonTableRow";
import ProjectsTableRow from "./ProjectsTableRow";

const ProjectsTableBody = ({
  loading,
  rows,
  page,
  perpage,
  handleDelete,
  navigate,
  canEdit = true,
  canDelete = true,
}) => {
  const skeletonCount = Math.min(10, perpage === -1 ? 10 : perpage);

  return (
    <tbody aria-busy={loading}>
      {loading &&
        Array.from({ length: skeletonCount }).map((_, i) => (
          <ProjectSkeletonRow key={`sk-${i}`} />
        ))}

      {!loading &&
        rows.map((r, idx) => (
          <ProjectsTableRow
            key={r._id}
            project={r}
            index={idx}
            page={page}
            perpage={perpage}
            navigate={navigate}
            handleDelete={handleDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}

      {!loading && rows.length === 0 && (
        <tr className="text-center">
          <td colSpan={11} className="py-4">No Records found</td>
        </tr>
      )}
    </tbody>
  );
};

export default ProjectsTableBody;
