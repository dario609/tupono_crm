export default function UpdateEngageBtn({ saving, handleSave }) {
    return (
        <button
            className="btn btn-primary btn-rounded mt-2"
            disabled={saving}
            onClick={handleSave}
        >
            {saving ? "Saving..." : "Update Engagement"}
        </button>
    );
}