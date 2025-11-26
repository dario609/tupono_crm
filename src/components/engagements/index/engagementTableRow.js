import React from "react";
import ActionButton from "../../common/ActionButton";
import { EditIcon } from "../../icons/EditIcon";
import { DeleteIcon } from "../../icons/DeleteIcon";

export default function EngagementTableRow({ row, sn, handleEdit, handleDelete, handleView }) {
    const hasMeetingMinutes = !!row.meeting_minutes;
    const tuponoUrl = `${process.env.REACT_APP_TUPONO_API_URL.replace('/api', '')}`
    
    const getMeetingMinutesUrl = () => {
        if (!row.meeting_minutes) return null;
        const path = row.meeting_minutes.startsWith('uploads/') 
            ? row.meeting_minutes 
            : `uploads/${row.meeting_minutes}`;
        return `${tuponoUrl}/${path}`;
    };

    const handleDownload = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = getMeetingMinutesUrl();
        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <tr>
            <td>{sn}</td>
            <td>{row.engage_date?.substring(0, 10) || "-"}</td>
            <td>{row.engage_type || "-"}</td>
            <td>{row.purpose || "-"}</td>
            <td>{row.engage_num || "-"}</td>
            <td>{row.hapus.map(h => h.name).join(", ") || "-"}</td>
            <td>{row.project?.name || "-"}</td>
            <td style={{ maxWidth: 250 }}>{row.outcome}</td>

            <td className="actions-column">
                <div className="actions-wrapper">
                  
                    {hasMeetingMinutes ? (
                        <button
                            className="btn btn-sm btn-rounded btn-icon badge-info"
                            title="Download Meeting Minutes"
                            onClick={handleDownload}
                            style={{ cursor: "pointer" }}
                        >
                            <i className="mdi mdi-download"></i>
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm btn-rounded btn-icon badge-secondary"
                            title="No meeting minutes available"
                            disabled
                            style={{ cursor: "not-allowed", opacity: 0.5 }}
                        >
                            <i className="mdi mdi-download"></i>
                        </button>
                    )}
                    <ActionButton
                        icon={EditIcon}
                        variant="success"
                        title="Edit"
                        onClick={() => handleEdit(row._id)}
                    />
                    <ActionButton
                        icon={DeleteIcon}
                        variant="danger"
                        title="Delete"
                        onClick={() => handleDelete(row._id)}
                    />
                </div>
            </td>
        </tr>
    );
}
