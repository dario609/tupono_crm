export default function ProjectsControl({ perpage, setPerpage, search, setSearch, onSearchKeyDown, load }) {
    const handlePerpageChange = (e) => {
        const v = parseInt(e.target.value, 10);
        setPerpage(v);
        load({ perpage: v, page: 1 });
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        load({ search: e.target.value, page: 1 });
    };

    const handleSearchClick = () => {
        load({ search: search, page: 1 });
    };

    return (
        <div className="d-flex align-items-center justify-content-between p-2">
            <div className="d-flex align-items-center">
                <label className="mb-0 me-2" htmlFor="perpage">Show</label>
                <select
                    id="perpage"
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

            <div className="input-group" style={{ maxWidth: 360 }}>
                <input type="text"
                    placeholder="Search"
                    className="form-control"
                    value={search}
                    onChange={handleSearchChange}
                    onKeyDown={onSearchKeyDown} />
                <button
                    className="btn btn.success btn-sm"
                    onClick={handleSearchClick}
                >
                    <i className="fa fa-search" style={{ fontSize: "large" }}></i>
                </button>
            </div>
        </div>
    );
};
