import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APP_UNLOCK_COOKIE } from "./constants";

export async function isUnlocked() {
  const cookieStore = await cookies();
  return cookieStore.get(APP_UNLOCK_COOKIE)?.value === "yes";
}

export async function requireUnlocked() {
  const unlocked = await isUnlocked();
  if (!unlocked) redirect("/unlock");
}
