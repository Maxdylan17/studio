import { IssuanceForm } from "@/components/emitir/issuance-form";

export default function EmitirPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emitir Nota Fiscal</h1>
      </div>
      <IssuanceForm />
    </div>
  );
}
