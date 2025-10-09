---
to: src/features/<%= nameParam %>/<%= namePascal %>.tsx
---
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function <%= namePascal %>() {
  return (
    <Card>
      <CardHeader><CardTitle><%= namePascal %></CardTitle></CardHeader>
      <CardContent>
        <p>TODO: build this feature.</p>
      </CardContent>
    </Card>
  );
}