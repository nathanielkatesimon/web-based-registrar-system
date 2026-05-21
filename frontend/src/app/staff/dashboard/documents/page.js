"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import ShowAlert from "@/lib/show-alert";

function formatPrice(cents) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(cents / 100);
}

const EMPTY_FORM = { name: "", price: "" };

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  async function loadDocumentTypes() {
    try {
      setLoading(true);
      setError("");
      const res = await api("/api/v1/document_types");
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "Failed to load document types.");
      setDocumentTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load document types.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(docType) {
    setEditTarget(docType);
    setForm({ name: docType.name || "", price: docType.price_cents != null ? (docType.price_cents / 100).toFixed(2) : "" });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    const phpVal = parseFloat(form.price);
    if (form.price === "" || isNaN(phpVal) || phpVal < 0) {
      setFormError("Price must be a valid amount (e.g. 50.00).");
      return;
    }
    const priceCents = Math.round(phpVal * 100);

    setSaving(true);
    try {
      const body = { document_type: { name: trimmedName, price_cents: priceCents } };
      const res = editTarget
        ? await api(`/api/v1/document_types/${editTarget.id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await api("/api/v1/document_types", { method: "POST", body: JSON.stringify(body) });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object"
            ? Object.entries(data)
                .map(([k, v]) => `${k} ${Array.isArray(v) ? v.join(", ") : v}`)
                .join("; ")
            : "Failed to save.";
        setFormError(msg);
        return;
      }

      closeModal();
      await loadDocumentTypes();
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(docType) {
    const confirmed = await ShowAlert({
      title: "Delete document type?",
      text: `"${docType.name}" will be permanently removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirmed?.isConfirmed) return;

    try {
      const res = await api(`/api/v1/document_types/${docType.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete.");
      }
      await loadDocumentTypes();
    } catch (err) {
      ShowAlert({ title: "Error", text: err.message || "Failed to delete.", icon: "error" });
    }
  }

  return (
    <div className="documents-page px-8 flex-grow-1 py-4">
      <div className="page-panel">
        <div className="page-header">
          <div>
            <span className="section-kicker">Document Catalog</span>
            <h1 className="page-title">Document Types</h1>
            <p className="page-copy">
              Manage the catalog of requestable documents and their prices. Changes apply immediately to the student
              request form.
            </p>
          </div>
          <button className="add-btn" onClick={openCreate}>
            + Add Document Type
          </button>
        </div>

        {loading ? (
          <div className="state-box">Loading document types...</div>
        ) : error ? (
          <div className="state-box state-error">{error}</div>
        ) : (
          <div className="table-wrap">
            <table className="dt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {documentTypes.length > 0 ? (
                  documentTypes.map((dt, idx) => (
                    <tr key={dt.id}>
                      <td className="col-id">{idx + 1}</td>
                      <td className="col-name">{dt.name}</td>
                      <td className="col-price">{formatPrice(dt.price_cents)}</td>
                      <td className="col-actions d-flex gap-2 w-100 justify-content-end">
                        <button className="action-btn edit-btn" onClick={() => openEdit(dt)}>
                          Edit
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(dt)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="table-empty">
                      No document types yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Edit Document Type" : "New Document Type"}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="form-error">{formError}</div>}

              <div className="field">
                <label htmlFor="dt-name" className="field-label">
                  Name
                </label>
                <input
                  id="dt-name"
                  name="name"
                  type="text"
                  className="field-input"
                  placeholder="e.g. Transcript of Records"
                  value={form.name}
                  onChange={handleFormChange}
                  autoFocus
                />
              </div>

              <div className="field">
                <label htmlFor="dt-price" className="field-label">
                  Price
                </label>
                <div className="price-input-wrap">
                  <span className="price-prefix">₱</span>
                  <input
                    id="dt-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="field-input price-input ps-8"
                    placeholder="0.00"
                    value={form.price}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .documents-page {
          color: #25304f;
        }

        .page-panel {
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(19, 50, 136, 0.08);
          box-shadow: 0 18px 44px rgba(19, 50, 136, 0.08);
          padding: 28px;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .section-kicker {
          display: inline-block;
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6b7697;
        }

        .page-title {
          margin: 6px 0 0;
          font-size: clamp(1.4rem, 2.5vw, 1.9rem);
          font-weight: 800;
          color: #1b2753;
          line-height: 1.1;
        }

        .page-copy {
          margin: 8px 0 0;
          color: #667390;
          max-width: 560px;
          line-height: 1.6;
        }

        .add-btn {
          min-height: 46px;
          padding: 0 22px;
          border-radius: 999px;
          background: #133288;
          color: #fff;
          font-weight: 700;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: 140ms ease;
        }

        .add-btn:hover {
          background: #1a3fa5;
        }

        .state-box {
          text-align: center;
          padding: 48px 20px;
          color: #667390;
          border-radius: 12px;
          border: 1px dashed rgba(19, 50, 136, 0.15);
        }

        .state-error {
          color: #a52828;
        }

        .table-wrap {
          border-radius: 12px;
          border: 1px solid rgba(19, 50, 136, 0.08);
          overflow: hidden;
        }

        .dt-table {
          width: 100%;
          border-collapse: collapse;
        }

        .dt-table th,
        .dt-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #edf1f7;
          font-size: 0.92rem;
          color: #394466;
          vertical-align: middle;
        }

        .dt-table tr:last-child td {
          border-bottom: none;
        }

        .dt-table th {
          background: #fbfcff;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 800;
          color: #7d88a6;
        }

        .col-id {
          width: 48px;
          color: #9aa3be;
        }

        .col-name {
          font-weight: 600;
        }

        .col-price {
          font-weight: 700;
          color: #133288;
        }

        .col-actions {
          width: 160px;
          text-align: right;
        }

        .action-btn {
          min-height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid;
          transition: 120ms ease;
          margin-left: 6px;
        }

        .edit-btn {
          border-color: #133288;
          color: #133288;
          background: transparent;
        }

        .edit-btn:hover {
          background: #edf2ff;
        }

        .delete-btn {
          border-color: #c0392b;
          color: #c0392b;
          background: transparent;
        }

        .delete-btn:hover {
          background: #fff0ee;
        }

        .table-empty {
          text-align: center;
          padding: 40px 20px;
          color: #9aa3be;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 22, 54, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-card {
          background: #fff;
          border-radius: 18px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 24px 64px rgba(19, 50, 136, 0.18);
          padding: 32px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .modal-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1b2753;
          margin: 0;
        }

        .modal-close {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: none;
          background: #f0f2f8;
          color: #667390;
          font-size: 1.4rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: #e2e6f2;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-error {
          background: #fff0ee;
          border: 1px solid #f5c0b8;
          border-radius: 8px;
          padding: 10px 14px;
          color: #a52828;
          font-size: 0.88rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #4a567a;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .price-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .price-prefix {
          position: absolute;
          left: 14px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #4a567a;
          pointer-events: none;
          user-select: none;
        }

        .price-input {
          padding-left: 28px;
        }

        .field-input {
          width: 100%;
          height: 46px;
          border-radius: 10px;
          border: 1.5px solid rgba(19, 50, 136, 0.18);
          padding: 0 14px;
          font-size: 0.95rem;
          color: #25304f;
          outline: none;
          transition: border-color 140ms ease;
        }

        .field-input:focus {
          border-color: #133288;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .cancel-btn {
          min-height: 44px;
          padding: 0 20px;
          border-radius: 999px;
          border: 1.5px solid rgba(19, 50, 136, 0.18);
          background: transparent;
          color: #667390;
          font-weight: 700;
          cursor: pointer;
          transition: 120ms ease;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #f0f2f8;
        }

        .save-btn {
          min-height: 44px;
          padding: 0 24px;
          border-radius: 999px;
          background: #133288;
          color: #fff;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: 120ms ease;
        }

        .save-btn:hover:not(:disabled) {
          background: #1a3fa5;
        }

        .save-btn:disabled,
        .cancel-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
