import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const emailName = String(body.email_name ?? "").trim();
    const createdDate = String(body.created_date ?? "").trim();

    if (!emailName) {
      return NextResponse.json(
        { message: "اسم الإيميل مطلوب" },
        { status: 400 }
      );
    }

    if (!createdDate) {
      return NextResponse.json(
        { message: "تاريخ الإنشاء مطلوب" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        email_name: emailName,
        created_date: createdDate,
        order_cost_with_coordination: 0,
        nader_paid_ils: 0,
        nader_paid_usd: 0,
      })
      .select("id, email_name")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { message: "هذا الإيميل مستخدم مسبقًا كاسم طلبية" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: error.message || "فشل إنشاء الطلبية" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch {
    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الطلبية" },
      { status: 500 }
    );
  }
}