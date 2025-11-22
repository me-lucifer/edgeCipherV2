import { Button } from '@/components/ui/button';
import { View } from "lucide-react";

interface AdminAppViewProps {
  onSwitchView: () => void;
}

export function AdminAppView({ onSwitchView }: AdminAppViewProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <header className="fixed top-0 right-0 p-4 sm:p-6 lg:p-8">
        <Button variant="link" onClick={onSwitchView} className="text-muted-foreground hover:text-foreground">
          <View className="mr-2 h-4 w-4" />
          Switch view
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center text-center p-4">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            The admin dashboard prototype is coming soon.
          </p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            For now, please explore the Public Website view.
          </p>
        </div>
      </main>
    </div>
  );
}
