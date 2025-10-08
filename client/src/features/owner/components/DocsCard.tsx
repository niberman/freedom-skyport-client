import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function DocsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Documents</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-center py-6 space-y-2">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Document storage coming soon
          </p>
          <p className="text-xs text-muted-foreground">
            Insurance, W&B, and maintenance logs will be accessible here
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
