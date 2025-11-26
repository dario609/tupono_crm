import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EngagementApi from "../../api/engagementApi";
import { useConfirmDelete } from "../dialogs/useConfirmDeleteDialog";

export function useEngagementTable() {

    const navigate = useNavigate();
    const { confirmDeleteDialog, DeleteError, DeleteSuccess } = useConfirmDelete();

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [search, setSearch] = useState("");
    const [perpage, setPerpage] = useState(10);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

   
    const load = async (opts = {}) => {
        setLoading(true);
        try {
            const json = await EngagementApi.list({
                perpage: opts.perpage ?? perpage,
                page: opts.page ?? page,
                search: opts.search ?? search,
            });

            setRows(json?.data || []);
            setTotal(json?.total || 0);
            setPerpage(json?.per_page ?? 10);
            setPage(json?.current_page || 1);

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load({ page: 1 });
    }, []);

    // ----------------------------------------
    // Delete Action
    // ----------------------------------------
    const handleDelete = async (id) => {
        const confirm = await confirmDeleteDialog({
            title: "Delete Engagement?"
        });

        if (!confirm.isConfirmed) return;
        
        setLoading(true);

        try {
            const res = await EngagementApi.remove(id);
            if (res?.success === false) {
                throw new Error(res?.message || "Delete failed");
            }

            await DeleteSuccess("Engagement removed successfully");

            // Functional update
            setRows(prev => prev.filter(r => r._id !== id));

            load({ page });
        } catch (err) {
            await DeleteError(err.message || "Could not delete engagement");
        }
    };

    // ----------------------------------------
    // Navigation actions
    // ----------------------------------------
    const handleReport = (id) => navigate(`/engagement-tracker/${id}/report`);
    const handleEdit = (id) => navigate(`/engagement-tracker/${id}/edit`);
    const handleView = (id) => navigate(`/engagement-tracker/${id}/view`);  
    // ----------------------------------------
    // Pagination UI logic
    // ----------------------------------------
    const lastPage = useMemo(() => {
        if (perpage === -1) return 1;
        return Math.max(1, Math.ceil(total / perpage));
    }, [total, perpage]);

    const pagesToShow = useMemo(() => {
        const items = [];
        if (lastPage <= 1) {
            if (total > 0) items.push(1);
            return items;
        }

        const push = (n) => items.push(n);

        if (page > 3) push(1);
        if (page > 4) push("...");

        for (let i = 1; i <= lastPage; i++) {
            if (i >= page - 2 && i <= page + 2) push(i);
        }

        if (page < lastPage - 3) push("...");
        if (page < lastPage - 2) push(lastPage);

        return items;
    }, [page, lastPage, total]);

    return {
        // State
        rows, loading, page, perpage, total, search,

        // Actions
        setSearch, setPerpage, load,
        handleDelete, handleEdit, handleReport, handleView,

        // Pagination
        pagesToShow,
        lastPage
    };
}
