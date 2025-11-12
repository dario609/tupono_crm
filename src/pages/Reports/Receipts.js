import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { NavLink, useParams } from "react-router-dom";
import ReportsApi from "../../api/reportsApi";

const initialFormData = {
    receipt_date: "",
    supplier_name: "",
    reason: "",
    amount: "",
    amount_gst: "",
    total: "",
    images: [],
};


const BASE_URL = process.env.REACT_APP_TUPONO_API_URL || "http://localhost:5000";

const ReportReceiptsPage = () => {
    const { reportId } = useParams();
    const [report, setReport] = useState({});
    const [editReceiptId, setEditReceiptId] = useState(null);
    const [form, setForm] = useState(initialFormData);
    const [rows, setRows] = useState([]);
    const [perpage, setPerpage] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [modalImage, setModalImage] = useState(null);
    const loadingRef = useRef(false);

    /** Load receipts list */
    const loadReceipts = async (opts = {}, showLoader = true) => {
        if (loadingRef.current) return; // prevent overlapping requests
        loadingRef.current = true;

        try {
            if (showLoader) setLoading(true);
            const res = await ReportsApi.receipts(reportId, {
                page: opts.page ?? page,
                perpage: opts.perpage ?? perpage,
                search: opts.search ?? search,
            });
            setRows(res.data || []);
            setTotalRecords(res.total || 0);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load receipts", "error");
        } finally {
            loadingRef.current = false;
            if (showLoader) {
                // slight delay for smoother UX
                setTimeout(() => setLoading(false), 250);
            }
        }
    };

    /** Load Report info + first page */
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const reportRes = await ReportsApi.getById(reportId);
                if (mounted) setReport(reportRes.data);
                await loadReceipts({ page: 1 }, false); // no double loading effect
            } catch (err) {
                console.error(err);
                Swal.fire("Error", "Failed to load data", "error");
            } finally {
                if (mounted) setTimeout(() => setLoading(false), 300);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [reportId]);

    /** Handle form input change */
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setForm({ ...form, images: files });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    /** Handle receipt edit */
    const handleReceiptEdit = (r) => {
        setEditReceiptId(r._id);
        setForm({
            ...form,
            ...r,
            receipt_date: new Date(r.receipt_date).toISOString().slice(0, 10),
        });
    };
    /** Auto calculate GST */
    useEffect(() => {
        const total = parseFloat(form.total) || 0;
        const gst = (total * 3) / 23;
        const amount = total - gst;
        setForm((f) => ({
            ...f,
            amount_gst: gst ? gst.toFixed(2) : "",
            amount: amount ? amount.toFixed(2) : "",
        }));
    }, [form.total]);

    /** Submit receipt */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                if (key === "images" && val?.length) {
                    for (let img of val) fd.append("images[]", img);
                } else {
                    fd.append(key, val ?? "");
                }
            });
            fd.append("report_id", reportId);

            if (editReceiptId) {
                // Update mode
                await ReportsApi.updateReceipt(editReceiptId, fd);
                Swal.fire("Updated!", "Receipt updated successfully", "success");
            } else {
                // Create mode
                await ReportsApi.createReceipt(fd);
                Swal.fire("Success", "Receipt added successfully", "success");
            }

            await loadReceipts({}, false); // refresh without flicker
        } catch (err) {
            Swal.fire(
                "Error",
                err.response?.data?.message || "Failed to save receipt",
                "error"
            );
        }
    };

    /** Delete a record */
    const deleteRecord = async (r) => {
        setEditReceiptId(r._id);
        setForm({
            ...form,
            ...r,
            receipt_date: new Date(r.receipt_date).toISOString().slice(0, 10),
        });
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the receipt.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        });
        if (!confirm.isConfirmed) return;

        try {
            await ReportsApi.deleteReceipt(r._id);
            setEditReceiptId(null);
            setForm(initialFormData);
            Swal.fire("Deleted!", "Receipt deleted successfully", "success");
            await loadReceipts();
        } catch (err) {
            Swal.fire("Error", "Failed to delete receipt", "error");
        }
    };

    /** Delete image */
    const deleteImage = async (id, imageName) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "Delete this image?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });
        if (!confirm.isConfirmed) return;
        try {
            await axios.post(`/api/report-receipts/${id}/delete-image`, { image: imageName });
            Swal.fire("Deleted!", "Image deleted successfully", "success");
            await loadReceipts();
        } catch (err) {
            Swal.fire("Error", "Unable to delete image", "error");
        }
    };

    /** Image modal open / close */
    const openImageModal = (src) => setModalImage(src);
    const closeImageModal = () => setModalImage(null);

    return (
        <div className="card mt-3">
            <style>{`
        .receipt-thumb {
          width: 70px; height: 70px; object-fit: cover; cursor: pointer;
          border-radius: 6px; border: 1px solid #ddd; margin: 2px;
        }
        .image-modal {
          position: fixed; top:0; left:0; right:0; bottom:0;
          background: rgba(0,0,0,0.9);
          z-index:9999; display:flex; align-items:center; justify-content:center;
        }
        .image-modal img { max-width:90%; max-height:80%; border-radius:6px; }
        .image-modal-close {
          position:absolute; top:20px; right:35px;
          font-size:40px; color:#fff; cursor:pointer;
        }
          
      `}</style>

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 p-3">
                <h6 className="fw-semibold mb-0">Receipts ({report.project_title || ""})</h6>
                <NavLink to="/reports" className="btn btn-primary btn-rounded btn-fw">
                    <i className="ti ti-arrow-circle-left ms-1"></i> Back
                </NavLink>
            </div>

            <div className="card-body">
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="row g-2">
                        <div className="col-lg-3">
                            <label>Date <span className="text-danger">*</span></label>
                            <input
                                type="date"
                                className="form-control"
                                name="receipt_date"
                                value={form.receipt_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-lg-3">
                            <label>Supplier <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                name="supplier_name"
                                value={form.supplier_name}
                                onChange={handleChange}
                                placeholder="Supplier"
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="col-lg-6">
                            <label>Reason</label>
                            <input
                                type="text"
                                name="reason"
                                value={form.reason}
                                onChange={handleChange}
                                placeholder="Reason"
                                className="form-control"
                            />
                        </div>

                        <div className="col-lg-3">
                            <label>Total Amount ($) <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                name="total"
                                step="0.01"
                                min="0"
                                value={form.total}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Enter Total Amount"
                                required
                            />
                        </div>

                        <div className="col-lg-3">
                            <label>GST Amount ($)</label>
                            <input
                                type="number"
                                readOnly
                                name="amount_gst"
                                value={form.amount_gst}
                                className="form-control"
                                placeholder="Auto Calculated"
                            />
                        </div>

                        <div className="col-lg-3">
                            <label>Amount (Excl. GST) ($)</label>
                            <input
                                type="number"
                                readOnly
                                name="amount"
                                value={form.amount}
                                className="form-control"
                                placeholder="Auto Calculated"
                            />
                        </div>

                        <div className="col-lg-3">
                            <label>Receipt Files</label>
                            <input
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                className="form-control"
                                name="images"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-12 text-center mt-3">
                            <button type="reset" className="btn btn-success btn-rounded btn-fw me-2" onClick={() => setForm(initialFormData)}>
                                Reset
                            </button>
                            {
                                editReceiptId && (
                                    <button type="button" className="btn btn-danger btn-rounded btn-fw me-2" onClick={() => { setEditReceiptId(null); setForm(initialFormData) }}>
                                        Cancel
                                    </button>
                                )
                            }
                            <button type="submit" className="btn btn-primary btn-rounded btn-fw">
                                {editReceiptId ? "Update Receipt" : "Add Receipt"}
                            </button>

                        </div>
                    </div>
                </form>

                <hr />

                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>SN</th>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Amount</th>
                                <th>GST Amount</th>
                                <th>Total Amount</th>
                                <th>Reason</th>
                                <th>Receipt Images</th>
                                <th className="text-center" style={{ width: 180 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="text-center py-4">Loading...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan="9" className="text-center py-4">No records found</td></tr>
                            ) : (
                                rows.map((r, i) => {
                                    const isEditing = editReceiptId === r._id;
                                    return (
                                        <tr key={r._id} className={isEditing ? "table-primary position-relative" : ""}
                                            style={isEditing ? { transition: "background 0.3s ease" } : {}}>
                                            <td>{(page - 1) * perpage + i + 1}</td>
                                            <td>{new Date(r.receipt_date).toLocaleDateString("en-GB")}</td>
                                            <td>{r.supplier_name}</td>
                                            <td>${parseFloat(r.amount).toFixed(2)}</td>
                                            <td>${parseFloat(r.amount_gst).toFixed(2)}</td>
                                            <td>${parseFloat(r.total).toFixed(2)}</td>
                                            <td>{r.reason || "-"}</td>
                                            <td>
                                                {r.images?.length ? (
                                                    r.images.map((img) => (
                                                        <div key={img} style={{ position: "relative", display: "inline-block" }}>
                                                            <img
                                                                src={`${BASE_URL.replace(/\/api$/, "")}/uploads/receipts/${img}`}
                                                                className="receipt-thumb"
                                                                onClick={() => openImageModal(`${BASE_URL.replace(/\/api$/, "")}/uploads/receipts/${img}`)}
                                                                alt="receipt"
                                                            />
                                                            <span
                                                                onClick={() => deleteImage(r.id, img)}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: 0,
                                                                    right: 0,
                                                                    background: "rgba(238, 5, 5, 0.9)",
                                                                    color: "#fff",
                                                                    borderRadius: "50%",
                                                                    padding: "2px 6px",
                                                                    cursor: "pointer",
                                                                    fontSize: 14,
                                                                }}
                                                            >
                                                                &times;
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="text-center p-1">
                                                <button
                                                    className="btn badge-primary btn-sm btn-rounded me-1"
                                                    style={{padding: '10px 5px', borderRadius: '8px'}}
                                                    title="Edit"
                                                    onClick={() => handleReceiptEdit(r)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn badge-danger btn-sm btn-rounded"
                                                    style={{padding: '10px 5px', borderRadius: '8px'}}
                                                    title="Delete"
                                                    onClick={() => deleteRecord(r)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4 a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image modal */}
            {modalImage && (
                <div className="image-modal" onClick={closeImageModal}>
                    <span className="image-modal-close" onClick={closeImageModal}>
                        &times;
                    </span>
                    <img src={modalImage} alt="Receipt" />
                    <a
                        href={modalImage}
                        download
                        style={{
                            color: "#fff",
                            position: "absolute",
                            bottom: 20,
                            right: 20,
                            padding: "5px 10px",
                            background: "#007bff",
                            borderRadius: 4,
                            textDecoration: "none",
                        }}
                    >
                        Download
                    </a>
                </div>
            )}
        </div>
    );
};

export default ReportReceiptsPage;
