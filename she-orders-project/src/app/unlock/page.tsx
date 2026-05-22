import { redirect } from "next/navigation";
import UnlockForm from "@/components/auth/unlock-form";
import { isUnlocked } from "@/lib/auth";

export default async function UnlockPage() {
  const unlocked = await isUnlocked();
  if (unlocked) redirect("/orders");

  return (
    <main className="center-page">
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <h1 className="title" style={{ fontSize: 28 }}>فتح الموقع</h1>
        <p className="subtitle">أدخلي كلمة المرور للوصول إلى لوحة الطلبيات</p>
        <div className="spacer" />
        <UnlockForm />
      </div>
    </main>
  );
}
