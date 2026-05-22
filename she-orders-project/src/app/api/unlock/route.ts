import { NextResponse } from "next/server";
import { APP_UNLOCK_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");

    if (!process.env.APP_PASSWORD) {
      return NextResponse.json({ message: "APP_PASSWORD is missing in env" }, { status: 500 });
    }

    if (password !== process.env.APP_PASSWORD) {
      return NextResponse.json({ message: "كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: APP_UNLOCK_COOKIE,
      value: "yes",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "حدث خطأ أثناء التحقق من كلمة المرور" }, { status: 500 });
  }
}
