import type { View } from '@/components/view-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ViewSelectorProps {
  onSelectView: (view: View) => void;
}

export function ViewSelector({ onSelectView }: ViewSelectorProps) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          EdgeCipher
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Which view do you want to preview?
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
        <Card
          onClick={() => onSelectView('website')}
          className="group cursor-pointer transform-gpu border-border/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span>Public Website</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
             <CardDescription>
                View the landing page and public-facing marketing content.
              </CardDescription>
          </CardContent>
        </Card>

        <Card
          onClick={() => onSelectView('admin')}
          className="group cursor-pointer transform-gpu border-border/50 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span>Admin App</span>
               <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
            </CardTitle>
          </CardHeader>
           <CardContent>
             <CardDescription>
                (Coming Soon) A placeholder for the future admin dashboard.
              </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
