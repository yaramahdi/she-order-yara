"use client";

import { useId, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

type Props = {
  items: OrderItem[];
};

const avatarColors = [
  "#FCE7F3",
  "#EDE9FE",
  "#DBEAFE",
  "#DCFCE7",
  "#FEF3C7",
  "#FFE4E6",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

const MAX_PROOFS = 5;
const MAX_ORDER_IMAGES = 10;

function ProofUploadCell({
  itemId,
  proofPaths,
  proofUrls,
  onUpdated,
}: {
  itemId: string;
  proofPaths: string[];
  proofUrls: string[];
  onUpdated: (paths: string[], urls: string[]) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("payment_proof", file);

    setUploading(true);
    try {
      const response = await fetch(`/api/order-items/${itemId}/proof`, {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "فشل رفع الإشعار");
        return;
      }

      onUpdated(data.paths, data.urls);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(storagePath: string) {
    if (!confirm("هل تريد حذف هذا الإشعار؟")) return;

    setDeletingPath(storagePath);
    try {
      const response = await fetch(
        `/api/order-items/${itemId}/proof?path=${encodeURIComponent(storagePath)}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "فشل حذف الإشعار");
        return;
      }

      onUpdated(data.paths, data.urls);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setDeletingPath(null);
    }
  }

  return (
    <div className="proof-cell-wrap">
      {proofUrls.map((url, i) => (
        <div key={proofPaths[i]} className="proof-thumb-row">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="proof-view-btn"
          >
            إشعار {i + 1}
          </a>
          <button
            className="proof-delete-btn"
            onClick={() => handleDelete(proofPaths[i])}
            disabled={deletingPath === proofPaths[i]}
            title="حذف"
          >
            {deletingPath === proofPaths[i] ? "…" : "✕"}
          </button>
        </div>
      ))}

      {proofPaths.length < MAX_PROOFS && (
        <>
          <label htmlFor={inputId} className="proof-upload-btn">
            {uploading ? "…" : "+ إشعار"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}

function OrderImagesCell({
  itemId,
  imagePaths,
  imageUrls,
  onUpdated,
}: {
  itemId: string;
  imagePaths: string[];
  imageUrls: string[];
  onUpdated: (paths: string[], urls: string[]) => void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("order_image", file);
    setUploading(true);
    try {
      const response = await fetch(`/api/order-items/${itemId}/images`, {
        method: "PATCH",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "فشل رفع الصورة");
        return;
      }
      onUpdated(data.paths, data.urls);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(storagePath: string) {
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    setDeletingPath(storagePath);
    try {
      const response = await fetch(
        `/api/order-items/${itemId}/images?path=${encodeURIComponent(storagePath)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "فشل حذف الصورة");
        return;
      }
      onUpdated(data.paths, data.urls);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setDeletingPath(null);
    }
  }

  return (
    <div className="order-images-cell">
      {imageUrls.map((url, i) => (
        <div key={imagePaths[i]} className="order-img-thumb-wrap">
          <img src={url} alt={`صورة ${i + 1}`} className="order-img-thumb" />
          <button
            className="order-img-delete-btn"
            onClick={() => handleDelete(imagePaths[i])}
            disabled={deletingPath === imagePaths[i]}
            title="حذف"
          >
            {deletingPath === imagePaths[i] ? "…" : "✕"}
          </button>
        </div>
      ))}
      {imagePaths.length < MAX_ORDER_IMAGES && (
        <>
          <label htmlFor={inputId} className="order-img-upload-btn">
            {uploading ? "…" : "+ صورة"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  );
}

function EditableMoneyCell({
  itemId,
  field,
  value,
  onSaved,
}: {
  itemId: string;
  field: "total_price" | "deposit_paid";
  value: number;
  onSaved: (field: "total_price" | "deposit_paid", newValue: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  async function commit() {
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed < 0) {
      setEditing(false);
      return;
    }

    if (parsed === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: parsed }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "فشل التحديث");
        return;
      }

      onSaved(field, parsed);
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="editable-money-input"
        type="number"
        min="0"
        step="0.01"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={saving}
        style={{
          width: "90px",
          padding: "2px 6px",
          border: "1px solid #a78bfa",
          borderRadius: "6px",
          fontSize: "inherit",
          textAlign: "center",
          direction: "ltr",
        }}
      />
    );
  }

  return (
    <span
      title="اضغط للتعديل"
      onClick={startEdit}
      style={{ cursor: "pointer", borderBottom: "1px dashed #a78bfa", paddingBottom: "1px" }}
    >
      {saving ? "..." : formatMoney(value)}
    </span>
  );
}

export default function ItemsTable({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);

  function handleSaved(
    itemId: string,
    field: "total_price" | "deposit_paid",
    newValue: number
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: newValue };
        updated.remaining_price = updated.total_price - updated.deposit_paid;
        return updated;
      })
    );
  }

  function handleProofUpdated(itemId: string, paths: string[], urls: string[]) {
    setItems((prev) =>
      prev.map((item) =>
        item.id !== itemId
          ? item
          : { ...item, payment_proof_paths: paths, payment_proof_urls: urls }
      )
    );
  }

  function handleImagesUpdated(itemId: string, paths: string[], urls: string[]) {
    setItems((prev) =>
      prev.map((item) =>
        item.id !== itemId
          ? item
          : { ...item, order_image_paths: paths, order_image_urls: urls }
      )
    );
  }

  return (
    <section className="girls-table-card">
      <div className="girls-table-head">
        <div className="girls-count-badge">{items.length} بنات</div>
        <h3>جدول البنات</h3>
      </div>

      <div className="table-wrap">
        <table className="girls-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>رابط الانستا</th>
              <th>السعر الكلي</th>
              <th>العربون</th>
              <th>المتبقي</th>
              <th>الإشعار</th>
              <th>صور الطلبية</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  لا توجد بنات داخل هذه الطلبية حتى الآن
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <div className="girl-name-cell">
                      <span
                        className="girl-avatar"
                        style={{
                          backgroundColor:
                            avatarColors[index % avatarColors.length],
                        }}
                      >
                        {getInitials(item.name)}
                      </span>

                      <span>{item.name}</span>
                    </div>
                  </td>

                  <td>
                    <a
                      href={item.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="table-link"
                    >
                      فتح الرابط
                    </a>
                  </td>

                  <td>
                    <EditableMoneyCell
                      itemId={item.id}
                      field="total_price"
                      value={item.total_price}
                      onSaved={(field, val) => handleSaved(item.id, field, val)}
                    />
                  </td>

                  <td>
                    <EditableMoneyCell
                      itemId={item.id}
                      field="deposit_paid"
                      value={item.deposit_paid}
                      onSaved={(field, val) => handleSaved(item.id, field, val)}
                    />
                  </td>

                  <td>
                    <span className="remaining-pill">
                      {formatMoney(item.remaining_price)}
                    </span>
                  </td>

                  <td>
                    <ProofUploadCell
                      itemId={item.id}
                      proofPaths={item.payment_proof_paths ?? []}
                      proofUrls={item.payment_proof_urls ?? []}
                      onUpdated={(paths, urls) => handleProofUpdated(item.id, paths, urls)}
                    />
                  </td>

                  <td>
                    <OrderImagesCell
                      itemId={item.id}
                      imagePaths={item.order_image_paths ?? []}
                      imageUrls={item.order_image_urls ?? []}
                      onUpdated={(paths, urls) => handleImagesUpdated(item.id, paths, urls)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
