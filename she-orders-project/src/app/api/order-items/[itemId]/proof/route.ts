import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_PROOFS = 5;
const SIGNED_URL_TTL = 60 * 60;

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

async function signPaths(supabase: ReturnType<typeof getSupabaseAdmin>, paths: string[]) {
  return Promise.all(
    paths.map(async (p) => {
      const { data } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(p, SIGNED_URL_TTL);
      return data?.signedUrl ?? null;
    })
  );
}

// Add a new proof image (up to MAX_PROOFS)
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const formData = await request.formData();
    const paymentProof = formData.get("payment_proof");

    if (!(paymentProof instanceof File) || paymentProof.size === 0) {
      return NextResponse.json({ message: "يرجى اختيار صورة الإشعار" }, { status: 400 });
    }

    if (!paymentProof.type.startsWith("image/")) {
      return NextResponse.json({ message: "الملف يجب أن يكون صورة" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: currentItem, error: fetchError } = await supabase
      .from("order_items")
      .select("id, payment_proof_paths")
      .eq("id", itemId)
      .single();

    if (fetchError || !currentItem) {
      return NextResponse.json({ message: "الصف غير موجود" }, { status: 404 });
    }

    const currentPaths: string[] = currentItem.payment_proof_paths ?? [];

    if (currentPaths.length >= MAX_PROOFS) {
      return NextResponse.json(
        { message: `لا يمكن إضافة أكثر من ${MAX_PROOFS} إشعارات` },
        { status: 400 }
      );
    }

    const originalName = paymentProof.name || "proof";
    const safeFileName = originalName.replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
    const fileExt =
      safeFileName.split(".").pop()?.toLowerCase() ||
      paymentProof.type.split("/")[1] ||
      "jpg";

    const filePath = `order-items/${itemId}/${Date.now()}-${randomUUID()}.${fileExt}`;
    const arrayBuffer = await paymentProof.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, fileBuffer, { contentType: paymentProof.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { message: uploadError.message || "فشل رفع الإشعار" },
        { status: 500 }
      );
    }

    const newPaths = [...currentPaths, filePath];

    const { error: updateError } = await supabase
      .from("order_items")
      .update({ payment_proof_paths: newPaths })
      .eq("id", itemId);

    if (updateError) {
      await supabase.storage.from("payment-proofs").remove([filePath]);
      return NextResponse.json(
        { message: updateError.message || "فشل تحديث الإشعار" },
        { status: 500 }
      );
    }

    const urls = await signPaths(supabase, newPaths);

    return NextResponse.json({ success: true, paths: newPaths, urls });
  } catch {
    return NextResponse.json({ message: "حدث خطأ أثناء رفع الإشعار" }, { status: 500 });
  }
}

// Remove one proof image by its storage path
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { itemId } = await context.params;
    const { searchParams } = new URL(request.url);
    const pathToRemove = searchParams.get("path");

    if (!pathToRemove) {
      return NextResponse.json({ message: "يجب تحديد مسار الإشعار" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: currentItem, error: fetchError } = await supabase
      .from("order_items")
      .select("id, payment_proof_paths")
      .eq("id", itemId)
      .single();

    if (fetchError || !currentItem) {
      return NextResponse.json({ message: "الصف غير موجود" }, { status: 404 });
    }

    const currentPaths: string[] = currentItem.payment_proof_paths ?? [];
    const newPaths = currentPaths.filter((p) => p !== pathToRemove);

    const { error: updateError } = await supabase
      .from("order_items")
      .update({ payment_proof_paths: newPaths })
      .eq("id", itemId);

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message || "فشل حذف الإشعار" },
        { status: 500 }
      );
    }

    await supabase.storage.from("payment-proofs").remove([pathToRemove]);

    const urls = await signPaths(supabase, newPaths);

    return NextResponse.json({ success: true, paths: newPaths, urls });
  } catch {
    return NextResponse.json({ message: "حدث خطأ أثناء حذف الإشعار" }, { status: 500 });
  }
}
