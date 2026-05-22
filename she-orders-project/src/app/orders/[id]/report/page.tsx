
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUnlocked } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatDate, formatMoney, formatUsd } from "@/lib/format";
import type { OrderItem, OrderSummary } from "@/lib/types";
import PrintReportButton from "@/components/orders/print-report-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderReportPage({ params }: PageProps) {
  await requireUnlocked();

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("order_summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const orderData = order as OrderSummary;
  const orderItems = (items ?? []) as OrderItem[];

  const totalRequiredToSettleNader =
    Number(orderData.nader_paid_ils ?? 0) - Number(orderData.total_deposit ?? 0);

  return (
    <main className="report-page">
      <div className="report-shell">
        <div className="report-top no-print">
          <div>
            <Link href={`/orders/${orderData.id}`} className="report-back-link">
              ← الرجوع إلى الطلبية
            </Link>
          </div>

          <PrintReportButton />
        </div>

        <section className="report-card report-header">
          <div>
            <h1 className="report-title">تقرير الطلبية</h1>
            <p className="report-subtitle">طلبية: {orderData.email_name}</p>
          </div>

          <div className="report-meta">
            <div>تاريخ الإنشاء: {formatDate(orderData.created_date)}</div>
            <div>الحالة: {orderData.is_finished ? "منتهية" : "نشطة"}</div>
          </div>
        </section>

        <section className="report-card">
          <div className="report-summary-grid four-grid">
            <div className="report-stat">
              <span>السعر المدفوع من نادر - شيكل</span>
              <strong>{formatMoney(orderData.nader_paid_ils)}</strong>
            </div>

            <div className="report-stat">
              <span>السعر المدفوع من نادر - دولار</span>
              <strong>{formatUsd(orderData.nader_paid_usd)}</strong>
            </div>

            <div className="report-stat">
              <span>مجموع العربون المدفوع</span>
              <strong>{formatMoney(orderData.total_deposit)}</strong>
            </div>

            <div className="report-stat">
              <span>إجمالي المطلوب لتسديد نادر</span>
              <strong>{formatMoney(totalRequiredToSettleNader)}</strong>
            </div>
          </div>
        </section>

        <section className="report-card">
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>السعر الكلي</th>
                  <th>العربون</th>
                  <th>المتبقي</th>
                </tr>
              </thead>

              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="report-empty">
                      لا توجد بيانات داخل هذه الطلبية
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{formatMoney(item.total_price)}</td>
                      <td>{formatMoney(item.deposit_paid)}</td>
                      <td>{formatMoney(item.remaining_price)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}