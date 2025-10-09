
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOwnerKpis } from "./api";

export function OwnerKpis() {
  const { data } = useOwnerKpis();
  const k = data?.kpis ?? { mrr_usd: 0, active_aircraft: 0, members: 0, utilization_30d: 0 };

  return (
    <>
      <KpiCard label="MRR" value={`$${(k.mrr_usd || 0).toLocaleString()}`} />
      <KpiCard label="Active Aircraft" value={k.active_aircraft ?? 0} />
      <KpiCard label="Members" value={k.members ?? 0} />
      <KpiCard label="Utilization (30d)" value={`${Math.round((k.utilization_30d || 0) * 100)}%`} />
    </>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">{value}</CardContent>
    </Card>
  );
}