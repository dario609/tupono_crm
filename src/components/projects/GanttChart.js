import React from "react";
import "./gantt.css";

const GanttChartTable = ({ tasks, onEditTask }) => {
    if (!tasks || tasks.length === 0) return <div>No data</div>;

    // Determine start → end range
    const minStart = new Date(Math.min(...tasks.map(t => new Date(t.start_date))));
    const maxEnd = new Date(Math.max(...tasks.map(t => new Date(t.end_date))));

    minStart.setHours(0, 0, 0, 0);
    maxEnd.setHours(0, 0, 0, 0);

    // Build DAILY timeline
    const days = [];
    const cursor = new Date(minStart);

    while (cursor <= maxEnd) {
        days.push({
            date: new Date(cursor),
            label: cursor.toLocaleDateString("en-NZ", {
                day: "2-digit",
                month: "short",
            }),
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    const totalDays = days.length;

    // Helpers
    const getLeftPercent = (start) => {
        const diff = (new Date(start) - minStart) / (1000 * 60 * 60 * 24);
        return (diff / totalDays) * 100;
    };

    const getWidthPercent = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffDays = (e - s) / (1000 * 60 * 60 * 24) + 1;
        return (diffDays / totalDays) * 100;
    };

    return (
        <div className="gantt-container">
            <table className="gantt-table">

                {/* DAILY HEADER ONLY */}
                <thead>
                    <tr>
                        <th className="sticky-header" style={{ background: '#031356cf', color: 'white', borderRadius: '0px' }}>Task</th>

                        {days.map((d, i) => (
                            <th key={i} className="day-header sticky-header">
                                {d.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {tasks.map((t) => (
                        <tr key={t._id}>
                            <td className="task-col sticky-col">{t.content}</td>

                            <td
                                colSpan={days.length}
                                className="timeline-row"
                            >
                                <div
                                    className="gantt-bar"
                                    onClick={() => onEditTask(t)}
                                    style={{
                                        left: `${getLeftPercent(t.start_date)}%`,
                                        width: `${getWidthPercent(t.start_date, t.end_date)}%`,
                                        cursor: "pointer",
                                    }}
                                    title="Click to edit task"
                                />

                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
};

export default GanttChartTable;
