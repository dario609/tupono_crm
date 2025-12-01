export const Pagination = ({
    page,
    lastPage,
    pages,
    onPageChange,
  }) => {
    return (
      <nav aria-label="Pagination">
        <ul className="pagination justify-content-end">
  
          <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => page > 1 && onPageChange(page - 1)}>
              <i className="fa fa-angle-left"></i>
            </button>
          </li>
  
          {pages.map((p, i) => (
            <li
              key={i}
              className={`page-item ${p === page ? "active" : ""} ${p === "..." ? "disabled" : ""}`}
            >
              {p === "..."
                ? <span className="page-link">…</span>
                : <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>}
            </li>
          ))}
  
          <li className={`page-item ${page >= lastPage ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => page < lastPage && onPageChange(page + 1)}>
              <i className="fa fa-angle-right"></i>
            </button>
          </li>
  
        </ul>
      </nav>
    );
  };
  