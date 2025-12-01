import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentApi from "../../api/assessmentApi";
import ProjectsApi from "../../api/projectsApi";
import Swal from "sweetalert2";

export const useAssessmentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState("");

  const [page, setPage] = useState(1);
  const [perpage, setPerpage] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        perpage: opts.perpage ?? perpage,
        page: opts.page ?? page,
        projectId: opts.projectId ?? filterProject,
      };

      const json = await AssessmentApi.list(params);

      setRows(json?.data || []);
      setTotal(json?.total || 0);
      setPage(json?.current_page ?? params.page);
      setPerpage(json?.per_page ?? params.perpage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const resp = await ProjectsApi.list({ perpage: -1 });
        setProjects(resp?.data || []);
      } finally {
        setLoading(false);
      }

      load({ page: 1 });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pagesToShow = useMemo(() => {
    const last = Math.ceil(total / (perpage === -1 ? total || 1 : perpage));
    const items = [];
    
    // Always show at least page 1 if there are any records
    if (last <= 1 && total > 0) {
      return [1];
    }
    
    if (last <= 1) return items;

    if (page > 3) items.push(1);
    if (page > 4) items.push("...");

    for (let j = page - 2; j <= page + 2; j++) {
      if (j >= 1 && j <= last) items.push(j);
    }

    if (page < last - 3) items.push("...");
    if (page < last - 2) items.push(last);

    return items;
  }, [page, perpage, total]);

  const remove = async (row) => {
    const ask = await Swal.fire({
      icon: "warning",
      text: "Delete this record?",
      showCancelButton: true,
    });

    if (!ask.isConfirmed) return;

    setLoading(true);
    try {
      await AssessmentApi.remove(row._id);
      load({});
    } finally {
      setLoading(false);
    }
  };

  const edit = (id) => {
    navigate(`/assessment/${id}/edit`);
  };

  return {
    loading,
    rows,
    projects,
    filterProject,
    setFilterProject,
    page,
    setPage,
    perpage,
    total,
    pagesToShow,
    load,
    remove,
    edit,
  };
};
