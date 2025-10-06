import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCharges, getMembership, Charge, Membership } from '@/lib/supabase-api';
import { format } from 'date-fns';
import { DollarSign, Receipt, CreditCard } from 'lucide-react';

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [chargesData, membershipData] = await Promise.all([
        getCharges(user!.id),
        getMembership(user!.id),
      ]);
      setCharges(chargesData);
      setMembership(membershipData);
    } catch (error: any) {
      toast({
        title: 'Error loading billing data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getStatusBadge = (status: Charge['status']) => {
    const variants: Record<Charge['status'], { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      paid: { variant: 'default', label: 'Paid' },
      failed: { variant: 'destructive', label: 'Failed' },
      refunded: { variant: 'outline', label: 'Refunded' },
    };

    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'secondary',
      premium: 'default',
      platinum: 'default',
    };
    return (
      <Badge variant={colors[tier] as any} className="capitalize">
        {tier}
      </Badge>
    );
  };

  const totalPaid = charges
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount_cents, 0);

  const pendingBalance = charges
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount_cents, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Billing</h1>
          <p className="text-muted-foreground">
            View your membership, invoices, and payment history
          </p>
        </div>

        {membership && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership
                </span>
                {getTierBadge(membership.tier)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {format(new Date(membership.starts_at), 'PPP')}
                  </p>
                </div>
                {membership.ends_at && (
                  <div>
                    <p className="text-muted-foreground">Ends</p>
                    <p className="font-medium">
                      {format(new Date(membership.ends_at), 'PPP')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{membership.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid YTD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Balance
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(pendingBalance)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Charges
              </CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{charges.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Charges & Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {charges.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No charges found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{charge.description}</h3>
                        {getStatusBadge(charge.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {format(new Date(charge.created_at), 'PPP')}
                          {charge.paid_at &&
                            ` - Paid on ${format(new Date(charge.paid_at), 'PPP')}`}
                        </p>
                        <p className="capitalize">Source: {charge.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatAmount(charge.amount_cents, charge.currency)}
                      </p>
                      {charge.due_at && charge.status === 'pending' && (
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(charge.due_at), 'PP')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Billing;
