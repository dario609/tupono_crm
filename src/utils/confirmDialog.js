import Swal from "sweetalert2";

export const confirmDialog = async ({
  title = "Are you sure?",
  text = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: type,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};
