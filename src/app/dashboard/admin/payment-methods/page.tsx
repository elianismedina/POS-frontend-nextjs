import { PaymentMethodsList } from "@/components/admin/PaymentMethodsList";

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <PaymentMethodsList />
      </div>
    </div>
  );
}
