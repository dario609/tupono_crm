import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RolesApi from "../../api/rolesApi";
import { useNotifications } from "../../context/NotificationProvider";
import { useCreateUserForm } from "../../hooks/users/useCreateUserForm";
import ProjectsApi from "../../api/projectsApi";

import { UserBasicFields } from "../../components/users/UserBasicForm";
import { UserPasswordFields } from "../../components/users/UserPasswordFields";
import { UserContactFields } from "../../components/users/UserContactFields";
import { UserProfileImage } from "../../components/users/UserProfileImage";
import { UserRoleField } from "../../components/users/UserRoleField";
import { UserProjectField } from "../../components/users/UserProjectField";
import { UserKaupapaFields } from "../../components/users/UserKaupapaFields";
import HapuListsApi from "../../api/hapulistsApi";

const CreateUser = () => {
  const navigate = useNavigate();
  const { pushNotification } = useNotifications();

  const {
    form,
    onChange,
    onSubmit,
    canSubmit,
    loading,
    error,
    success,
    confirmRef,
    emailUserNow,
    setEmailUserNow,
    profileImage,
    setProfileImage,
  } = useCreateUserForm({ pushNotification });

  const [roles, setRoles] = useState([]);
  const [hapus, setHapus] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    RolesApi.list({ perpage: -1 }).then((json) => {
      setRoles(json?.data || []);
    });
    HapuListsApi.list({ perpage: -1 }).then((json) => {
      setHapus(json?.data || []);
    }).catch(() => {
      setHapus([]);
    });
    ProjectsApi.list({ perpage: -1 }).then((json) => {
      setProjects(json?.data || []);
    }).catch(() => {
      setProjects([]);
    });
  }, []);

  const handleAddHapu = async (name) => {
    if (!name) return;
    try {
      await HapuListsApi.create({ name });
      const json = await HapuListsApi.list({ perpage: -1 });
      setHapus(json?.data || []);
    } catch (err) {
      console.error("Failed to create hapu:", err);
    }

    // set selected hapu on form
    onChange({ target: { name: "hapu", value: String(name) } });
  };

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">
        <h6 className="fw-semibold mb-0 mt-3">Add User</h6>
        <ul className="d-flex align-items-center mt-3 mb-1">
          <li className="fw-medium">
            <Link to="/users" className="btn btn-primary btn-rounded btn-fw inner-pages-button">
              <i className="ti ti-arrow-circle-left ms-1"></i> Back
            </Link>
          </li>
        </ul>
      </div>

      <section className="card mt-3">
        <div className="card-body">
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={(e) => onSubmit(e, navigate)} noValidate>
            <div className="row">
              <UserBasicFields form={form} onChange={onChange} />
              <UserPasswordFields form={form} onChange={onChange} confirmRef={confirmRef} />
              <UserContactFields form={form} onChange={onChange} />
              <UserProfileImage profileImage={profileImage} setProfileImage={setProfileImage} />
              <UserRoleField roles={roles} form={form} onChange={onChange} />
              <UserProjectField projects={projects} form={form} onChange={onChange} />
              <UserKaupapaFields form={form} onChange={onChange} hapus={hapus} onAdd={handleAddHapu} />
            </div>

            <div className="form-check mt-3">
              <input
                type="checkbox"
                checked={emailUserNow}
                className="form-check-input"
                style={{marginLeft: '4px',marginRight: '4px'}}
                onChange={(e) => setEmailUserNow(e.target.checked)}
              />
              <label className="form-check-label ms-2 ml-5" style={{padding: '6px 5px'}}>Send email now</label>
            </div>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-danger me-2"
                onClick={() => navigate("/users")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!canSubmit || loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default CreateUser;
