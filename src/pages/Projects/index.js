import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { usePagination } from "../../hooks/usePagination";
import { Pagination } from "../../components/common/Pagination";
import { confirmDialog } from "../../utils/confirmDialog";
import ProjectsTable from "../../components/projects/ProjectsTable";
import ProjectsControl from "../../components/projects/ProjectsControl";

import ProjectsApi from "../../api/projectsApi";

import Swal from "sweetalert2";

const ProjectsPage = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [perpage, setPerpage] = useState(10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAllProjects, setTotalAllProjects] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    active: 0,
    inactive: 0,
    complete: 0,
  });
  const { lastPage, pagesToShow } = usePagination({ page, total, perpage });

  const navigate = useNavigate();

  // Load total count and status breakdown of all projects (without filters)
  const loadTotalCount = async () => {
    try {
      const res = await ProjectsApi.list({ perpage: -1, page: 1, search: "" });
      const allProjects = res?.data || [];
      setTotalAllProjects(allProjects.length);
      
      // Count by status
      const counts = {
        active: 0,
        inactive: 0,
        complete: 0,
      };
      
      allProjects.forEach((project) => {
        const status = project.status?.toString().toLowerCase() || "";
        if (status === "0" || status === "active") {
          counts.active++;
        } else if (status === "1" || status === "inactive") {
          counts.inactive++;
        } else if (status === "2" || status === "complete") {
          counts.complete++;
        } else {
          // Default to active if status is not recognized
          counts.active++;
        }
      });
      
      setStatusCounts(counts);
    } catch (err) {
      console.error("Error loading total count:", err);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    loadTotalCount();
  }, []);

  const load = async (opts = {}) => {
    const params = {
      perpage: Number(opts.perpage ?? perpage),
      page: Number(opts.page ?? page),
      search: String(opts.search ?? search),
    };

    setLoading(true);

    try {
      const res = await ProjectsApi.list(params);

      const {
        data = [],
        total = 0,
        current_page = params.page,
        per_page = params.perpage
      } = res || {};

      setRows(data);
      setTotal(total);
      setPage(current_page);
      setPerpage(per_page);
    } finally {
      setLoading(false);
    }
  };

  const onSearchKeyDown = (e) => { if (e.key === "Enter") load({ page: 1 }); };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    load({ page: newPage });
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      title: "Are you sure?",
      text: "Are you sure you want to delete this project? This action cannot be undone.",
    });

    if (!confirmed) return;

    try {
      const res = await ProjectsApi.remove(id);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to delete project.");
      }

      Swal.fire({
        title: "Deleted!",
        text: res.message || "Project deleted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // Compute next page cleanly
      const isLastItemOnPage = rows.length === 1 && page > 1;
      const nextPage = isLastItemOnPage ? page - 1 : page;

      setTotal((prev) => Math.max(prev - 1, 0));
      setTotalAllProjects((prev) => Math.max(prev - 1, 0));
      
      // Reload status counts after delete
      loadTotalCount();

      load({ page: nextPage });
    }
    catch (err) {
      Swal.fire({
        title: "Error!",
        text: err.message || "There was an error deleting the project. Please try again.",
        icon: "error",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };


  return (
    <div className="card mt-3">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3"> 
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <h6 className="fw-semibold mb-0">All Projects ({totalAllProjects} Projects)</h6>
          
            
          <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.875rem", color: "#6c757d" }}>
            <span>
              <span className="badge bg-success me-1" style={{ padding: "2px 6px" }}></span>
              Active: {statusCounts.active}
            </span>
            <span>
              <span className="badge bg-secondary me-1" style={{ padding: "2px 6px" }}></span>
              Inactive: {statusCounts.inactive}
            </span>
            <span>
              <span className="badge bg-info me-1" style={{ padding: "2px 6px" }}></span>
              Complete: {statusCounts.complete}
            </span>
          </div>
        </div>
        <div>
          <NavLink to="/projects/create" className="btn btn-primary btn-rounded btn-fw" style={{ fontSize: '15px' }}>
            <i className="menu-icon mdi mdi-account-plus-outline"></i> Add Project
          </NavLink>
        </div>
      </div>

      <div className="row card-body pt-0">
        <div className="col-12 p-0">
          <ProjectsControl
            perpage={perpage}
            setPerpage={setPerpage}
            search={search}
            setSearch={setSearch}
            onSearchKeyDown={onSearchKeyDown}
            load={load}
          />

          <ProjectsTable
            loading={loading}
            rows={rows}
            page={page}
            perpage={perpage}
            handleDelete={handleDelete}
            navigate={navigate} />

          <Pagination
            page={page}
            lastPage={lastPage}
            pages={pagesToShow}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;


