import React from "react";

export default function ActionButton({
    icon,
    variant = "primary",
    title,
    onClick,
    className = "",
}) {
    return (
        <button
            type="button"
            className={`btn btn-sm btn-rounded btn-icon badge-${variant} ${className}`}
            title={title}
            onClick={onClick}
            style={{ minWidth: "32px", minHeight: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                {icon}
            </span>
        </button>
    );
}
