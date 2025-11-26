import React from "react";
import { SkeletonTableRow } from "../../common/SkelentonTableRow";
import EngagementTableRow from "./engagementTableRow";

export default function EngagementTable({
    rows,
    loading,
    page,
    perpage,
    handleEdit,
    handleDelete,
    handleView
}) {
    return (
        <div className="table-responsive">
            <table className="table table-striped">

                <thead>
                    <tr>
                        <th style={{ width: "5%" }}>SN</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Purpose</th>
                        <th>People</th>
                        <th>Hapū</th>
                        <th>Project</th>
                        <th>Outcome</th>
                        <th style={{ minWidth: "140px", width: "140px" }}>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <SkeletonTableRow
                            rows={5}
                            cols={9}
                            widths={[
                                "5%", null, null, null, null, null, null, "250px", "140px"
                            ]}
                        />
                    ) : rows.length > 0 ? (
                        rows.map((r, idx) => (
                            <EngagementTableRow
                                key={r._id}
                                row={r}
                                sn={perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1}
                                handleEdit={handleEdit}
                                handleDelete={handleDelete}
                                handleView={handleView}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} className="text-center py-4">
                                No Engagements found
                            </td>
                        </tr>
                    )}
                </tbody>

            </table>
        </div>
    );
}
