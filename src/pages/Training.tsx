import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getTrainingRecords, getTrainingCurrency, TrainingRecord, TrainingCurrency } from '@/lib/supabase-api';
import { format, differenceInDays } from 'date-fns';
import { Award, AlertCircle, CheckCircle } from 'lucide-react';

const Training = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [currency, setCurrency] = useState<TrainingCurrency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsData, currencyData] = await Promise.all([
        getTrainingRecords(user!.id),
        getTrainingCurrency(user!.id),
      ]);
      setRecords(recordsData);
      setCurrency(currencyData);
    } catch (error: any) {
      toast({
        title: 'Error loading training data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyBadge = (current: boolean, dueSoon: boolean) => {
    if (current && !dueSoon) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Current
        </Badge>
      );
    }
    if (dueSoon) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Due Soon
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Expired
      </Badge>
    );
  };

  const getProgressValue = (expires: string | undefined) => {
    if (!expires) return 0;
    const expiresDate = new Date(expires);
    const now = new Date();
    const daysUntilExpiry = differenceInDays(expiresDate, now);
    const totalDays = 180; // 6 months for IPC, but we'll use a standard value for display
    return Math.max(0, Math.min(100, (daysUntilExpiry / totalDays) * 100));
  };

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
          <h1 className="text-4xl font-bold mb-2">Training Currency</h1>
          <p className="text-muted-foreground">
            Track your IPC and BFR currency status
          </p>
        </div>

        {currency && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Instrument Proficiency Check (IPC)
                  </CardTitle>
                  {getCurrencyBadge(currency.ipc_current, currency.ipc_due_soon)}
                </div>
              </CardHeader>
              <CardContent>
                {currency.ipc_expires ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expires: {format(new Date(currency.ipc_expires), 'PPP')}
                    </p>
                    <Progress value={getProgressValue(currency.ipc_expires)} />
                    {currency.ipc_due_soon && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        Your IPC expires in less than 60 days
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No IPC on record</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Biennial Flight Review (BFR)
                  </CardTitle>
                  {getCurrencyBadge(currency.bfr_current, currency.bfr_due_soon)}
                </div>
              </CardHeader>
              <CardContent>
                {currency.bfr_expires ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Expires: {format(new Date(currency.bfr_expires), 'PPP')}
                    </p>
                    <Progress value={getProgressValue(currency.bfr_expires)} />
                    {currency.bfr_due_soon && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                        Your BFR expires in less than 60 days
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No BFR on record</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Training History</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="py-12 text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No training records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{record.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {record.instructor_name}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(record.completed_at), 'PP')}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Expires: {format(new Date(record.expires_at), 'PPP')}
                      </p>
                      {record.notes && (
                        <p className="mt-2">{record.notes}</p>
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

export default Training;
