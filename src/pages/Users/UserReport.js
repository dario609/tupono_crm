import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import UsersApi from "../../api/usersApi";
import Swal from "sweetalert2";

const UserReport = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    // Dummy data for now
    const dummyProjects = [
        { id: 1, name: "Project A", status: "Active", tasks: 12 },
        { id: 2, name: "Project B", status: "Completed", tasks: 5 },
    ];

    const dummyTasks = [
        { id: 1, title: "Prepare Report", status: "In Progress", project: "Project A" },
        { id: 2, title: "Update Documentation", status: "Pending", project: "Project B" },
    ];

    const dummyReports = [
        { id: 1, title: "Quarterly Summary", date: "2024-01-10" },
        { id: 2, title: "Engagement Report", date: "2024-03-18" },
    ];

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const json = await UsersApi.getById(id);
                console.log('user', json?.data);
                setUser(json?.data || {});
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Failed to load user report data", "error");
            }
        };
        fetchReportData();
    }, [id]);

    return (
        <>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3">
                <h6 className="fw-semibold mb-0">User Report Overview</h6>
            </div>
            <div className="card mt-3 shadow-sm">
                {/* Page Header */}


                <div className="card-body">
                    {/* USER BASIC INFO CARD */}
                    <div className="card shadow-sm mb-4 border-0">
                        <div className="card-body">
                            <h4 className="fw-bold mb-1">
                                {user?.first_name} {user?.last_name}
                            </h4>
                            <div className="text-muted">{user?.email}</div>

                            <div className="mt-3 d-flex gap-2">
                                <span className="badge bg-primary px-3 py-2">
                                    {user?.role_id?.role_name || "User"}
                                </span>

                                <span
                                    className={`badge px-3 py-2 ${user?.status ? "bg-success" : "bg-danger"
                                        }`}
                                >
                                    {user?.status ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* GRID SECTIONS */}
                    <div className="row">

                        {/* PROJECTS */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card shadow-sm h-100 border-0">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-semibold mb-0">Projects</h5>
                                </div>
                                <div className="card-body">
                                    {dummyProjects.map((p) => (
                                        <div key={p.id} className="mb-3 pb-3 border-bottom">
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <strong>{p.name}</strong><br />
                                                    <span className={`badge ${p.status === "Active" ? "bg-success" : "bg-secondary"
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <div className="text-muted small">Tasks: {p.tasks}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* TASKS */}
                        <div className="col-lg-4 col-md-6 mb-4">
                            <div className="card shadow-sm h-100 border-0">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-semibold mb-0">Tasks</h5>
                                </div>
                                <div className="card-body">
                                    {dummyTasks.map((t) => (
                                        <div key={t.id} className="mb-3 pb-3 border-bottom">
                                            <strong>{t.title}</strong><br />
                                            <span className="text-muted small">Project: {t.project}</span>
                                            <br />
                                            <span
                                                className={`badge mt-2 ${t.status === "In Progress"
                                                        ? "bg-info text-dark"
                                                        : t.status === "Pending"
                                                            ? "bg-warning text-dark"
                                                            : "bg-success"
                                                    }`}
                                            >
                                                {t.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* REPORTS */}
                        <div className="col-lg-4 col-md-12 mb-4">
                            <div className="card shadow-sm h-100 border-0">
                                <div className="card-header bg-white border-0">
                                    <h5 className="fw-semibold mb-0">Reports</h5>
                                </div>
                                <div className="card-body">
                                    {dummyReports.map((r) => (
                                        <div key={r.id} className="mb-3 pb-3 border-bottom">
                                            <strong>{r.title}</strong><br />
                                            <span className="text-muted small">Date: {r.date}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </>
    );
};

export default UserReport;
