import { requireUnlocked } from "@/lib/auth";
import NewOrderForm from "@/components/orders/new-order-form";

export default async function NewOrderPage() {
  await requireUnlocked();

  return (
    <main className="container">
      <NewOrderForm />
    </main>
  );
}