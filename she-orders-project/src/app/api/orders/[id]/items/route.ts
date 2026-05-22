import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: orderId } = await context.params;
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const instagramUrl = String(body.instagram_url ?? "").trim();
    const totalPrice = Number(body.total_price ?? 0);
    const depositPaid = Number(body.deposit_paid ?? 0);

    if (!name) {
      return NextResponse.json({ message: "اسم البنت مطلوب" }, { status: 400 });
    }

    if (!instagramUrl) {
      return NextResponse.json(
        { message: "رابط الانستا مطلوب" },
        { status: 400 }
      );
    }

    if (Number.isNaN(totalPrice) || totalPrice < 0) {
      return NextResponse.json(
        { message: "السعر الكلي غير صحيح" },
        { status: 400 }
      );
    }

    if (Number.isNaN(depositPaid) || depositPaid < 0) {
      return NextResponse.json(
        { message: "العربون المدفوع غير صحيح" },
        { status: 400 }
      );
    }

    if (depositPaid > totalPrice) {
      return NextResponse.json(
        { message: "العربون المدفوع لا يمكن أن يكون أكبر من السعر الكلي" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { message: "الطلبية غير موجودة" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("order_items")
      .insert({
        order_id: orderId,
        name,
        instagram_url: instagramUrl,
        total_price: totalPrice,
        deposit_paid: depositPaid,
        payment_proof_path: null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message || "فشل إضافة البنت إلى الطلبية" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة البنت" },
      { status: 500 }
    );
  }
}