import React from "react";

const modalStyles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    position: "relative",
    background: "white",
    padding: "25px 30px",
    width: "100%",
    maxWidth: "500px",
    borderRadius: "12px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};

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
      <div 
        style={modalStyles.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setTaskModalOpen(false);
          }
        }}
      >
        <div 
          style={modalStyles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <h5 className="mb-3">{taskEditIndex != null ? "Edit Task" : "Add Task"}</h5>

          {/* FIELDS */}
          <div className="row">
            {/* Left Column */}
            <div className="col-md-6 mt-2">
              <label>Assignee *</label>
              <select
                className="form-control"
                value={task.assignee || ""}
                onChange={(e) => setTask({ ...task, assignee: e.target.value })}
              >
                <option value="">Select</option>
                {(teamMembers.length ? teamMembers : users || []).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mt-2">
              <label>Duration (h)</label>
              <input
                type="number"
                className="form-control"
                value={task.duration || ""}
                onChange={(e) => setTask({ ...task, duration: e.target.value })}
              />
            </div>

            <div className="col-md-6 mt-2">
              <label>Status</label>
              <select
                className="form-control"
                value={task.status || ""}
                onChange={(e) => setTask({ ...task, status: e.target.value })}
              >
                <option value="Just starting">Just Starting</option>
                <option value="Working">Working</option>
                <option value="Nearly Complete">Nearly Complete</option>
                <option value="Complete">Complete</option>
              </select>
            </div>

            <div className="col-md-6 mt-2">
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={task.start_date || ""}
                onChange={(e) => setTask({ ...task, start_date: e.target.value })}
              />
            </div>

            <div className="col-md-6 mt-2">
              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                value={task.end_date || ""}
                onChange={(e) => setTask({ ...task, end_date: e.target.value })}
              />
            </div>

            <div className="col-md-12 mt-2">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={task.description || ""}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                placeholder="Task description..."
              />
            </div>

            <div className="col-md-12 mt-2">
              <label>Content</label>
              <select
                className="form-control"
                value={task.content || ""}
                onChange={(e) => setTask({ ...task, content: e.target.value })}
              >
                <option value="">Select Category</option>
                <option value="Admin">Admin</option>
                <option value="Finance">Finance</option>
                <option value="Other">Other</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Travel">Travel</option>
                <option value="Report Support">Report Support</option>
              </select>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="text-end mt-3">
            <button
              className="btn btn-secondary me-2"
              onClick={() => setTaskModalOpen(false)}
            >
              Cancel
            </button>

            <button className="btn btn-primary" onClick={saveTask}>
              Save Task
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default TaskModal;
  