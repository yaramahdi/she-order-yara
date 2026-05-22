"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderForm() {
  const router = useRouter();

  const [emailName, setEmailName] = useState("");
  const [createdDate, setCreatedDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_name: emailName.trim(),
          created_date: createdDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "فشل إنشاء الطلبية");
        return;
      }

      router.push(`/orders/${data.order.id}`);
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1 className="title">طلبية جديدة</h1>
      <p className="subtitle">
        أدخلي اسم الإيميل وتاريخ الإنشاء فقط، وباقي القيم تعدلينها لاحقًا من داخل الطلبية
      </p>

      <div style={{ height: 14 }} />

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
        <div>
          <label className="label">اسم الإيميل</label>
          <input
            className="input"
            type="text"
            value={emailName}
            onChange={(event) => setEmailName(event.target.value)}
            placeholder="مثال: yaramahdi79"
            required
          />
        </div>

        <div>
          <label className="label">تاريخ الإنشاء</label>
          <input
            className="input"
            type="date"
            value={createdDate}
            onChange={(event) => setCreatedDate(event.target.value)}
            required
          />
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            className="outline-warn-btn"
            onClick={() => router.push("/orders")}
          >
            رجوع
          </button>

          <button className="btn-dark" type="submit" disabled={loading}>
            {loading ? "جاري الإنشاء..." : "إنشاء الطلبية"}
          </button>
        </div>
      </form>
    </section>
  );
}