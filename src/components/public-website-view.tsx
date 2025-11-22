"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Cpu, Menu, View, Info, ShieldCheck, Video, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card } from '@/components/ui/card';

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
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const headerOffset = 80; // height of the sticky header
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
      });
    }
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

function InfoTooltip({ text, children }: { text: string, children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5">
            {children}
            <Info className="h-4 w-4 text-muted-foreground/80 cursor-help" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-muted text-muted-foreground border-border">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Hero() {
  const mentorCardImage = PlaceHolderImages.find(p => p.id === 'mentor-card');

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                    AI mentor for crypto futures traders
                </p>
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                    Trade better, not more.
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                    EdgeCipher introduces Arjun, an <InfoTooltip text="a virtual coach that reviews your trades and behaviour to give you feedback and suggestions.">AI mentor</InfoTooltip> that analyzes your trades, psychology, and risk to help you become a disciplined, consistent <InfoTooltip text="contracts that let you speculate on the future price of a cryptocurrency, often with leverage.">crypto futures</InfoTooltip> trader.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                    <Button size="lg">Start Free</Button>
                    <Button size="lg" variant="ghost">
                        <Video className="mr-2 h-5 w-5" />
                        Watch Explainer Video
                    </Button>
                </div>
                 <div className="mt-8 flex items-center gap-x-6 gap-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>You keep control of your capital</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>No auto-trading, only coaching</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>For beginners & serious traders</span>
                    </div>
                </div>
            </div>
             <div className="relative flex items-center justify-center">
                <Card className="w-full max-w-sm transform-gpu transition-all duration-500 hover:rotate-3 hover:scale-105 bg-card/50 backdrop-blur-md border-primary/20 shadow-2xl shadow-primary/10">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">Arjun's Dashboard</h3>
                            {mentorCardImage && (
                                <Image
                                    src={mentorCardImage.imageUrl}
                                    alt="Arjun AI Mentor Avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full border-2 border-primary/50"
                                    data-ai-hint={mentorCardImage.imageHint}
                                />
                            )}
                        </div>
                        <div className="relative h-48 w-full rounded-lg overflow-hidden border border-border/20">
                           {mentorCardImage && (
                             <Image
                                src={mentorCardImage.imageUrl}
                                alt="Mini dashboard preview"
                                layout="fill"
                                objectFit="cover"
                                className="opacity-30"
                                data-ai-hint={mentorCardİmage.imageHint}
                              />
                           )}
                           <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent p-4 flex items-end">
                                <p className="text-sm text-muted-foreground">Performance analytics appear here...</p>
                           </div>
                        </div>
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Arjun says:</span> Your risk-to-reward ratio on recent trades is improving. Keep it up!
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
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
        <Section id="home" className="pt-0 -mt-20">
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
