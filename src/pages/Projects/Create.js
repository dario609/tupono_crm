import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useProjectForm } from "../../components/projects/create/useProjectForm.js";
import { useTasks } from "../../components/projects/create/useTasks.js";
import ProjectFormFields from "../../components/projects/create/ProjectFormFields.js";
import ProjectTasks from "../../components/projects/create/ProjectTasks.js";
import TaskModal from "../../components/projects/create/TaskModal.js";

import { buildProjectPayload } from "../../components/projects/create/ProjectPayload.js";

import ProjectsApi from "../../api/projectsApi";

const CreateProject = () => {
  const navigate = useNavigate();

  const {
    form,
    setForm,
    formRef,
    users,
    teams,
    rohes,
    hapus,
    teamMembers,
    loading,
    setLoading,
    onChange,
    addHapu,
    removeHapu,
  } = useProjectForm();

  const {
    tasks,
    task,
    setTask,
    taskModalOpen,
    openTaskModal,
    editTask,
    saveTask,
    deleteTask,
    taskStatusCounts,
    taskEditIndex,
    setTaskModalOpen,
  } = useTasks(users, teamMembers);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    try {
      setLoading(true);
      const payload = buildProjectPayload(form, tasks);
      const res = await ProjectsApi.create(payload);

      if (!res?.success) throw new Error(res?.message);
      navigate("/projects");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between">
        <h6>Add Project</h6>
        <Link to="/projects" className="btn btn-primary">Back</Link>
      </div>

      <form ref={formRef} onSubmit={onSubmit}>
        <div className="row">
          <ProjectFormFields
            form={form}
            onChange={onChange}
            users={users}
            teams={teams}
            rohés={rohes}
            hapus={hapus}
            teamMembers={teamMembers}
            addHapu={addHapu}
            removeHapu={removeHapu}
          />

          <ProjectTasks
            tasks={tasks}
            editTask={editTask}
            deleteTask={deleteTask}
            taskStatusCounts={taskStatusCounts}
            openTaskModal={openTaskModal}
            getUserName={(id) => users.find((u) => u._id === id)?.first_name || "-"}
          />
        </div>

        <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </form>

      <TaskModal
        task={task}
        setTask={setTask}
        taskModalOpen={taskModalOpen}
        setTaskModalOpen={setTaskModalOpen}
        saveTask={saveTask}
        users={users}
        teamMembers={teamMembers}
        taskEditIndex={taskEditIndex}
      />
    </>
  );
};

export default CreateProject;
