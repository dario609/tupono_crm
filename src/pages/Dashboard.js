import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import Select from "react-select";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useAuth } from "../context/AuthProvider";
import { rolesLabel } from "../constants";

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role_id?.role_name === rolesLabel.superAdmin;
  
  const [users, setUsers] = useState(0);
  const [projects, setProjects] = useState(0);
  const [tasks, setTasks] = useState(0);
  const [documents, setDocuments] = useState(0);
  const [teams, setTeams] = useState(0);
  const [engagements, setEngagements] = useState(0);
  const [meetings, setMeetings] = useState(0);
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    bar: { labels: [], datasets: [] },
    doughnut: { labels: [], data: [], backgroundColor: [], borderColor: [] },
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedProject]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const filter = selectedProject ? selectedProject.value : "";
      const res = await api.get(`/dashboard?filter=${filter}`);

      setUsers(res.users);
      setProjects(res.projects);
      setTasks(res.tasks);
      setDocuments(res.documents);
      setTeams(res.teams || 0);
      setEngagements(res.engagements || 0);
      setMeetings(res.meetings || 0);
      setProjectsList(
        res.projects_list.map((item) => ({
          value: item.id,
          label: item.project_title,
        }))
      );
      setChartData(res.chartData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const barChartData = {
    labels: chartData.bar.labels,
    datasets: chartData.bar.datasets,
  };

  const doughnutChartData = {
    labels:
      chartData.doughnut.data.length === 1 && chartData.doughnut.data[0] === 1
        ? ["No Data Available"]
        : chartData.doughnut.labels,
    datasets: [
      {
        data: chartData.doughnut.data,
        backgroundColor: chartData.doughnut.backgroundColor,
        borderColor: chartData.doughnut.borderColor,
        borderWidth: 1,
      },
    ],
  };

  const StatCard = ({ title, count, icon, onClick, link, loading: cardLoading }) => (
    <div className="col-sm-3 grid-margin">
      <div 
        className="card" 
        style={{ cursor: (onClick || link) && !cardLoading ? 'pointer' : 'default' }}
        onClick={() => {
          if (cardLoading) return;
          if (onClick) onClick();
          else if (link) navigate(link);
        }}
      >
        <div className="card-body bg-custom1">
          <div className="d-flex align-items-center theme-primary">
            <div className="w-60 h-60 me-3 bg-info-light rounded-circle text-center p-10">
              <div className="w-40 h-40 bg-info rounded-circle">
                {cardLoading ? (
                  <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 4 }} />
                ) : icon}
              </div>
            </div>
            <div className="d-flex flex-column">
              {cardLoading ? (
                <>
                  <div className="skeleton skeleton-line" style={{ width: 80, height: 12, marginBottom: 8 }} />
                  <div className="skeleton skeleton-line" style={{ width: 40, height: 24 }} />
                </>
              ) : (
                <>
                  <span className="text-fade fs-12">{title}</span>
                  <h2 className="text-dark hover-primary m-0 fw-bold">{count}</h2>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
      <div className="content-wrapper container mt-4">
        {/* Statistics Cards Section */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="row">
              <StatCard
                title="All Users"
                count={users}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-person-bounding-box micon-12" viewBox="0 0 16 16">
                <path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5M.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5"></path>
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0"></path>
              </svg>
            }
            link={isSuperAdmin ? "/users" : user?._id ? `/users/${user._id}/report` : null}
              />

              <StatCard
                title="All Projects"
                count={projects}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-list-task" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2 2.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zM3 3H2v1h1z"></path>
                <path d="M5 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M5.5 7a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1zm0 4a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1z"></path>
                <path fillRule="evenodd" d="M1.5 7a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5zM2 7h1v1H2zm0 3.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm1 .5H2v1h1z"></path>
              </svg>
            }
            link={isSuperAdmin ? "/projects" : user?._id ? `/users/${user._id}/report` : null}
              />

              <StatCard
                title="All Tasks"
                count={tasks}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-check-square" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"></path>
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"></path>
              </svg>
            }
            link={isSuperAdmin ? "/projects" : user?._id ? `/projects/${user._id}/report` : null}
              />

              <StatCard
                title="All Documents"
                count={documents}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"></path>
                <path d="M4.603 14.087a.8.8 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.7 7.7 0 0 1 1.482-.645 20 20 0 0 0 1.062-2.227 7.3 7.3 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a11 11 0 0 0 .98 1.686 5.8 5.8 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.86.86 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.7 5.7 0 0 1-.911-.95 11.7 11.7 0 0 0-1.997.406 11.3 11.3 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.8.8 0 0 1-.58.029m1.379-1.901q-.25.115-.459.238c-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361q.016.032.026.044l.035-.012c.137-.056.355-.235.635-.572a8 8 0 0 0 .45-.606m1.64-1.33a13 13 0 0 1 1.01-.193 12 12 0 0 1-.51-.858 21 21 0 0 1-.5 1.05zm2.446.45q.226.245.435.41c.24.19.407.253.498.256a.1.1 0 0 0 .07-.015.3.3 0 0 0 .094-.125.44.44 0 0 0 .059-.2.1.1 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a4 4 0 0 0-.612-.053zM8.078 7.8a7 7 0 0 0 .2-.828q.046-.282.038-.465a.6.6 0 0 0-.032-.198.5.5 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822q.036.167.09.346z"></path>
              </svg>
            }
            link={isSuperAdmin ? "/documents" : user?._id ? `/users/${user._id}/report` : null}
              />
            </div>
          </div>
        </div>

        {/* Second Row of Statistics */}
        <div className="card mt-3">
          <div className="card-body">
            <div className="row">
              <StatCard
                title="All Teams"
                count={teams}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-people" viewBox="0 0 16 16">
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.629 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.024.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"></path>
              </svg>
            }
            link={isSuperAdmin ? "/teams" : user?._id ? `/users/${user._id}/report` : null}
              />

              <StatCard
                title="All Engagements"
                count={engagements}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-handshake" viewBox="0 0 16 16">
                <path d="M11.5 2a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zM9.5 3a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5zM7.5 4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5zM5.5 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V6a.5.5 0 0 1 .5-.5zM3.5 6a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5zM1.5 7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V8a.5.5 0 0 1 .5-.5z"></path>
              </svg>
            }
            link={isSuperAdmin ? "/engagement-tracker" : user?._id ? `/users/${user._id}/report` : null}
              />

              <StatCard
                title="All Meetings"
                count={meetings}
                loading={loading}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-calendar-check" viewBox="0 0 16 16">
                <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"></path>
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"></path>
              </svg>
            }
            link={isSuperAdmin ? "/calendar" : user?._id ? `/users/${user._id}/report` : null}
              />
            </div>
          </div>
        </div>

        {/* ====== Charts Section ====== */}
        <div className="row mt-3">
          {/* Left: Bar Chart */}
          <div className="col-lg-8 d-flex flex-column">
            <div className="row flex-grow">
              <div className="col-12 grid-margin stretch-card">
                <div className="card card-rounded">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-5">
                        <h4 className="card-title card-title-dash">Project Report</h4>
                        <p className="card-subtitle card-subtitle-dash">
                          An overview of project activity and key metrics
                        </p>
                      </div>
                      <div className="col-md-7">
                        {loading ? (
                          <div className="skeleton skeleton-sm" style={{ width: "100%", height: 38 }} />
                        ) : (
                          <Select
                            options={projectsList}
                            placeholder="Select project"
                            value={selectedProject}
                            onChange={setSelectedProject}
                          />
                        )}
                      </div>
                    </div>

                    <div className="chartjs-bar-wrapper mt-4" style={{ height: "280px" }}>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <div style={{ width: '100%' }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={`bar-skeleton-${i}`} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="skeleton skeleton-line" style={{ width: 80, height: 16 }} />
                                <div className="skeleton skeleton-line" style={{ flex: 1, height: 24, borderRadius: 4 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Bar
                          data={barChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: { color: "#6B778C", font: { size: 10 } },
                                grid: { color: "#F0F0F0" },
                              },
                              x: {
                                ticks: { color: "#6B778C", font: { size: 10 } },
                                grid: { display: false },
                              },
                            },
                            plugins: { legend: { display: false } },
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Doughnut Chart */}
          <div className="col-lg-4 d-flex flex-column">
            <div className="row flex-grow">
              <div className="col-12 grid-margin stretch-card">
                <div className="card card-rounded">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      {loading ? (
                        <div className="skeleton skeleton-line" style={{ width: 120, height: 20 }} />
                      ) : (
                        <h4 className="card-title card-title-dash">Overview</h4>
                      )}
                    </div>
                    <div style={{ height: "320px" }}>
                      {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
                          <div className="skeleton" style={{ width: 200, height: 200, borderRadius: '50%' }} />
                          <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={`legend-skeleton-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
                                <div className="skeleton skeleton-line" style={{ width: 60, height: 14 }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Doughnut
                          data={doughnutChartData}
                          options={{
                            cutout: 90,
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: true, position: "bottom" },
                              tooltip: { enabled: true },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
