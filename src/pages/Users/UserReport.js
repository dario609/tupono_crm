import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Row, Col, Badge, Spinner, Tabs, Tab } from "react-bootstrap";
import UsersApi from "../../api/usersApi";
import Swal from "sweetalert2";
import defaultProfileImage from "../../assets/images/user.jpg";
import safeString from "../../utils/safe";

const UserReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchReportData();
    }, [id]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await UsersApi.getUserReport(id);
            setReportData(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load user report data", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadge = (status, type = "default") => {
        const badges = {
            active: <Badge bg="success">Active</Badge>,
            inactive: <Badge bg="secondary">Inactive</Badge>,
            draft: <Badge bg="warning" text="dark">Draft</Badge>,
            complete: <Badge bg="success">Complete</Badge>,
            "Just starting": <Badge bg="info" text="dark">Just Starting</Badge>,
            Working: <Badge bg="primary">Working</Badge>,
            "Nearly Complete": <Badge bg="warning" text="dark">Nearly Complete</Badge>,
            Complete: <Badge bg="success">Complete</Badge>,
        };
        return badges[status] || <Badge bg="secondary">{status}</Badge>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="card mt-3">
                <div className="card-body text-center">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    const { user, projects, tasks, reports, teams, stats } = reportData;
    const profileImageUrl = user?.profile_image
        ? `${process.env.REACT_APP_TUPONO_API_URL.replace('/api', '')}${user.profile_image}`
        : defaultProfileImage;

    return (
        <>
            {/* Breadcrumb */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24 card mt-3">
                <div className="col-12 card-body">
                    <div className="template-demo">
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb breadcrumb-custom">
                                <li className="breadcrumb-item">
                                    <a href="/admin/dashboard" style={{ textDecoration: "none" }}>
                                        Dashboard
                                    </a>
                                </li>
                                <li className="breadcrumb-item">
                                    <a href="/users" style={{ textDecoration: "none" }}>
                                        Users
                                    </a>
                                </li>
                                <li className="breadcrumb-item active">
                                    <span>User Report</span>
                                </li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="card mt-3 shadow-sm">
                <div className="card-body">
                    {/* User Profile Header */}
                    <Row className="mb-4">
                        <Col md={12}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <Row className="align-items-center">
                                        <Col xs="auto">
                                            <img
                                                src={profileImageUrl}
                                                alt="Profile"
                                                className="rounded-circle"
                                                style={{
                                                    width: "100px",
                                                    height: "100px",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </Col>
                                        <Col>
                                            <h3 className="mb-1 fw-bold">
                                                {safeString(user?.first_name)} {safeString(user?.last_name)}
                                            </h3>
                                            <p className="text-muted mb-2">
                                                <i className="mdi mdi-email me-1"></i>
                                                {safeString(user?.email)}
                                            </p>
                                            <div className="d-flex gap-2 flex-wrap">
                                                {user?.role_id?.role_name && (
                                                    <Badge bg="primary" className="px-3 py-2">
                                                        {user.role_id.role_name}
                                                    </Badge>
                                                )}
                                                {user?.phone && (
                                                    <Badge bg="info" className="px-3 py-2">
                                                        <i className="mdi mdi-phone me-1"></i>
                                                        {safeString(user.phone)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Statistics Cards */}
                    <Row className="mb-4">
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-white mb-1">Total Projects</h6>
                                            <h2 className="mb-0">{stats?.totalProjects || 0}</h2>
                                            <small className="text-white">
                                                {stats?.activeProjects || 0} Active
                                            </small>
                                        </div>
                                        <i className="mdi mdi-folder-multiple-outline" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-white mb-1">Total Tasks</h6>
                                            <h2 className="mb-0">{stats?.totalTasks || 0}</h2>
                                            <small className="text-white">
                                                {stats?.completedTasks || 0} Completed
                                            </small>
                                        </div>
                                        <i className="mdi mdi-checkbox-multiple-marked-circle" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-white mb-1">Total Reports</h6>
                                            <h2 className="mb-0">{stats?.totalReports || 0}</h2>
                                            <small className="text-white">
                                                {stats?.completeReports || 0} Complete
                                            </small>
                                        </div>
                                        <i className="mdi mdi-file-document-multiple" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3} sm={6} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}>
                                <Card.Body className="text-white">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-white mb-1">Teams</h6>
                                            <h2 className="mb-0">{stats?.totalTeams || 0}</h2>
                                            <small className="text-white">Member</small>
                                        </div>
                                        <i className="mdi mdi-account-group" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Tabs for Detailed Views */}
                    {/* style={{ backgroundColor: "green", color: 'red'}} */}
                    <style>
                        {`
                            .nav-tabs .nav-link {
                                background-color: green;
                                color: white;
                                border: 1px solid white;
                            }
                            .nav-tabs .nav-link.active {
                                background-color: white;
                                color: black;
                            }
                            
                        `}
                    </style>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-3"
                        fill
                    >
                        <Tab eventKey="overview"  title={
                            <span>
                                <i className="mdi mdi-view-dashboard me-1"></i>
                                Overview
                            </span>
                        }>
                            <Row className="mt-3">
                                <Col md={6} className="mb-4">
                                    <Card className="h-100 shadow-sm">
                                        <Card.Header className="bg-white">
                                            <h5 className="mb-0">
                                                <i className="mdi mdi-folder-multiple-outline me-2"></i>
                                                Recent Projects
                                            </h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {projects && projects.length > 0 ? (
                                                projects.slice(0, 5).map((project) => (
                                                    <div
                                                        key={project._id}
                                                        className="mb-3 pb-3 border-bottom cursor-pointer"
                                                        onClick={() => navigate(`/projects/${project._id}/edit`)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-1 fw-semibold">{safeString(project.name)}</h6>
                                                                <p className="text-muted small mb-2">
                                                                    {safeString(project.description) || "No description"}
                                                                </p>
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    {getStatusBadge(project.status)}
                                                                    {project.team_id && (
                                                                        <Badge bg="info">{safeString(project.team_id.title)}</Badge>
                                                                    )}
                                                                </div>
                                                                <small className="text-muted d-block mt-2">
                                                                    {project.start_date && `Start: ${formatDate(project.start_date)}`}
                                                                    {project.end_date && ` • End: ${formatDate(project.end_date)}`}
                                                                </small>
                                                            </div>
                                                            {project.tasks && project.tasks.length > 0 && (
                                                                <Badge bg="secondary">{project.tasks.length} Tasks</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-muted text-center py-4">No projects found</p>
                                            )}
                                            {projects && projects.length > 5 && (
                                                <div className="text-center mt-3">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => setActiveTab("projects")}
                                                    >
                                                        View All Projects ({projects.length})
                                                    </button>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6} className="mb-4">
                                    <Card className="h-100 shadow-sm">
                                        <Card.Header className="bg-white">
                                            <h5 className="mb-0">
                                                <i className="mdi mdi-checkbox-multiple-marked-circle me-2"></i>
                                                Recent Tasks
                                            </h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {tasks && tasks.length > 0 ? (
                                                tasks.slice(0, 5).map((task) => (
                                                    <div key={task._id} className="mb-3 pb-3 border-bottom">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-1 fw-semibold">{safeString(task.content) || "Untitled Task"}</h6>
                                                                {task.project_id && (
                                                                    <p className="text-muted small mb-2">
                                                                        Project: {safeString(task.project_id.name)}
                                                                    </p>
                                                                )}
                                                                <div className="d-flex gap-2 flex-wrap mb-2">
                                                                    {getStatusBadge(task.status)}
                                                                    {task.duration > 0 && (
                                                                        <Badge bg="secondary">
                                                                            {task.duration} {task.duration_type}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <small className="text-muted d-block">
                                                                    {task.start_date && `Start: ${formatDate(task.start_date)}`}
                                                                    {task.end_date && ` • End: ${formatDate(task.end_date)}`}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-muted text-center py-4">No tasks found</p>
                                            )}
                                            {tasks && tasks.length > 5 && (
                                                <div className="text-center mt-3">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => setActiveTab("tasks")}
                                                    >
                                                        View All Tasks ({tasks.length})
                                                    </button>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Tab>

                        <Tab eventKey="projects" title={
                            <span>
                                <i className="mdi mdi-folder-multiple-outline me-1"></i>
                                Projects ({projects?.length || 0})
                            </span>
                        }>
                            <Card className="mt-3 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">All Projects</h5>
                                </Card.Header>
                                <Card.Body>
                                    {projects && projects.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Project Name</th>
                                                        <th>Status</th>
                                                        <th>Team</th>
                                                        <th>Start Date</th>
                                                        <th>End Date</th>
                                                        <th>Tasks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projects.map((project) => (
                                                        <tr
                                                            key={project._id}
                                                            onClick={() => navigate(`/projects/${project._id}/edit`)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <td>
                                                                <strong>{safeString(project.name)}</strong>
                                                                {project.description && (
                                                                    <>
                                                                        <br />
                                                                        <small className="text-muted">{safeString(project.description)}</small>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge(project.status)}</td>
                                                            <td>
                                                                {project.team_id ? (
                                                                    <Badge bg="info">{safeString(project.team_id.title)}</Badge>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{formatDate(project.start_date)}</td>
                                                            <td>{formatDate(project.end_date)}</td>
                                                            <td>
                                                                {project.tasks && project.tasks.length > 0 ? (
                                                                    <Badge bg="secondary">{project.tasks.length}</Badge>
                                                                ) : (
                                                                    <span className="text-muted">0</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted text-center py-4">No projects found</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="tasks" title={
                            <span>
                                <i className="mdi mdi-checkbox-multiple-marked-circle me-1"></i>
                                Tasks ({tasks?.length || 0})
                            </span>
                        }>
                            <Card className="mt-3 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">All Tasks</h5>
                                </Card.Header>
                                <Card.Body>
                                    {tasks && tasks.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Task</th>
                                                        <th>Project</th>
                                                        <th>Status</th>
                                                        <th>Duration</th>
                                                        <th>Start Date</th>
                                                        <th>End Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tasks.map((task) => (
                                                        <tr key={task._id}>
                                                            <td>
                                                                <strong>{safeString(task.content) || "Untitled Task"}</strong>
                                                            </td>
                                                            <td>
                                                                {task.project_id ? (
                                                                    <span>{safeString(task.project_id.name)}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge(task.status)}</td>
                                                            <td>
                                                                {task.duration > 0 ? (
                                                                    <span>{task.duration} {task.duration_type}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{formatDate(task.start_date)}</td>
                                                            <td>{formatDate(task.end_date)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted text-center py-4">No tasks found</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="reports" title={
                            <span>
                                <i className="mdi mdi-file-document-multiple me-1"></i>
                                Reports ({reports?.length || 0})
                            </span>
                        }>
                            <Card className="mt-3 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">All Reports</h5>
                                </Card.Header>
                                <Card.Body>
                                    {reports && reports.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Report Title</th>
                                                        <th>Project</th>
                                                        <th>Status</th>
                                                        <th>Type</th>
                                                        <th>Hours</th>
                                                        <th>Created Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.map((report) => (
                                                        <tr
                                                            key={report._id}
                                                            onClick={() => navigate(`/reports/${report._id}/edit`)}
                                                            style={{ cursor: "pointer" }}
                                                        >
                                                            <td>
                                                                <strong>{safeString(report.project_title)}</strong>
                                                                {report.report_type && (
                                                                    <>
                                                                        <br />
                                                                        <small className="text-muted">{safeString(report.report_type)}</small>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {report.project_id ? (
                                                                    <span>{safeString(report.project_id.name)}</span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge(report.report_status)}</td>
                                                            <td>
                                                                {report.report_type ? (
                                                                    <Badge bg="info">{safeString(report.report_type)}</Badge>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                            <td>{report.hours || 0}</td>
                                                            <td>{formatDate(report.createdAt)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted text-center py-4">No reports found</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>

                        <Tab eventKey="teams" title={
                            <span>
                                <i className="mdi mdi-account-group me-1"></i>
                                Teams ({teams?.length || 0})
                            </span>
                        }>
                            <Card className="mt-3 shadow-sm">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Team Memberships</h5>
                                </Card.Header>
                                <Card.Body>
                                    {teams && teams.length > 0 ? (
                                        <Row>
                                            {teams.map((team) => (
                                                <Col md={6} lg={4} key={team._id} className="mb-3">
                                                    <Card
                                                        className="h-100 shadow-sm cursor-pointer"
                                                        onClick={() => navigate(`/teams/${team._id}/edit`)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <Card.Body>
                                                            <h6 className="fw-semibold mb-2">{safeString(team.title)}</h6>
                                                            <p className="text-muted small mb-3">
                                                                {safeString(team.description) || "No description"}
                                                            </p>
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                {getStatusBadge(team.status)}
                                                                {team.created_by && (
                                                                    <small className="text-muted">
                                                                        Created by {safeString(team.created_by.first_name)} {safeString(team.created_by.last_name)}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <p className="text-muted text-center py-4">No team memberships found</p>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </>
    );
};

export default UserReport;

