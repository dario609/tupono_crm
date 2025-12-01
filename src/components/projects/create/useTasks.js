import { useState } from "react";
import { confirmDialog } from "../../../utils/confirmDialog.js";

export const emptyTask = {
  assignee: null,
  duration: 0,
  status: "Just starting",
  start_date: "",
  end_date: "",
  content: "",
  description: "",
};

export const useTasks = (users, teamMembers) => {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState(emptyTask);
  const [taskEditIndex, setTaskEditIndex] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const [taskStatusCounts, setTaskStatusCounts] = useState({
    just_starting: 0,
    working: 0,
    nearly_complete: 0,
    complete: 0,
  });

  const openTaskModal = () => {
    setTask(emptyTask);
    setTaskEditIndex(null);
    setTaskModalOpen(true);
  };

  const editTask = (index) => {
    setTask(tasks[index]);
    setTaskEditIndex(index);
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    const newTasks = [...tasks];

    const normalizedTask = {
      ...task,
      start_date: task.start_date || new Date().toISOString().slice(0, 10),
      end_date: task.end_date || new Date().toISOString().slice(0, 10),
    };

    if (taskEditIndex !== null) {
      newTasks[taskEditIndex] = normalizedTask;
    } else {
      newTasks.push(normalizedTask);
    }

    setTasks(newTasks);
    recomputeStatusCounts(newTasks);
    setTaskModalOpen(false);
    setTaskEditIndex(null);
  };

  const deleteTask = async (index) => {
    const ok = await confirmDialog({
      title: "Delete Task?",
      text: "This cannot be undone.",
    });
    if (!ok) return;

    const newTasks = tasks.filter((_, i) => i !== index);
    setTasks(newTasks);
    recomputeStatusCounts(newTasks);
  };

  const recomputeStatusCounts = (list) => {
    const counts = { just_starting: 0, working: 0, nearly_complete: 0, complete: 0 };

    list.forEach((t) => {
      const s = t.status.toLowerCase();
      if (s.includes("just")) counts.just_starting++;
      else if (s.includes("work")) counts.working++;
      else if (s.includes("nearly")) counts.nearly_complete++;
      else if (s.includes("complete")) counts.complete++;
    });

    setTaskStatusCounts(counts);
  };

  return {
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
    teamMembers,
    users,
    setTaskModalOpen,
  };
};
