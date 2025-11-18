import Swal from "sweetalert2"
export default  deleteEngagementModal = async (id) => {
    return await Swal.fire({
        title: "Delete Engagement?",
        text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel"
    });
}