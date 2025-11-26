import React from "react";

export default function EngagementControls({
    perpage,
    setPerpage,
    search,
    setSearch,
    onSearchKeyDown,
    load,
    handlePerpageChange
}) {
    return (
        <div className="d-flex align-items-center justify-content-between p-2">

            {/* Per Page Selector */}
            <div className="d-flex align-items-center">
                <label className="mb-0 me-2">Show</label>

                <select
                    className="form-control w-auto me-2"
                    value={perpage}
                    onChange={handlePerpageChange}
                >
                    <option value={-1}>All</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>

                <span>entries</span>
            </div>

            {/* Search */}
            <div className="input-group" style={{ maxWidth: 360 }}>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                />
                <button className="btn btn-success btn-sm" onClick={() => load({ page: 1 })}>
                    <i className="fa fa-search"></i>
                </button>
            </div>

        </div>
    );
}
