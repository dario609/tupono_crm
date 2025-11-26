import React from "react";

export default function EngagementPagination({
    page,
    lastPage,
    pagesToShow,
    load,
    total,
    showingStart,
    showingEnd
}) {
    return (
        <div className="row p-2">
            <div className="col-sm-12 col-md-5">
                <p style={{ fontSize: "16px" }}>
                    Showing {showingStart} to {showingEnd} of {total} entries
                </p>
            </div>

            <div className="col-sm-12 col-md-7">
                <nav>
                    <ul className="pagination justify-content-end">

                        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => page > 1 && load({ page: page - 1 })}
                            >
                                <i className="fa fa-angle-left"></i>
                            </button>
                        </li>

                        {pagesToShow.map((pg, i) => (
                            <li key={i}
                                className={`page-item ${pg === page ? "active" : ""} ${pg === "..." ? "disabled" : ""}`}
                            >
                                {pg === "..." ? (
                                    <span className="page-link">…</span>
                                ) : (
                                    <button
                                        className="page-link"
                                        disabled={pg === page}
                                        onClick={() => load({ page: pg })}
                                    >
                                        {pg}
                                    </button>
                                )}
                            </li>
                        ))}

                        <li className={`page-item ${page >= lastPage ? "disabled" : ""}`}>
                            <button
                                className="page-link"
                                onClick={() => page < lastPage && load({ page: page + 1 })}
                            >
                                <i className="fa fa-angle-right"></i>
                            </button>
                        </li>

                    </ul>
                </nav>
            </div>
        </div>
    );
}
