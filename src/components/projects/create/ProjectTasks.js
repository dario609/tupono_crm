import { TaskStatusBadge } from "../../../utils/tasks/taskFormatters";

const ProjectTasks = ({ tasks, editTask, deleteTask, taskStatusCounts, openTaskModal, getUserName }) => {
  return (
    <div className="col-md-12 mt-4">
      <div className="d-flex justify-content-between">
        <h5>Tasks ({tasks.length})</h5>

        <button className="btn btn-primary btn-sm" onClick={openTaskModal}>+ Add Task</button>
      </div>

      <table className="table table-bordered mt-3">
        <thead>
          <tr>
            <th>SN</th>
            <th>Assignee</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Start</th>
            <th>End</th>
            <th>Content</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length === 0 && (
            <tr>
              <td colSpan="9" className="text-center text-muted">No tasks added yet.</td>
            </tr>
          )}

          {tasks.map((t, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{getUserName(t.assignee)}</td>
              <td>{t.duration || "-"}</td>
              <td><TaskStatusBadge status={t.status} /></td>
              <td>{t.start_date}</td>
              <td>{t.end_date}</td>
              <td>{t.content || "-"}</td>
              <td>{t.description || "-"}</td>
              <td>
                <button className="btn btn-success btn-sm me-1" onClick={() => editTask(i)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteTask(i)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default ProjectTasks;
