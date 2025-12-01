const AssessmentSkeleton = () => (
    <tr>
      {[...Array(9)].map((_, i) => (
        <td key={i}>
          <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        </td>
      ))}
    </tr>
  );
  
  export default AssessmentSkeleton;
  