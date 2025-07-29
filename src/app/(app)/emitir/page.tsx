import { IssuanceForm } from "@/components/emitir/issuance-form";
import { SmartIssuance } from "@/components/emitir/smart-issuance";
import { Separator } from "@/components/ui/separator";

export default function EmitirPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Emitir Nota Fiscal</h1>
      </div>
       <SmartIssuance form={undefined} replace={undefined} />
       <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-muted-foreground">OU PREENCHA MANUALMENTE</span>
        </div>
      <IssuanceForm />
    </div>
  );
}
