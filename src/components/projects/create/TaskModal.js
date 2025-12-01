const TaskModal = ({
    task,
    setTask,
    taskModalOpen,
    setTaskModalOpen,
    saveTask,
    users,
    teamMembers,
    taskEditIndex,
  }) => {
    if (!taskModalOpen) return null;
  
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <h4>{taskEditIndex != null ? "Edit Task" : "Add Task"}</h4>
  
          {/* Content */}
          <select
            className="form-control"
            value={task.content}
            onChange={(e) => setTask({ ...task, content: e.target.value })}
          >
            <option value="">Select Category</option>
            <option value="Admin">Admin</option>
            <option value="Finance">Finance</option>
            <option value="Other">Other</option>
            <option value="Vehicle">Vehicle</option>
          </select>
  
          {/* Assignee */}
          <select
            className="form-control mt-2"
            value={task.assignee}
            onChange={(e) => setTask({ ...task, assignee: e.target.value })}
          >
            <option value="">Select Assignee</option>
  
            {(teamMembers.length ? teamMembers : users).map((u) => (
              <option key={u._id} value={u._id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
  
          <div className="text-end mt-3">
            <button className="btn btn-secondary me-2" onClick={() => setTaskModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTask}>Save</button>
          </div>
        </div>
      </div>
    );
  };
  
  export default TaskModal;
  