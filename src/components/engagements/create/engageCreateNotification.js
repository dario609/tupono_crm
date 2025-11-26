export default function EngageCreateNotification({ success }) {
    return (
        success && (
            <div className="alert alert-success fade show mt-3">
                <ul style={{ listStyle: "none", marginBottom: 0 }}>
                    <li>{success}</li>
                </ul>
            </div>
        )
    )
}