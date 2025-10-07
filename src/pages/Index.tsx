import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Wrench, Shield } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src="https://storage.googleapis.com/gpt-engineer-file-uploads/IpqYjiQoApct98b0kk7EtZ5ZRvi1/uploads/1759857305366-Screenshot 2025-09-19 at 10.34.45 AM.png" alt="Freedom Aviation Logo" className="h-32 w-auto" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Freedom Aviation</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">Premium aircraft management and flight instruction across Colorado</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-lg border bg-card">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Easy Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Book flights and training sessions with our intuitive calendar system
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <Wrench className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aircraft Services</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive maintenance and detailing services for your aircraft
            </p>
          </div>
          <div className="text-center p-6 rounded-lg border bg-card">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Professional Training</h3>
            <p className="text-sm text-muted-foreground">
              Experienced instructors for IPC, BFR, and advanced ratings
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;