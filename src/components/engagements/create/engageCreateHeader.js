export default function EngageCreateHeader({ title }) {
    return (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">

            <h6 className="fw-semibold mb-0" style={{ fontSize: "20px" }}>
                {title}
            </h6>
        </div>
    )
}