import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, DollarSign } from "lucide-react";
import type { Invoice } from "../types";

interface BillingCardProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export function BillingCard({ invoices, isLoading }: BillingCardProps) {
  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "default";
      case "open":
        return "secondary";
      case "draft":
        return "outline";
      case "void":
      case "uncollectible":
        return "destructive";
      default:
        return "outline";
    }
  };

  const currentInvoice = invoices.find((inv) => inv.status === "open") || invoices[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Billing</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : !currentInvoice ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No invoices yet
          </p>
        ) : (
          <div className="space-y-4">
            {/* Current/Latest Invoice */}
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatPeriod(currentInvoice.period_start, currentInvoice.period_end)}
                </span>
                <Badge variant={getStatusVariant(currentInvoice.status) as any}>
                  {currentInvoice.status}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {formatAmount(currentInvoice.total_cents)}
              </div>
              {currentInvoice.status === "open" && currentInvoice.hosted_invoice_url && (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={currentInvoice.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pay Invoice
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>

            {/* Invoice History */}
            {invoices.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Invoices</h4>
                <div className="space-y-1">
                  {invoices.slice(1, 6).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <span className="text-muted-foreground">
                        {formatPeriod(invoice.period_start, invoice.period_end)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatAmount(invoice.total_cents)}
                        </span>
                        <Badge variant={getStatusVariant(invoice.status) as any} className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
