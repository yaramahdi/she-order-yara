import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUnlocked } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderItem, OrderSummary } from "@/lib/types";
import AddItemForm from "@/components/orders/add-item-form";
import OrderActions from "@/components/orders/order-actions";
import EditableSummaryBox from "@/components/orders/order-cost-summary-box";
import ItemsTable from "@/components/orders/items-table";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailsPage({ params }: PageProps) {
  await requireUnlocked();
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("order_summaries")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) notFound();

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) throw new Error(itemsError.message);

  const orderData = order as OrderSummary;
  const rawItems = (items ?? []) as OrderItem[];

  const totalRequiredToSettleNader = Math.max(
    Number(orderData.nader_paid_ils ?? 0) - Number(orderData.total_deposit ?? 0),
    0
  );

  const orderItems: OrderItem[] = await Promise.all(
    rawItems.map(async (item) => {
      const proofPaths: string[] = item.payment_proof_paths ?? [];
      const proofUrls = await Promise.all(
        proofPaths.map(async (p: string) => {
          const { data } = await supabase.storage
            .from("payment-proofs")
            .createSignedUrl(p, 60 * 60);
          return data?.signedUrl ?? null;
        })
      );

      const imagePaths: string[] = item.order_image_paths ?? [];
      const imageUrls = await Promise.all(
        imagePaths.map(async (p: string) => {
          const { data } = await supabase.storage
            .from("payment-proofs")
            .createSignedUrl(p, 60 * 60);
          return data?.signedUrl ?? null;
        })
      );

      return {
        ...item,
        payment_proof_paths: proofPaths,
        payment_proof_urls: proofUrls.filter(Boolean) as string[],
        order_image_paths: imagePaths,
        order_image_urls: imageUrls.filter(Boolean) as string[],
      };
    })
  );

  return (
    <main className="order-page-shell">
      <div className="order-page-top">
        <div className="order-page-main-head">
          <Link href="/orders" className="back-link-mini">
            ← الرجوع إلى كل الطلبيات
          </Link>

          <div className="order-title-row">
            <h1 className="order-page-title">طلبية: {orderData.email_name}</h1>
            <span
              className={`status-pill ${orderData.is_finished ? "finished" : "active"}`}
            >
              {orderData.is_finished ? "منتهية" : "نشطة"}
            </span>
          </div>

          <div className="order-page-date">
            تاريخ الإنشاء: {formatDate(orderData.created_date)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/orders/${orderData.id}/report`} className="btn-dark">
            عرض التقرير
          </Link>

          <Link href={`/orders/${orderData.id}/photos`} className="btn-dark">
            صور الطلبيات
          </Link>

          <OrderActions orderId={orderData.id} isFinished={orderData.is_finished} />
        </div>
      </div>

      <section className="mini-stats-strip eight-cards">
        <EditableSummaryBox
          orderId={orderData.id}
          label="سعر الطلبية بالتنسيق"
          value={orderData.order_cost_with_coordination}
          fieldName="order_cost_with_coordination"
        />

        <EditableSummaryBox
          orderId={orderData.id}
          label="السعر المدفوع من نادر - شيكل"
          value={orderData.nader_paid_ils}
          fieldName="nader_paid_ils"
          currency="ils"
        />

        <EditableSummaryBox
          orderId={orderData.id}
          label="السعر المدفوع من نادر - دولار"
          value={orderData.nader_paid_usd}
          fieldName="nader_paid_usd"
          currency="usd"
        />

        <div className="mini-stat-card blue-soft">
          <span>السعر الكلي الذي سيدفعه البنات</span>
          <strong>{formatMoney(orderData.girls_total_price)}</strong>
        </div>

        <div className="mini-stat-card green-soft">
          <span>إجمالي العربون</span>
          <strong>{formatMoney(orderData.total_deposit)}</strong>
        </div>

        <div className="mini-stat-card pink-soft">
          <span>إجمالي المطلوب لتسديد نادر</span>
          <strong>{formatMoney(totalRequiredToSettleNader)}</strong>
        </div>

        <div className="mini-stat-card yellow-soft">
          <span>الربح</span>
          <strong>{formatMoney(orderData.profit)}</strong>
        </div>
      </section>

      <AddItemForm orderId={orderData.id} />
      <ItemsTable items={orderItems} />
    </main>
  );
}