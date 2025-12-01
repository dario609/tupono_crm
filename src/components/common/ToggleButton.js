import React from "react";

/**
 * Beautiful Toggle Button Component
 * @param {boolean} value - Current toggle state
 * @param {function} onChange - Callback when toggle changes
 * @param {string} leftLabel - Label for left option
 * @param {string} rightLabel - Label for right option
 * @param {string} leftValue - Value for left option
 * @param {string} rightValue - Value for right option
 */
export default function ToggleButton({
  value,
  onChange,
  leftLabel = "Table",
  rightLabel = "Gantt",
  leftValue = false,
  rightValue = true,
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "#f0f0f0",
        borderRadius: "8px",
        gap: "4px",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(leftValue)}
        style={{
          padding: "8px 20px",
          border: "none",
          borderRadius: "6px",
          background: value === leftValue ? "#007bff" : "transparent",
          color: value === leftValue ? "#fff" : "#666",
          fontWeight: value === leftValue ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontSize: "0.875rem",
        }}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(rightValue)}
        style={{
          padding: "8px 20px",
          border: "none",
          borderRadius: "6px",
          background: value === rightValue ? "#007bff" : "transparent",
          color: value === rightValue ? "#fff" : "#666",
          fontWeight: value === rightValue ? 600 : 400,
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontSize: "0.875rem",
        }}
      >
        {rightLabel}
      </button>
    </div>
  );
}

