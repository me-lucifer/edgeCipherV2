import { Button } from '@/components/ui/button';
import { View, Cpu } from "lucide-react";

interface PublicWebsiteViewProps {
  onSwitchView: () => void;
}

function Header({ onSwitchView }: { onSwitchView: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">EdgeCipher</span>
        </div>
        <Button variant="link" onClick={onSwitchView} className="text-muted-foreground hover:text-foreground">
          <View className="mr-2 h-4 w-4" />
          Switch view
        </Button>
    </header>
  );
}

function Hero() {
    return (
        <section className="relative flex h-screen w-full flex-col items-center justify-center text-center">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 p-4">
                <h1 className="text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-8xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Decentralized</span>
                    <br />
                    Security, Redefined.
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Welcome to the public landing page for EdgeCipher.
                    <br />
                    More sections coming soon.
                </p>
            </div>
        </section>
    );
}

export function PublicWebsiteView({ onSwitchView }: PublicWebsiteViewProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <Header onSwitchView={onSwitchView} />
      <main>
        <Hero />
      </main>
    </div>
  );
}
