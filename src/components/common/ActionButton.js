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
            className={`btn btn-sm btn-rounded btn-icon badge-${variant} ${className}`}
            title={title}
            onClick={onClick}
        >
            {icon}
        </button>
    );
}
