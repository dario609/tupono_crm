import React, { useEffect, useState } from "react";
import axios, { Axios } from "axios";
import Swal from "sweetalert2";
import AdminLayout from "../layouts/AdminLayout";
import { Modal, Button, Form } from "react-bootstrap";
import { RolesApi } from "../api/rolesApi";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/css/roles.css";

const RolesPermissions = () => {
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
  const [editRole, setEditRole] = useState({ id: "", name: "" });
  const [selectedRole, setSelectedRole] = useState(null);

  const [permissions, setPermissions] = useState([
    {
      level_name: "Roles & Permissions",
      input_name: "roles_permissions",
      value: ["is_view", "is_add", "is_edit", "is_delete"],
    },
    {
      level_name: "User Management",
      input_name: "user_management",
      value: ["is_view", "is_add", "is_edit", "is_delete"],
    },
    {
      level_name: "Project Management",
      input_name: "project_management",
      value: ["is_view", "is_add", "is_edit", "is_delete"],
    },
    {
      level_name: "Task Management",
      input_name: "task_management",
      value: ["is_view", "is_add", "is_edit", "is_delete"],
    },
    {
      level_name: "Calendar Management",
      input_name: "calendar_management",
      value: ["is_view"],
    },
    {
      level_name: "Document/File Management",
      input_name: "document_file_management",
      value: ["is_view", "is_add", "is_edit", "is_delete"],
    },
    {
      level_name: "Message/Support Management",
      input_name: "message_support_management",
      value: ["is_view", "is_add"],
    },
  ]);

  // Toggle single checkbox
  const togglePermission = (moduleIndex, perm) => {
    setPermissions((prev) => {
      const updated = [...prev];
      updated[moduleIndex][perm] = !updated[moduleIndex][perm];
      return updated;
    });
  };

  const toggleAllPermissions = (type) => {
    const permKey = `is_${type}`;
    const allChecked = permissions.every((m) => m.value.includes(permKey));
    setPermissions((prev) =>
      prev.map((m) => ({
        ...m,
        [permKey]: !allChecked && m.value.includes(permKey) ? true : false,
      }))
    );
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

  useEffect(() => {
    const loader = document.querySelector(".loader-overlay");
    if (!loader) return;

    loader.style.display = loading ? "flex" : "none";
  }, [loading]);

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      await RolesApi.createRole({ role_name: roleName });
      setRoleName("");
      setShowAdd(false);
      Swal.fire("Success", "Role created successfully", "success");
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to add role", "error");
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/roles/${editRole.id}`, { role_name: editRole.name });
      setShowEdit(false);
      Swal.fire("Updated!", "Role updated successfully", "success");
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", "Failed to update role", "error");
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

  const toggleStatus = async (role) => {
    const confirm = await Swal.fire({
      text: "Are you sure you want to change the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#3085d6", // Blue (default confirm)
      cancelButtonColor: "#d33",     // Red cancel
    });
    if (!confirm.isConfirmed) return;

    try {
      await RolesApi.manageRoleStatus({
        roleId: role._id,
      });
      fetchRoles();
    } catch (err) {
      Swal.fire("Error", "Failed to change status", "error");
    }
  };

  return (
    <AdminLayout>
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
                          <th style={{ width: "80px" }}>SN</th>
                          <th>Role</th>
                          <th style={{ width: "115px" }}>Module Permission</th>
                          <th style={{ width: "105px" }}>Status</th>
                          <th style={{ width: "140px" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center text-muted">
                              Loading...
                            </td>
                          </tr>
                        ) : roles.length === 0 ? (
                          <tr className="text-center">
                            <td colSpan="5">No Records found</td>
                          </tr>
                        ) : (
                          roles.map((item, index) => (
                            <tr key={item.id}>
                              <td>{(page - 1) * perPage + index + 1}</td>
                              <td>{item.role_name}</td>
                              <td>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setSelectedRole(item);
                                    setShowPermissions(true);
                                  }}
                                >
                                  Set Permissions
                                </button>
                              </td>

                              {/* Status Switch */}
                              <td>
                                <div className="custom-switch-wrapper">
                                  <input
                                    type="checkbox"
                                    id={`switch_status_${item._id}`}
                                    className="custom-switch-input"
                                    checked={item.status === 'active'}
                                    onChange={() => toggleStatus(item)}
                                  />
                                  <label
                                    htmlFor={`switch_status_${item._id}`}
                                    className="custom-switch-label"
                                  >
                                    <span className="switch-text on">Active</span>
                                    <span className="switch-text off">Inactive</span>
                                    <span className="switch-handle"></span>
                                  </label>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="text-center">
                                <button
                                  className="btn btn-success btn-sm btn-rounded me-2"
                                  title="Edit"
                                  onClick={() => {
                                    setEditRole({ id: item.id, name: item.role_name });
                                    setShowEdit(true);
                                  }}
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
                                  title="Delete"
                                  onClick={() => handleDelete(item._id)}
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
            <Form.Group controlId="roleName">
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
                  <label>Role Title</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={editRole.name}
                    onChange={(e) =>
                      setEditRole({ ...editRole, name: e.target.value })
                    }
                    maxLength={50}
                  />
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
                        {["view", "add", "edit", "delete"].map((type) => (
                          <th key={type} className="perm-col text-center">
                            <div className="permissions form-switch d-flex align-items-center justify-content-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`${type}_all`}
                                checked={permissions.every(
                                  (p) => p[type] || p.value?.includes(`is_${type}`)
                                )}
                                onChange={() => toggleAllPermissions(type)}
                              />
                              <label
                                style={{fontSize: '15px',marginTop: '3px'}}
                                htmlFor={`${type}_all`}
                                className="form-check-label ms-1 text-capitalize fw-semibold text-white"
                              >
                                {type}
                              </label>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {permissions.map((module, moduleIndex) => (
                        <tr key={module.input_name}>
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
                <button type="button" className="btn btn-primary btn-sm">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default RolesPermissions;
