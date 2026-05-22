"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "فشل التحقق من كلمة المرور");
        return;
      }

      router.replace("/orders");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
        <label className="label">كلمة المرور</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="اكتبي كلمة المرور" required />
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <button className="btn btn-dark" type="submit" disabled={loading}>{loading ? "جاري التحقق..." : "دخول"}</button>
    </form>
  );
}
