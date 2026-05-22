import { redirect } from "next/navigation";
import { isUnlocked } from "@/lib/auth";

export default async function HomePage() {
  const unlocked = await isUnlocked();
  redirect(unlocked ? "/orders" : "/unlock");
}
