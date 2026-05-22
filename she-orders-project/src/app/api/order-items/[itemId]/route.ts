import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const body = await request.json();

    const allowed: Record<string, unknown> = {};

    if (typeof body.total_price === "number" && body.total_price >= 0) {
      allowed.total_price = body.total_price;
    }
    if (typeof body.deposit_paid === "number" && body.deposit_paid >= 0) {
      allowed.deposit_paid = body.deposit_paid;
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ message: "لا توجد بيانات صالحة للتحديث" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("order_items")
      .update(allowed)
      .eq("id", itemId)
      .select("id, total_price, deposit_paid, remaining_price")
      .single();

    if (error) {
      return NextResponse.json({ message: error.message || "فشل التحديث" }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch {
    return NextResponse.json({ message: "حدث خطأ أثناء التحديث" }, { status: 500 });
  }
}
