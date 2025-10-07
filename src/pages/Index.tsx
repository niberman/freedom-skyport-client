import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Freedom Aviation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your aviation management system is ready to be built.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Supabase backend connected</p>
            <p>✅ Database tables created with RLS</p>
            <p>✅ GitHub integration active</p>
          </div>
          <div className="pt-4">
            <Button size="lg">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
