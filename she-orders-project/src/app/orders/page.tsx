import Link from "next/link";
import { requireUnlocked } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";

export default async function OrdersPage() {
  await requireUnlocked();

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("order_summaries")
    .select("*")
    .order("created_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const orders = (data ?? []) as OrderSummary[];

  return (
    <main className="container">
      <section className="orders-top-card">
        <div className="orders-top-text">
          <h1 className="title">كل الطلبيات</h1>
          <div className="subtitle">اضغطي على أي طلبية لعرض التفاصيل</div>
        </div>

        <div className="orders-top-actions">
          <Link className="btn-dark" href="/orders/new">
            + طلبية جديدة
          </Link>
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          لا توجد أي طلبيات حتى الآن
        </div>
      ) : (
        <div className="grid grid-3">
          {orders.map((order) => (
            <Link
              href={`/orders/${order.id}`}
              key={order.id}
              className="card"
              style={{ padding: 20 }}
            >
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>
                      {order.email_name}
                    </div>

                    <div className="subtitle">
                      تاريخ الإنشاء: {formatDate(order.created_date)}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      order.is_finished ? "badge-finished" : "badge-active"
                    }`}
                  >
                    {order.is_finished ? "منتهية" : "نشطة"}
                  </span>
                </div>

                <div className="grid grid-2">
                  <div className="summary-box">
                    <div className="muted">عدد البنات</div>
                    <div style={{ fontWeight: 800, marginTop: 6 }}>
                      {order.girls_count}
                    </div>
                  </div>

                  <div className="summary-box">
                    <div className="muted">الربح</div>
                    <div style={{ fontWeight: 800, marginTop: 6 }}>
                      {formatMoney(order.profit)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}