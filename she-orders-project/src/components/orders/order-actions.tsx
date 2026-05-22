"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  isFinished: boolean;
};

export default function OrderActions({ orderId, isFinished }: Props) {
  const router = useRouter();

  const [finishLoading, setFinishLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleToggleFinish() {
    setFinishLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_finished: !isFinished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "فشل تحديث الحالة");
        return;
      }

      router.refresh();
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setFinishLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("هل أنتِ متأكدة من حذف الطلبية؟");
    if (!confirmed) return;

    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "فشل حذف الطلبية");
        return;
      }

      router.push("/orders");
      router.refresh();
    } catch {
      alert("تعذر الاتصال بالخادم");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="order-actions-inline">
      <button
        className="outline-warn-btn"
        type="button"
        onClick={handleToggleFinish}
        disabled={finishLoading}
      >
        {finishLoading ? "..." : isFinished ? "إرجاعها نشطة" : "تحديد كمنتهية"}
      </button>

      <button
        className="outline-danger-btn"
        type="button"
        onClick={handleDelete}
        disabled={deleteLoading}
      >
        {deleteLoading ? "..." : "حذف الطلبية"}
      </button>
    </div>
  );
}