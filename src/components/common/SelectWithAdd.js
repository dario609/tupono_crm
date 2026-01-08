import { useEffect, useRef, useState } from "react";

export default function SelectWithAdd({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  onAdd,
  error = false,
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [newItem, setNewItem] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const computeOpenDirection = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const needed = 300; // dropdown approx height
    // open up when there is more space above than below and below is insufficient
    setOpenUp(spaceBelow < needed && spaceAbove > spaceBelow);
  };

  const filtered = options.filter((o) =>
    String(o.label || o.value).toLowerCase().includes(filter.toLowerCase())
  );

  function handleSelect(opt) {
    if (onChange) onChange({ target: { name, value: opt.value } });
    setOpen(false);
  }

  async function handleAdd() {
    const trimmed = (newItem || "").trim();
    if (!trimmed) return;
    if (onAdd) await onAdd(trimmed);
    if (onChange) onChange({ target: { name, value: trimmed } });
    setNewItem("");
    setFilter("");
    setOpen(false);
  }

  return (
    <div className="position-relative" ref={containerRef}>
      <input type="hidden" name={name} value={value || ""} />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.15)",
            zIndex: 1040,
          }}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => {
          const willOpen = !open;
          if (willOpen) computeOpenDirection();
          setOpen(willOpen);
        }}
        className={`btn btn-white dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center ${error ? "border-danger" : "border"}`}
        aria-expanded={open}
      >
        <span className={`${!value ? "text-muted" : "text-body"}`}>
          {value || placeholder}
        </span>
        
      </button>

      {open && (
        <div
          className="dropdown-menu show w-100 p-2"
          style={{
            maxHeight: 280,
            overflow: "auto",
            position: "absolute",
            left: 0,
            right: 0,
            ...(openUp ? { bottom: "calc(100% + 8px)", top: "auto" } : { top: "calc(100% + 8px)", bottom: "auto" }),
            zIndex: 1050,
          }}
        >
          <div className="mb-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              className="form-control"
            />
          </div>

          <div className="list-group">
            {filtered.length === 0 && (
              <div className="list-group-item text-muted">No results</div>
            )}

            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o)}
                className={`list-group-item list-group-item-action text-start ${String(o.value) === String(value) ? "active" : ""}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-top d-flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={`Enter ${placeholder} name...`}
              className="form-control"
            />
            <button type="button" onClick={handleAdd} className="btn btn-success">
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
