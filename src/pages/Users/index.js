import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import UsersApi from "../../api/usersApi";
import HapuListsApi from "../../api/hapulistsApi";
import PermissionsApi from "../../api/permissionsApi";
import { AuthApi } from "../../api/authApi";
import { SkeletonTableRow } from "../../components/common/SkelentonTableRow.js";
import "../../styles/engagementAdd.css";

const UsersPage = ({ user, permissions }) => {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [perpage, setPerpage] = useState(10);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perms, setPerms] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedUsersMap, setSelectedUsersMap] = useState(new Map());
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [emailSending, setEmailSending] = useState(false);
    const [hapuFilter, setHapuFilter] = useState("");
    const [hapus, setHapus] = useState([]);
    const [emailRecipientIds, setEmailRecipientIds] = useState([]);
    const [emailRecipientUsers, setEmailRecipientUsers] = useState([]);
    const lastPage = useMemo(() => {
        if (perpage === -1) return 1;
        return Math.max(1, Math.ceil(total / (perpage || 10)));
    }, [total, perpage]);

    const canAdd = perms?.user_management?.is_add === 1;

    const load = async (opts = {}) => {
        setLoading(true);
        try {
            const json = await UsersApi.list({
                perpage: opts.perpage ?? perpage,
                page: opts.page ?? page,
                search: opts.search ?? search,
                hapu: opts.hapu !== undefined ? opts.hapu : hapuFilter,
            });
            setRows(json?.data || []);
            setTotal(json?.total || 0);
            setPage(json?.current_page || 1);
            setPerpage(json?.per_page ?? 10);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const pJson = await PermissionsApi.me();
                setPerms(pJson?.data || {});
            } catch { }
        })();
        (async () => {
            try {
                const uJson = await AuthApi.check();
                if (uJson?.authenticated) setCurrentUser(uJson.user);
            } catch { }
        })();
        HapuListsApi.list({ perpage: -1 })
            .then((json) => setHapus(json?.data || []))
            .catch(() => setHapus([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        load({ page: 1, hapu: hapuFilter });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hapuFilter]);


    const [updatingId, setUpdatingId] = useState(null);

    const handleStatusToggle = async (id, nextChecked) => {
        const prev = rows.find((r) => r._id === id)?.status ?? false;
        // Optimistic flip to reflect immediate UI (like legacy)
        setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status: nextChecked } : r)));

        const result = await Swal.fire({
            text: "Are you sure you want to change the status?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes",
            cancelButtonText: "No",
        });

        if (!result.isConfirmed) {
            // Revert on cancel
            setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status: prev } : r)));
            return;
        }

        try {
            setUpdatingId(id);
            const newStatus = nextChecked ? "0" : "1"; // 0 => active, 1 => inactive
            const data = await UsersApi.toggleStatus(id, newStatus);
            if (data?.success === false) {
                throw new Error(data?.message || "Failed to update status");
            }
            // Align with server response (empstatus: 0 active, 1 inactive)
            if (typeof data.empstatus !== "undefined") {
                const serverChecked = data.empstatus === 0;
                setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status: serverChecked } : r)));
            }
            if (data?.message) {
                await Swal.fire({ icon: "success", title: "Success", text: data.message, timer: 1500, showConfirmButton: false });
            }
        } catch (e) {
            setRows((rs) => rs.map((r) => (r._id === id ? { ...r, status: prev } : r)));
            await Swal.fire({ icon: "error", title: "Error", text: e.message || "Server error occurred. Please try again.", timer: 2500, showConfirmButton: false });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: 'Are you sure?',
            text: 'Are you sure you want to delete this user? This action cannot be undone. Please confirm before proceeding.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });
        if (!confirm.isConfirmed) return;

        try {
            const data = await UsersApi.remove(id);
            if (data?.success === false) {
                throw new Error(data?.message || 'Failed to delete user');
            }
            await Swal.fire({
                title: 'Deleted!',
                text: data?.message || 'User deleted successfully',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });
            const newTotal = Math.max(0, total - 1);
            const newPage = rows.length === 1 && page > 1 ? page - 1 : page;
            setTotal(newTotal);
            await load({ page: newPage });
        }
        catch (err) {
            await Swal.fire({
                title: 'Error!',
                text: err.message || 'There was an error deleting the user. Please try again',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false,
            });
        }
    };

    const onSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            load({ page: 1 });
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === rows.length) {
            setSelectedIds(new Set());
            setSelectedUsersMap(new Map());
        } else {
            const nextIds = new Set(rows.map((r) => r._id));
            const nextMap = new Map(rows.map((r) => [r._id, r]));
            setSelectedIds(nextIds);
            setSelectedUsersMap(nextMap);
        }
    };

    const toggleSelect = (id, row) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setSelectedUsersMap((prev) => {
            const next = new Map(prev);
            if (next.has(id)) next.delete(id);
            else if (row) next.set(id, row);
            return next;
        });
    };

    const openEmailModal = (idsOrRows) => {
        let targetIds, targetUsers;
        if (Array.isArray(idsOrRows) && idsOrRows.length > 0) {
            const first = idsOrRows[0];
            if (typeof first === "object" && first._id) {
                targetUsers = idsOrRows;
                targetIds = new Set(targetUsers.map((u) => u._id));
            } else {
                targetIds = new Set(idsOrRows);
                targetUsers = Array.from(targetIds).map((id) => selectedUsersMap.get(id) || rows.find((r) => String(r._id) === String(id))).filter(Boolean);
            }
        } else {
            targetIds = selectedIds;
            targetUsers = Array.from(targetIds).map((id) => selectedUsersMap.get(id) || rows.find((r) => String(r._id) === String(id))).filter(Boolean);
        }
        if (targetIds.size === 0) return;
        setEmailRecipientIds(Array.from(targetIds));
        setEmailRecipientUsers(targetUsers);
        setEmailSubject("");
        setEmailBody("");
        setEmailModalOpen(true);
    };

    const removeEmailRecipient = (id) => {
        setEmailRecipientIds((prev) => prev.filter((x) => String(x) !== String(id)));
        setEmailRecipientUsers((prev) => prev.filter((u) => String(u._id) !== String(id)));
    };

    const handleSendBulkEmail = async () => {
        const recipients = emailRecipientUsers.map((r) => r.email).filter(Boolean);
        if (recipients.length === 0) {
            await Swal.fire({ icon: "warning", text: "No valid recipient emails." });
            return;
        }
        setEmailSending(true);
        try {
            const data = await UsersApi.sendBulkEmail({
                to: recipients,
                subject: emailSubject || "Message from Tupono",
                message: emailBody || "",
            });
            if (data?.success === false) throw new Error(data?.message || "Failed to send");
            await Swal.fire({ icon: "success", title: "Sent", text: data?.message || "Email sent successfully.", timer: 2000, showConfirmButton: false });
            setEmailModalOpen(false);
            setSelectedIds(new Set());
        } catch (e) {
            await Swal.fire({ icon: "error", title: "Error", text: e.message || "Failed to send email." });
        } finally {
            setEmailSending(false);
        }
    };

    // legacy-like pagination blocks
    const pagesToShow = useMemo(() => {
        const items = [];
        if (lastPage <= 1) {
            if (total > 0) items.push(1);
            return items;
        }
        const push = (n) => items.push(n);
        if (page > 3) push(1);
        if (page > 4) push("...");
        for (let j = 1; j <= lastPage; j++) {
            if (j >= page - 2 && j <= page + 2) push(j);
        }
        if (page < lastPage - 3) push("...");
        if (page < lastPage - 2) push(lastPage);
        return items;
    }, [page, lastPage, total]);

    const showingStarted = total === 0 ? 0 : (perpage === -1 ? 1 : (page - 1) * perpage + 1);
    const currentShowing = perpage === -1 ? total : Math.min(page * perpage, total);
    
    const handleDownload = async () => {
        try {
            const json = await UsersApi.list({ perpage: -1, search: "" });
            const users = json?.data || [];

            if (users.length === 0) {
                await Swal.fire({
                    icon: "info",
                    title: "No Data",
                    text: "No users to download."
                });
                return;
            }

            // Prepare rows as objects (better for XLSX)
            const rows = users.map(user => ({
                "First Name": user.first_name || "",
                "Last Name": user.last_name || "",
                "Email": user.email || "",
                "Phone": user.phone || "",
                "City": user.city || "",
                "Country": user.country || "",
                "Zip Code": user.zip_code || "",
                "Address": user.address || "",
                "Role": user.role_id?.role_name || "",
                "Hapu": (user.hapu || []).join("; "),
                "Iwi": (user.iwi || []).join("; "),
                "Marae": (user.marae || []).join("; "),
                "Maunga": (user.maunga || []).join("; "),
                "Awa": (user.awa || []).join("; "),
                "Status": user.status ? "Active" : "Inactive",
                "Created At": new Date(user.createdAt).toLocaleDateString()
            }));

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(rows);

            // Create workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

            // Auto column width (nice touch)
            const colWidths = Object.keys(rows[0]).map(key => ({
                wch: Math.max(
                    key.length,
                    ...rows.map(r => String(r[key] || "").length)
                )
            }));
            worksheet["!cols"] = colWidths;

            // Download file
            XLSX.writeFile(
                workbook,
                `users_list_${new Date().toISOString().split("T")[0]}.xlsx`
            );

        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to download users list."
            });
        }
    };

    return (
        <div className="card mt-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
                <h6 className="fw-semibold mb-0">Users Management</h6>
                <div className="d-flex gap-2">
                    {selectedIds.size > 0 && (
                        <button onClick={() => openEmailModal()} className="btn btn-info btn-rounded btn-fw">
                            <i className="menu-icon mdi mdi-email-send-outline"></i> Send Email ({selectedIds.size})
                        </button>
                    )}
                    <button onClick={handleDownload} className="btn btn-secondary btn-rounded btn-fw">
                        <i className="menu-icon mdi mdi-download"></i> Download
                    </button>
                    {canAdd && (
                        <NavLink to="/users/create" className="btn btn-primary btn-rounded btn-fw">
                            <i className="menu-icon mdi mdi-account-plus-outline"></i> Add User
                        </NavLink>
                    )}
                </div>
            </div>

            <div className="row card-body pt-0">
                <div className="col-12 p-0">
                    {/* legacy custom switch + actions CSS */}
                    <style>{`
                            .custom-switch-wrapper { display: inline-flex; align-items: center; gap: 10px; position: relative; font-size: 0.9rem; }
                            .custom-switch-input { display: none; }
                            .custom-switch-label { display: inline-flex; align-items: center; cursor: pointer; position: relative; width: 90px; height: 34px; background-color: #dd2923; border-radius: 50px; transition: background-color 0.3s ease; padding: 0 10px; box-sizing: border-box; }
                            .custom-switch-label .switch-handle { position: absolute; top: 4px; left: 4px; width: 26px; height: 26px; background-color: #fff; border-radius: 50%; transition: left 0.15s ease-in-out; z-index: 2; }
                            .custom-switch-input:checked + .custom-switch-label { background-color: #28a745; }
                            .custom-switch-input:checked + .custom-switch-label .switch-handle { left: 60px; transform: scale(1.05); }
                            .switch-text { position: absolute; font-size: 13px; font-weight: 500; color: white; width: 100%; text-align: center; z-index: 1; pointer-events: none; transition: opacity 0.3s; }
                            .switch-text.on { opacity: 0; }
                            .switch-text.off { opacity: 1; }
                            .custom-switch-input:checked + .custom-switch-label .switch-text.on { opacity: 1; }
                            .custom-switch-input:checked + .custom-switch-label .switch-text.off { opacity: 0; }
                            .custom-switch-input:disabled + .custom-switch-label { opacity: 0.6; cursor: not-allowed; }
                           .actions-column {
                                white-space: normal;
                                text-align: center;
                                }

                                .actions-wrapper {
                                display: flex;
                                gap: 6px;
                                justify-content: center;
                                flex-direction: row;
                                flex-wrap: nowrap;
                                }

                                @media (max-width: 576px) {
                                .actions-wrapper button {
                                    min-width: 35px;
                                    padding: 6px 6px;
                                }
                                }

                        `}</style>

                    <div className="d-flex align-items-center justify-content-between p-2 flex-wrap gap-2">
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            
                            <div className="d-flex align-items-center">
                                <label className="mb-0 me-2" htmlFor="perpage">Show</label>
                            <select
                                id="perpage"
                                className="form-control w-auto me-2"
                                value={perpage}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    setPerpage(v);
                                    load({ perpage: v, page: 1 });
                                }}
                            >
                                <option value={-1}>All</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>entries</span>
                            </div>
                        </div>

                        <div className="input-group" style={{ maxWidth: 360 }}>
                        <div className="d-flex align-items-center" style={{marginRight: 10}}>
                                <label className="mb-0 me-2" htmlFor="hapu-filter">Hapu</label>
                                <select
                                    id="hapu-filter"
                                    className="form-control form-select w-auto"
                                    value={hapuFilter}
                                    onChange={(e) => setHapuFilter(e.target.value)}
                                >
                                    <option value="">All Hapū</option>
                                    {hapus.map((h) => (
                                        <option key={h._id} value={h.name || h.hapu_name || ""}>
                                            {h.name || h.hapu_name || ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Search"
                                className="form-control"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={onSearchKeyDown}
                            />
                            <button className="btn btn-success btn-sm" onClick={() => load({ page: 1 })}>
                                <i className="fa fa-search" style={{ fontSize: "large" }}></i>
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th style={{ width: "36px" }}>
                                        <input
                                            type="checkbox"
                                            checked={rows.length > 0 && selectedIds.size === rows.length}
                                            onChange={toggleSelectAll}
                                            title="Select all"
                                        />
                                    </th>
                                    <th style={{ width: "5%" }}>SN</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Hapu</th>
                                    <th>Role</th>
                                    <th>Nga Rōpu</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, idx) => {
                                    const name = `${r.first_name || ""} ${r.last_name || ""}`.trim();
                                    const sn = perpage === -1 ? idx + 1 : (page - 1) * perpage + idx + 1;

                                    const canView = perms?.user_management?.is_view === 1;
                                    const canEdit = perms?.user_management?.is_edit === 1;
                                    const canDelete = perms?.user_management?.is_delete === 1;

                                    const isOwn = currentUser && currentUser.id === r._id;

                                    // Extract team names safely
                                    const teamNames = Array.isArray(r.userTeams)
                                        ? r.userTeams
                                            .map(tu => tu.team?.title)
                                            .filter(Boolean)
                                        : [];

                                    const hapuDisplay = Array.isArray(r.hapu) ? r.hapu.filter(Boolean).join(", ") : (r.hapu || "");

                                    return (
                                        <tr key={r._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(r._id)}
                                                    onChange={() => toggleSelect(r._id, r)}
                                                />
                                            </td>
                                            <td>{sn}</td>

                                            <td>{name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : '-'}</td>

                                            <td>
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    {r.email}
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-link p-0"
                                                        title="Send email"
                                                        onClick={() => openEmailModal([r])}
                                                    >
                                                        <i className="mdi mdi-email-send-outline"></i>
                                                    </button>
                                                </span>
                                            </td>

                                            <td>{hapuDisplay || "–"}</td>

                                            <td>{r.role_id?.role_name || '-'}</td>

                                            {/* 🔥 Display comma-separated team names */}
                                            <td>
                                                {teamNames.length > 0 ? (
                                                    teamNames.map((title, i) => {
                                                        const team = r.userTeams[i]?.team;
                                                        if (!team) return null;

                                                        return (
                                                            <span key={team._id}>
                                                                <a
                                                                    href={`/teams/${team._id}/edit`}
                                                                    className="text-primary"
                                                                    style={{ textDecoration: "underline", cursor: "pointer" }}
                                                                >
                                                                    {title}
                                                                </a>
                                                                {i < teamNames.length - 1 ? ", " : ""}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-muted">–</span>
                                                )}
                                            </td>


                                            {/* Status toggle */}
                                            <td>
                                                <div className="custom-switch-wrapper">
                                                    <input
                                                        type="checkbox"
                                                        id={`switch_status_${r._id}`}
                                                        className="custom-switch-input"
                                                        checked={Boolean(r.status)}
                                                        onChange={(e) => {
                                                            const prevChecked = e.target.checked;
                                                            handleStatusToggle(r._id, e.target.checked).catch(() => {
                                                                e.target.checked = !prevChecked;
                                                            });
                                                        }}
                                                        disabled={!canEdit || updatingId === r._id}
                                                    />
                                                    <label htmlFor={`switch_status_${r._id}`} className="custom-switch-label">
                                                        <span className="switch-text on">Active</span>
                                                        <span className="switch-text off">Inactive</span>
                                                        <span className="switch-handle"></span>
                                                    </label>
                                                </div>
                                            </td>

                                            <td className="actions-column">
                                                {(canView || canEdit || canDelete) ? (
                                                    <div className="actions-wrapper">
                                                        {canView && (
                                                            <button className="btn badge-info btn-sm btn-rounded btn-icon" title="View Activity" onClick={() => navigate(`/users/${r._id}/report`)} >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
                                                                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                                                                    className="feather feather-eye align-middle">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {canEdit && (
                                                            <button
                                                                className="btn badge-success btn-sm btn-rounded btn-icon"
                                                                title="Edit"
                                                                onClick={() => navigate(`/users/${r._id}/edit`)}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round"
                                                                    className="feather feather-edit-2 align-middle">
                                                                    <polygon points="16 3 21 8 8 21 3 21 3 16 16 3" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        {canDelete && !isOwn && (
                                                            <button
                                                                className="btn badge-danger btn-sm btn-rounded btn-icon"
                                                                title="Delete"
                                                                onClick={() => handleDelete(r._id)}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                                                    fill="none" stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round"
                                                                    className="feather feather-trash align-middle">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3
                                        0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">–</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {rows.length === 0 && (
                                    loading ? (
                                        <SkeletonTableRow rows={5} cols={9} />
                                    ) : (
                                        <tr className="text-center">
                                            <td colSpan={9} className="py-4">No Records found</td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {total > 0 && (
                        <div className="row p-2">
                            <div className="col-sm-12 col-md-5">
                                <div className="dataTables_info" role="status" aria-live="polite">
                                    <p>Showing {showingStarted} to {currentShowing} of {total} entries</p>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7">
                                <div className="dataTables_paginate paging_simple_numbers">
                                    <nav aria-label="Page navigation example">
                                        <ul className="pagination justify-content-end">
                                            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" aria-label="Previous" onClick={() => {
                                                    if (page > 1) {
                                                        const next = page - 1;
                                                        setPage(next);
                                                        load({ page: next });
                                                    }
                                                }}>
                                                    <i className="fa fa-angle-left left-left-ang" aria-hidden="true"></i>
                                                </button>
                                            </li>
                                            {pagesToShow.map((it, i) => (
                                                <li key={i} className={`page-item ${it === page ? 'active' : ''} ${it === '...' ? 'disabled' : ''}`}>
                                                    {it === '...'
                                                        ? <span className="page-link">...</span>
                                                        : <button className="page-link popto" onClick={() => { setPage(it); load({ page: it }); }}>{it}</button>}
                                                </li>
                                            ))}
                                            <li className={`page-item ${page >= lastPage ? 'disabled' : ''}`}>
                                                <button className="page-link" aria-label="Next" onClick={() => {
                                                    if (page < lastPage) {
                                                        const next = page + 1;
                                                        setPage(next);
                                                        load({ page: next });
                                                    }
                                                }}>
                                                    <i className="fa fa-angle-right left-left-ang" aria-hidden="true"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {emailModalOpen && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Send Email</h5>
                                <button type="button" className="btn-close" onClick={() => setEmailModalOpen(false)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Recipients</label>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        {emailRecipientUsers.map((u) => (
                                            <div key={u._id} className="hapu-chip">
                                                <span>{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</span>
                                                <button
                                                    type="button"
                                                    className="remove-btn"
                                                    onClick={() => removeEmailRecipient(u._id)}
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {emailRecipientUsers.length === 0 && (
                                        <p className="text-muted small mb-0">No recipients selected.</p>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Subject</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Email subject"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control"
                                        rows={6}
                                        placeholder="Write your message..."
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEmailModalOpen(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleSendBulkEmail} disabled={emailSending || emailRecipientUsers.length === 0}>
                                    {emailSending ? "Sending…" : "Send"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;


