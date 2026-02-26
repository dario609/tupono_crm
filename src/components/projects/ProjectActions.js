import React from "react";
import ActionButton from "../common/ActionButton";
import EditIcon from "../common/icons/EditIcon";
import DeleteIcon from "../common/icons/DeleteIcon";

/**
 * Project Actions Component
 * Modular action buttons for project table rows
 */
export default function ProjectActions({ projectId, onEdit, onDelete, canEdit = true, canDelete = true }) {
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
        title={canEdit ? "Edit" : "Edit (no permission)"}
        onClick={() => canEdit && onEdit(projectId)}
        disabled={!canEdit}
      />
      <ActionButton
        icon={<DeleteIcon />}
        variant="danger"
        title={canDelete ? "Delete" : "Delete (no permission)"}
        onClick={() => canDelete && onDelete(projectId)}
        disabled={!canDelete}
      />
    </div>
  );
}

