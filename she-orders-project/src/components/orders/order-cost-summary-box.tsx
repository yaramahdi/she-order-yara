"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatUsd } from "@/lib/format";

type EditableFieldName =
  | "order_cost_with_coordination"
  | "nader_paid_ils"
  | "nader_paid_usd";

type Props = {
  orderId: string;
  label: string;
  value: number;
  fieldName: EditableFieldName;
  currency?: "ils" | "usd";
};

export default function EditableSummaryBox({
  orderId,
  label,
  value,
  fieldName,
  currency = "ils",
}: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value ?? 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");

    const numericValue = Number(localValue);

    if (Number.isNaN(numericValue) || numericValue < 0) {
      setError("أدخلي رقمًا صحيحًا");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [fieldName]: numericValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "فشل الحفظ");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("تعذر الاتصال");
    } finally {
      setLoading(false);
    }
  }

  function renderFormattedValue() {
    return currency === "usd"
      ? formatUsd(Number(localValue || 0))
      : formatMoney(Number(localValue || 0));
  }

  return (
    <div className="mini-stat-card editable-card">
      <div className="mini-stat-top">
        <span>{label}</span>

        {!editing ? (
          <button
            type="button"
            className="tiny-edit-btn"
            onClick={() => setEditing(true)}
          >
            تعديل
          </button>
        ) : null}
      </div>

      {!editing ? (
        <strong>{renderFormattedValue()}</strong>
      ) : (
        <div className="tiny-edit-wrap">
          <input
            className="tiny-edit-input"
            type="number"
            min="0"
            step="0.01"
            value={localValue}
            onChange={(event) => setLocalValue(event.target.value)}
          />

          <div className="tiny-edit-actions">
            <button
              type="button"
              className="tiny-save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "..." : "حفظ"}
            </button>

            <button
              type="button"
              className="tiny-cancel-btn"
              onClick={() => {
                setEditing(false);
                setError("");
                setLocalValue(String(value ?? 0));
              }}
            >
              إلغاء
            </button>
          </div>

          {error ? <div className="tiny-error">{error}</div> : null}
        </div>
      )}
    </div>
  );
}