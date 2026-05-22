import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const updates: {
      is_finished?: boolean;
      order_cost_with_coordination?: number;
      nader_paid_ils?: number;
      nader_paid_usd?: number;
    } = {};

    if ("is_finished" in body) {
      updates.is_finished = Boolean(body.is_finished);
    }

    if ("order_cost_with_coordination" in body) {
      const value = Number(body.order_cost_with_coordination);

      if (Number.isNaN(value) || value < 0) {
        return NextResponse.json(
          { message: "سعر الطلبية غير صحيح" },
          { status: 400 }
        );
      }

      updates.order_cost_with_coordination = value;
    }

    if ("nader_paid_ils" in body) {
      const value = Number(body.nader_paid_ils);

      if (Number.isNaN(value) || value < 0) {
        return NextResponse.json(
          { message: "السعر المدفوع من نادر بالشيكل غير صحيح" },
          { status: 400 }
        );
      }

      updates.nader_paid_ils = value;
    }

    if ("nader_paid_usd" in body) {
      const value = Number(body.nader_paid_usd);

      if (Number.isNaN(value) || value < 0) {
        return NextResponse.json(
          { message: "السعر المدفوع من نادر بالدولار غير صحيح" },
          { status: 400 }
        );
      }

      updates.nader_paid_usd = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "لا يوجد شيء للتحديث" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message || "فشل تحديث الطلبية" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء التحديث" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("payment_proof_path")
      .eq("order_id", id);

    if (itemsError) {
      return NextResponse.json(
        { message: itemsError.message || "تعذر قراءة بيانات الطلبية" },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { message: deleteError.message || "فشل حذف الطلبية" },
        { status: 500 }
      );
    }

    const paths =
      items?.map((item) => item.payment_proof_path).filter(Boolean) ?? [];

    if (paths.length > 0) {
      await supabase.storage.from("payment-proofs").remove(paths as string[]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف الطلبية" },
      { status: 500 }
    );
  }
}