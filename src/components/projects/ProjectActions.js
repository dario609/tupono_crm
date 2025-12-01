import React from "react";
import ActionButton from "../common/ActionButton";
import EditIcon from "../common/icons/EditIcon";
import DeleteIcon from "../common/icons/DeleteIcon";

/**
 * Project Actions Component
 * Modular action buttons for project table rows
 */
export default function ProjectActions({ projectId, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
      }}
    >
      <ActionButton
        icon={<EditIcon />}
        variant="success"
        title="Edit"
        onClick={() => onEdit(projectId)}
      />
      <ActionButton
        icon={<DeleteIcon />}
        variant="danger"
        title="Delete"
        onClick={() => onDelete(projectId)}
      />
    </div>
  );
}

