import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ReportsApi from "../../api/reportsApi";

const ReportSendEmailPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await ReportsApi.getById(reportId);
        setReport(data);
        // Generate a preview (using your existing exportPDF API)
        const backendBase = process.env.REACT_APP_TUPONO_API_URL;
        const pdfUrl = `${backendBase}/admin/reports/${reportId}/export-pdf`;
        setPreviewUrl(pdfUrl);
      } catch {
        Swal.fire("Error", "Failed to load report preview", "error");
      }
    };
    fetchReport();
  }, [reportId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData((f) => ({ ...f, [name]: value }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!emailData.to) return Swal.fire("Error", "Recipient email required", "error");

    try {
      setSending(true);
      await ReportsApi.sendEmail({previewUrl,...emailData});
      Swal.fire("Success", "Report emailed successfully", "success").then(() =>
        navigate("/reports")
      );
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to send email", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card mt-4 p-4">
      <h5 className="fw-semibold mb-3">Send Report via Email</h5>
      <p className="text-muted mb-4">
        Report: <strong>{report?.project_title || "Loading..."}</strong>
      </p>

      <form onSubmit={handleSend}>
        <div className="row g-3">
          <div className="col-md-6">
            <label>Recipient Email *</label>
            <input
              type="email"
              name="to"
              value={emailData.to}
              onChange={handleChange}
              className="form-control"
              placeholder="recipient@example.com"
              required
            />
          </div>
          <div className="col-md-6">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={emailData.subject}
              onChange={handleChange}
              className="form-control"
              placeholder={`Report: ${report?.project_title || ""}`}
            />
          </div>
          <div className="col-12">
            <label>Message</label>
            <textarea
              name="message"
              value={emailData.message}
              onChange={handleChange}
              className="form-control"
              rows={5}
              placeholder="Write your message here..."
            ></textarea>
          </div>

          <div className="col-12 mt-3 d-flex align-items-center gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </form>

      {previewUrl && (
        <div className="mt-4">
          <h6>PDF Preview</h6>
          <iframe
            src={previewUrl}
            width="100%"
            height="600px"
            title="Report Preview"
            style={{ border: "1px solid #ddd", borderRadius: "8px" }}
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default ReportSendEmailPage;
