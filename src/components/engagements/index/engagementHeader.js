import { NavLink } from "react-router-dom";

export default function EngagementHeader() {
    return (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24 p-3">
            <h6 className="fw-semibold mb-0" style={{ fontSize: "20px" }}>
                Engagements Tracker
            </h6>

            <NavLink to="/engagement-tracker/create" className="btn btn-primary btn-rounded btn-fw">
                <i className="mdi mdi-plus-circle-outline"></i> Add Engagement
            </NavLink>
        </div>
    );
}