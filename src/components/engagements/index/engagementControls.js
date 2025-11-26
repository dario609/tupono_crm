import React from "react";

export default function EngagementControls({
    perpage,
    setPerpage,
    search,
    setSearch,
    onSearchKeyDown,
    load,
    handlePerpageChange,
    dateFilter,
    setDateFilter
}) {
    const handleDateFilterChange = (e) => {
        const value = e.target.value;
        setDateFilter(value);
        load({ page: 1, dateFilter: value });
    };

    return (
        <div className="d-flex align-items-center justify-content-between p-2 flex-wrap gap-2">

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

            {/* Date Filter */}
            <div className="d-flex gap-2">
            <div className="d-flex align-items-center">
                <label className="mb-0 me-2">Filter:</label>
                <select
                    className="form-control w-auto"
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                    style={{ minWidth: 150 }}
                >
                    <option value="">All Dates</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="lastYear">Last Year</option>
                </select>
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

        </div>
    );
}
