import AssessmentHeader from "./AssessmentHeader";
import AssessmentRow from "./AssessmentRow";
import AssessmentSkeleton from "./AssessmentSkeleton";

const AssessmentTable = ({ loading, rows, page, perpage, onRemove, onEdit }) => {
  return (
    <table className="table table-striped">
      <AssessmentHeader />

      <tbody>
        {loading &&
          [...Array(5)].map((_, i) => <AssessmentSkeleton key={i} />)}

        {!loading &&
          rows.map((r, idx) => {
            const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;
            return <AssessmentRow key={r._id} r={r} sn={sn} onRemove={onRemove} onEdit={onEdit} />;
          })}

        {!loading && rows.length === 0 && (
          <tr>
            <td colSpan={10} className="py-4 text-center">
              No assessments found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default AssessmentTable;
