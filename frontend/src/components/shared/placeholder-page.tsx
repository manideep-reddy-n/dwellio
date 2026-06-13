import { PageTransition } from "@/components/shared/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  phase: string;
  description: string;
}

export function PlaceholderPage({ title, phase, description }: PlaceholderPageProps) {
  return (
    <PageTransition>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Card className="mt-6 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">{phase}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
