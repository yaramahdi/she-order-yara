"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
};

export default function AddItemForm({ orderId }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [depositPaid, setDepositPaid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const remainingPrice = useMemo(() => {
    const total = Number(totalPrice || 0);
    const deposit = Number(depositPaid || 0);

    if (Number.isNaN(total) || Number.isNaN(deposit)) return 0;
    return Math.max(total - deposit, 0);
  }, [totalPrice, depositPaid]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const total = Number(totalPrice || 0);
    const deposit = Number(depositPaid || 0);

    if (deposit > total) {
      setError("العربون المدفوع لا يمكن أن يكون أكبر من السعر الكلي");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          instagram_url: instagramUrl.trim(),
          total_price: total,
          deposit_paid: deposit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "فشل إضافة البنت");
        return;
      }

      setName("");
      setInstagramUrl("");
      setTotalPrice("");
      setDepositPaid("");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="inline-add-card">
      <div className="inline-add-head">
        <h2>إضافة بنت إلى الطلبية</h2>
        <p>أدخلي البيانات بشكل سريع ومباشر</p>
      </div>

      <form onSubmit={handleSubmit} className="inline-add-form">
        <div className="inline-fields">
          <div>
            <label className="mini-label">الاسم</label>
            <input
              className="soft-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم البنت"
              required
            />
          </div>

          <div>
            <label className="mini-label">رابط الانستا</label>
            <input
              className="soft-input"
              type="url"
              value={instagramUrl}
              onChange={(event) => setInstagramUrl(event.target.value)}
              placeholder="https://instagram.com/..."
              required
            />
          </div>

          <div>
            <label className="mini-label">السعر الكلي</label>
            <input
              className="soft-input"
              type="number"
              min="0"
              step="0.01"
              value={totalPrice}
              onChange={(event) => setTotalPrice(event.target.value)}
              placeholder="350"
              required
            />
          </div>

          <div>
            <label className="mini-label">العربون</label>
            <input
              className="soft-input"
              type="number"
              min="0"
              step="0.01"
              value={depositPaid}
              onChange={(event) => setDepositPaid(event.target.value)}
              placeholder="150"
              required
            />
          </div>

          <div>
            <label className="mini-label">المتبقي</label>
            <input
              className="soft-input soft-readonly"
              type="text"
              value={`${remainingPrice.toFixed(2)} ₪`}
              readOnly
            />
          </div>
        </div>

        <div className="inline-add-actions">
          <button className="add-girl-btn" type="submit" disabled={loading}>
            {loading ? "..." : "+ إضافة"}
          </button>
        </div>
      </form>

      {error ? <div className="error-box" style={{ marginTop: 10 }}>{error}</div> : null}
    </section>
  );
}