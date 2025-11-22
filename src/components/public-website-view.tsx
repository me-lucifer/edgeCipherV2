"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Cpu, Menu, View } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicWebsiteViewProps {
  onSwitchView: () => void;
}

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

function Header({ onSwitchView }: { onSwitchView: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-2">
        <Cpu className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold text-foreground">EdgeCipher</span>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleLinkClick(e, link.href)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="hidden md:flex items-center gap-4">
        <Button variant="ghost">Login</Button>
        <Button>Start Free</Button>
        <Button variant="link" onClick={onSwitchView} className="text-muted-foreground hover:text-foreground">
          <View className="mr-2 h-4 w-4" />
        </Button>
      </div>
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background/95 w-[280px]">
            <div className="flex flex-col h-full p-6">
                <div className="flex items-center gap-2 mb-8">
                    <Cpu className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold text-foreground">EdgeCipher</span>
                </div>
                <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                    <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                    {link.label}
                    </a>
                ))}
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <Button variant="ghost" size="lg">Login</Button>
                    <Button size="lg">Start Free</Button>
                </div>
                 <div className="mt-8">
                    <Button variant="link" onClick={onSwitchView} className="w-full justify-center text-muted-foreground hover:text-foreground">
                        <View className="mr-2 h-4 w-4" />
                        Switch view
                    </Button>
                </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function Section({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    return (
        <section id={id} className={cn("py-20 sm:py-24 lg:py-32", className)}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </section>
    )
}

function Hero() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center text-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 p-4">
            <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl">
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
    </div>
  );
}


function Footer() {
    return (
        <footer className="border-t border-border/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} EdgeCipher. All rights reserved.</p>
            </div>
        </footer>
    );
}

export function PublicWebsiteView({ onSwitchView }: PublicWebsiteViewProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header onSwitchView={onSwitchView} />
      <main>
        <Section id="home" className="pt-0">
          <Hero />
        </Section>
        <Section id="about">
            <h2 className="text-3xl font-bold text-center">About / Value Proposition</h2>
        </Section>
        <Section id="how-it-works" className="bg-muted/20">
             <h2 className="text-3xl font-bold text-center">How It Works</h2>
        </Section>
        <Section id="product">
             <h2 className="text-3xl font-bold text-center">Product Explainer</h2>
        </Section>
        <Section id="pricing" className="bg-muted/20">
             <h2 className="text-3xl font-bold text-center">Pricing</h2>
        </Section>
        <Section id="faq">
             <h2 className="text-3xl font-bold text-center">FAQ</h2>
        </Section>
        <Section id="contact" className="bg-muted/20">
             <h2 className="text-3xl font-bold text-center">Contact</h2>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

    