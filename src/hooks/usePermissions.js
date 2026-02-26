import { useOutletContext } from "react-router-dom";
import { permissionsInputLabel, rolesLabel } from "../constants";

/**
 * Hook to get permission helpers for the current route.
 * Requires AdminLayout to pass { permissions, user } via Outlet context.
 * @returns {{ canView, canAdd, canEdit, canDelete, isSuperAdmin, permissions, user }}
 */
export function usePermissions() {
  const ctx = useOutletContext() || {};
  const { permissions = {}, user } = ctx;
  const isSuperAdmin = user?.role_id?.role_name === rolesLabel.superAdmin;
  const roleName = user?.role_id?.role_name || "";
  const canGiveAccess = isSuperAdmin || ["Hapu", "Hapū", "Hapu Manager"].includes(roleName);

  const canView = (key) => isSuperAdmin || permissions?.[key]?.is_view === 1;
  const canAdd = (key) => isSuperAdmin || permissions?.[key]?.is_add === 1;
  const canEdit = (key) => isSuperAdmin || permissions?.[key]?.is_edit === 1;
  const canDelete = (key) => isSuperAdmin || permissions?.[key]?.is_delete === 1;

  return {
    permissions,
    user,
    isSuperAdmin,
    canGiveAccess,
    canView,
    canAdd,
    canEdit,
    canDelete,
    permissionsInputLabel,
  };
}
