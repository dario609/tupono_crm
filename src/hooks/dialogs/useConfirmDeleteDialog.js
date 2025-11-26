import Swal from "sweetalert2";

export function useConfirmDelete() {
    const confirmDeleteDialog = async ({
        title = "Delete?",
        text = "This action cannot be undone.",
    }) => {
        return Swal.fire({
            title,
            text,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel"
        });
    };

    const DeleteSuccess = (text) =>
        Swal.fire({
            title: "Successfully Deleted",
            text,
            icon: "success",
            timer: 1200,
            showConfirmButton: false,
        });

    const DeleteError = (text) =>
        Swal.fire({
            title: "Error Happened While Deleting",
            text,
            icon: "error",
        });

    return { confirmDeleteDialog, DeleteSuccess, DeleteError };
}
