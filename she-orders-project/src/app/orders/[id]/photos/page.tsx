import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUnlocked } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { OrderItem, OrderSummary } from "@/lib/types";
import GalleryView from "@/components/orders/gallery-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPhotosPage({ params }: PageProps) {
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

  const orderItems: OrderItem[] = await Promise.all(
    rawItems.map(async (item) => {
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
        order_image_paths: imagePaths,
        order_image_urls: imageUrls.filter(Boolean) as string[],
      };
    })
  );

  return (
    <main className="order-page-shell">
      <div className="order-page-top" style={{ marginBottom: 20 }}>
        <div className="order-page-main-head">
          <Link href={`/orders/${id}`} className="back-link-mini">
            ← الرجوع إلى تفاصيل الطلبية
          </Link>
          <div className="order-title-row">
            <h1 className="order-page-title">
              صور طلبيات البنات: {orderData.email_name}
            </h1>
          </div>
        </div>
      </div>

      <GalleryView items={orderItems} />
    </main>
  );
}
