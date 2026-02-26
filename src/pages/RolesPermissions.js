import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Modal, Button, Form, Offcanvas } from "react-bootstrap";
import { RolesApi } from "../api/rolesApi";
import { basePermissionList, permissionsInputLabel } from "../constants";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/css/roles.css";
import { SkeletonTableRow } from "../components/common/SkelentonTableRow";
import { usePermissions } from "../hooks/usePermissions";

const RolesPermissions = () => {
  const { canEdit, canDelete } = usePermissions();
  const canEditRoles = canEdit(permissionsInputLabel.roles_permissions);
  const canDeleteRoles = canDelete(permissionsInputLabel.roles_permissions);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [editRole, setEditRole] = useState({ id: "", name: "", description: "" });
  const [selectedRole, setSelectedRole] = useState(null);

  const [permissions, setPermissions] = useState([]);

  // User list (offcanvas)
  const [showUserList, setShowUserList] = useState(false);
  const [userListRole, setUserListRole] = useState(null);
  const [userListData, setUserListData] = useState({ data: [], total: 0, page: 1, last_page: 1 });
  const [userListLoading, setUserListLoading] = useState(false);

  const handleSavePermissions = async () => {
    if (!selectedRole?._id) {
      Swal.fire("Error", "No role selected", "error");
      return;
    }

    try {
      setLoading(true);

      const payload = permissions.map((perm) => ({
        role_id: selectedRole._id,
        menu_name: perm.input_name,
        is_view: perm.is_view ? 1 : 0,
        is_add: perm.is_add ? 1 : 0,
        is_edit: perm.is_edit ? 1 : 0,
        is_delete: perm.is_delete ? 1 : 0,
      }));

      await RolesApi.savePermissions({
        roleId: selectedRole._id,
        permissions: payload,
      });

      Swal.fire("Success", "Permissions updated successfully!", "success");
      setShowPermissions(false);
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to update permissions",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (moduleIndex, perm) => {
    setPermissions((prev) => {
      return prev.map((module, index) =>
        index === moduleIndex
          ? { ...module, [perm]: !module[perm] }
          : module
      );
    });
  };


  const toggleAllPermissions = (type) => {
    const permKey = `is_${type}`;

    setPermissions((prev) => {
      const allChecked = prev.every(
        (m) => !m.value.includes(permKey) || m[permKey] === true
      );
      return prev.map((module) => {
        if (!module.value.includes(permKey)) return module;
        return {
          ...module,
          [permKey]: !allChecked,
        };
      });
    });
  };


  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await RolesApi.getRoles({ search: search || "", perpage: perPage, page });

      setRoles(res.data || []);
      setTotalPages(res.last_page || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [search, perPage, page]);


  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      await RolesApi.createRole({ role_name: roleName, description: roleDescription });
      setRoleName("");
      setRoleDescription("");
      setShowAdd(false);
      Swal.fire("Success", "Role created successfully", "success");
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message || "Failed to add role", "error");
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      await RolesApi.editRole({ roleId: editRole.id, role_name: editRole.name, description: editRole.description });
      setShowEdit(false);
      Swal.fire("Updated!", "Role updated successfully", "success");
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", "Failed to update role", "error");
    }
  };

  const openUserList = async (role) => {
    setUserListRole(role);
    setShowUserList(true);
    setUserListData({ data: [], total: 0, page: 1, last_page: 1 });
    loadUserList(role._id, 1);
  };

  const loadUserList = async (roleId, page = 1) => {
    setUserListLoading(true);
    try {
      const res = await RolesApi.getUsersByRole({ roleId, page, perpage: 15 });
      setUserListData({
        data: res.data || [],
        total: res.total || 0,
        page: res.page || 1,
        last_page: res.last_page || 1,
      });
    } catch {
      setUserListData({ data: [], total: 0, page: 1, last_page: 1 });
    } finally {
      setUserListLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this role? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      await RolesApi.deleteRole({ roleId: id });
      Swal.fire("Deleted!", "The role has been deleted.", "success");
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", "Failed to delete role", "error");
    }
  };

  const handleOpenPermissions = async (role) => {
    setSelectedRole(role);
    setShowPermissions(true);

    try {
      setLoading(true)
      const res = await RolesApi.getPermissions({ roleId: role._id })
      if (res.data?.length) {
        const loadedPerms = basePermissionList.map(module => {
          const dbPerm = res.data.find(p => p.menu_name === module.input_name)
          return {
            ...module,
            is_view: dbPerm?.is_view === true,
            is_add: dbPerm?.is_add === true,
            is_edit: dbPerm?.is_edit === true,
            is_delete: dbPerm?.is_delete === true,
          }
        })

        setPermissions(loadedPerms);
      }
      else {
        const resetPerms = basePermissionList.map(m => ({
          ...m,
          is_view: false,
          is_add: false,
          is_edit: false,
          is_delete: false,
        }));
        setPermissions(resetPerms)
      }
    }
    catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load permissions", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-2">Roles &amp; Permission</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <button
              type="button"
              className="btn btn-primary btn-rounded btn-fw inner-pages-button"
              onClick={() => setShowAdd(true)}
            >
              <i className="menu-icon mdi mdi-plus-circle"></i> Add Role
            </button>

          </li>
        </ul>
      </div>

      <section className="card mt-2">
        <div className="row card-body pt-0">
          <div className="col-12 p-0">
            <div className="box">
              <div className="box-body p-15 pt-0">
                <div id="DataTables_Table_0_wrapper" className="dataTables_wrapper6 dt-bootstrap4 no-footer">

                  <div className="row mb-0 p-2">
                    <div className="col-md-6 col-lg-8 mt-1">
                      <div className="dataTables_length d-flex align-items-center">
                        <label className="mb-0 me-2" htmlFor="perpage">
                          Show
                        </label>
                        <select
                          className="form-select form-select-sm w-auto me-2"
                          value={perPage}
                          onChange={(e) => setPerPage(e.target.value)}
                        >
                          <option value="-1">All</option>
                          <option value="10">10</option>
                          <option value="20">20</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                        <span>entries</span>
                      </div>
                    </div>

                    <div className="col-md-6 col-lg-4">
                      <div className="input-group mb-0 mt-1">
                        <input
                          type="text"
                          placeholder="Search"
                          className="form-control"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && fetchRoles()}
                        />
                        {search && (
                          <span
                            id="clearSearch"
                            className="fa fa-times text-danger"
                            style={{
                              cursor: "pointer",
                              fontSize: "21px",
                              margin: "7px 7px 0px -25px",
                            }}
                            onClick={() => setSearch("")}
                          ></span>
                        )}
                        <button className="btn btn-success btn-sm" onClick={fetchRoles}>
                          <i className="fa fa-search" style={{ fontSize: "large" }}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive roles-table-wrapper">
                    <table className="table table-striped table-bordered table-responsive">
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>SN</th>
                          <th>Role</th>
                          <th>Description</th>
                          <th style={{ width: "120px" }}>User List</th>
                          <th style={{ width: "115px" }}>Module Permission</th>
                          <th style={{ width: "140px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <SkeletonTableRow rows={10} cols={5} />
                        ) : roles.length === 0 ? (
                          <tr className="text-center">
                            <td colSpan="6">No Records found</td>
                          </tr>
                        ) : (
                          roles.map((item, index) => (
                            <tr key={item._id || item.id}>
                              <td>{(page - 1) * perPage + index + 1}</td>
                              <td>{item.role_name}</td>
                              <td className="text-muted small" style={{ maxWidth: 200 }} title={item.description || "-"}>
                                {(item.description || "-").slice(0, 50)}{(item.description || "").length > 50 ? "…" : ""}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm d-flex align-items-center gap-1"
                                  onClick={() => openUserList(item)}
                                  title="View users in this role"
                                >
                                  <i className="mdi mdi-account-group" style={{ fontSize: 18 }}></i>
                                  <span>{item.userCount ?? 0} users</span>
                                </button>
                              </td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenPermissions(item)}
                                >
                                  Set Permissions
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="text-center">
                                <button
                                  className="btn btn-success btn-sm btn-rounded me-2"
                                  title={canEditRoles ? "Edit" : "Edit (no permission)"}
                                  onClick={() => canEditRoles && (setEditRole({ id: item._id, name: item.role_name, description: item.description || "" }), setShowEdit(true))}
                                  disabled={!canEditRoles}
                                  style={!canEditRoles ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="feather feather-edit-2"
                                  >
                                    <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                                  </svg>
                                </button>

                                <button
                                  className="btn btn-danger btn-sm btn-rounded"
                                  title={canDeleteRoles ? "Delete" : "Delete (no permission)"}
                                  onClick={() => canDeleteRoles && handleDelete(item._id)}
                                  disabled={!canDeleteRoles}
                                  style={!canDeleteRoles ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="feather feather-trash"
                                  >
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* {roles.length > 0 && ( */}
                  <div className="row">
                    <div className="col-sm-12 col-md-5">
                      <div className="dataTables_info" id="DataTables_Table_0_info" role="status">
                        <p>Showing {(page - 1) * perPage + 1} to{" "}
                          {(page - 1) * perPage + roles.length} of{" "}
                          {roles.length} entries</p>
                      </div>
                    </div>
                    <div className="col-sm-12 col-md-7">
                      <div
                        className="dataTables_paginate paging_simple_numbers"
                        id="DataTables_Table_0_paginate"
                      >
                        <nav aria-label="Page navigation example">
                          <ul className="pagination justify-content-end">
                            {/* Previous button */}
                            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => page > 1 && setPage(page - 1)}
                                aria-label="Previous"
                              >
                                <i className="fa fa-angle-left left-left-ang" aria-hidden="true"></i>
                              </button>
                            </li>

                            {/* Dynamic page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <li
                                key={pageNum}
                                className={`page-item ${pageNum === page ? "active" : ""}`}
                              >
                                <button
                                  className="page-link popto"
                                  onClick={() => setPage(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            ))}

                            {/* Next button */}
                            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                              <button
                                className="page-link"
                                onClick={() => page < totalPages && setPage(page + 1)}
                                aria-label="Next"
                              >
                                <i className="fa fa-angle-right left-left-ang" aria-hidden="true"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>

                  </div>
                  {/* )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Add Role Modal ========== */}
      <Modal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        centered
        backdrop={true}
        keyboard={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create Role</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddRole}>
          <Modal.Body>
            <Form.Group controlId="roleName" className="mb-3">
              <Form.Label>Role Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Role Title"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                maxLength={50}
              />
            </Form.Group>
            <Form.Group controlId="roleDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Optional description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="text-center justify-content-center">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>



      {/* ========== Edit Role Modal ========== */}
      {showEdit && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Update Role</h5>
                <button className="btn-close" onClick={() => setShowEdit(false)}></button>
              </div>
              <form onSubmit={handleEditRole}>
                <div className="modal-body pt-2">
                  <div className="mb-3">
                    <label>Role Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={editRole.name}
                      onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional description"
                      value={editRole.description || ""}
                      onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer text-center justify-content-center">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========== Permissions Modal ========== */}
      {showPermissions && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h5>
                  Module Permissions (
                  <span className="text-primary">{selectedRole.role_name}</span>)
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPermissions(false)}
                ></button>
              </div>
              <div className="modal-body pt-2">
                <div className="table-responsive permissions-table-wrapper">
                  <table className="table table-striped table-bordered align-middle mb-0 permissions-table">
                    <thead>
                      <tr>
                        <th className="module-col">Module Name</th>
                        {["view", "add", "edit", "delete"].map((type) => {
                          const permKey = `is_${type}`;

                          return (
                            <th key={type} className="perm-col text-center">
                              <div className="permissions form-switch d-flex align-items-center justify-content-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`${type}_all`}
                                  checked={permissions.every(
                                    (p) => !p.value?.includes(permKey) || p[permKey] === true
                                  )}
                                  onChange={() => toggleAllPermissions(type)}
                                />
                                <label
                                  style={{ fontSize: "15px", marginTop: "3px" }}
                                  htmlFor={`${type}_all`}
                                  className="form-check-label ms-1 text-capitalize fw-semibold text-white"
                                >
                                  {type}
                                </label>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {permissions.map((module, moduleIndex) => (
                        <tr key={moduleIndex}>
                          <td className="text-nowrap fw-semibold">{module.level_name}</td>
                          {["is_view", "is_add", "is_edit", "is_delete"].map((perm) => {
                            const isAvailable = module.value.includes(perm);
                            const checked = !!module[perm];
                            const uniqueId = `${module.input_name}_${perm}`;

                            return (
                              <td key={perm} className="text-center align-middle">
                                {isAvailable ? (
                                  <div className="form-switch permissions d-flex align-items-center justify-content-center">
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      id={uniqueId}
                                      checked={checked}
                                      onChange={() => togglePermission(moduleIndex, perm)}
                                    />
                                    <label htmlFor={uniqueId} className="form-check-label"></label>
                                  </div>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer text-center justify-content-center">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowPermissions(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSavePermissions}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User List Offcanvas */}
      <Offcanvas
        show={showUserList}
        onHide={() => setShowUserList(false)}
        placement="end"
        style={{ maxWidth: 400 }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Users in <span className="text-primary">{userListRole?.role_name || "Role"}</span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {userListLoading && userListData.data.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 mb-0">Loading users…</p>
            </div>
          ) : userListData.total === 0 ? (
            <p className="text-muted mb-0">No users assigned to this role.</p>
          ) : (
            <>
              <div className="border rounded" style={{ maxHeight: 360, overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userListData.data.map((u) => (
                      <tr key={u._id}>
                        <td>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "-"}</td>
                        <td className="small text-muted">{u.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {userListData.last_page > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <span className="small text-muted">
                    {userListData.data.length} of {userListData.total} users
                  </span>
                  <div>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={userListData.page <= 1}
                      onClick={() => loadUserList(userListRole?._id, userListData.page - 1)}
                    >
                      Prev
                    </Button>
                    <span className="mx-2 small">
                      {userListData.page} / {userListData.last_page}
                    </span>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      disabled={userListData.page >= userListData.last_page}
                      onClick={() => loadUserList(userListRole?._id, userListData.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default RolesPermissions;
