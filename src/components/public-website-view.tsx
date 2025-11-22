"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Cpu, Menu, View, Info, ShieldCheck, Video, CheckCircle2, BrainCircuit, FileText, Gauge, BarChart, ArrowRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from './theme-switcher';

interface PublicWebsiteViewProps {
  onSwitchView: () => void;
}

const navLinks = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#product', label: 'Product' },
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
                    EdgeCipher introduces Arjun, an <InfoTooltip text="A virtual coach that reviews your trades and behaviour to give you feedback and suggestions.">AI mentor</InfoTooltip> that analyzes your trades, psychology, and risk to help you become a disciplined, consistent <InfoTooltip text="Contracts that let you speculate on the future price of a cryptocurrency, often with leverage.">crypto futures</InfoTooltip> trader.
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
                                fill
                                style={{objectFit: 'cover'}}
                                className="opacity-30"
                                data-ai-hint={mentorCardImage.imageHint}
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

const ValueCard = ({ icon: Icon, title, description, tooltip, learnMore }: { icon: React.ElementType, title: string, description: string, tooltip?: string, learnMore?: boolean }) => (
    <Card className="bg-muted/30 border-border/50 transform-gpu transition-all hover:bg-muted/50 hover:border-primary/30">
        <CardContent className="p-6">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                        {tooltip ? <InfoTooltip text={tooltip}>{title}</InfoTooltip> : title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    {learnMore && (
                        <p className="text-xs text-primary/80 mt-2">Learn more in app →</p>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
);

function AboutSection() {
    const values = [
        {
            icon: BrainCircuit,
            title: "AI Coaching",
            description: "Personalized feedback on your trading patterns and psychology.",
            learnMore: true,
        },
        {
            icon: FileText,
            title: "Trade Planning",
            description: "Define your rules and setups for disciplined execution.",
            learnMore: true,
        },
        {
            icon: Gauge,
            title: "Risk Center",
            description: "Monitor your exposure and key metrics like max drawdown.",
            tooltip: "Max drawdown is the maximum observed loss from a peak to a trough of a portfolio.",
            learnMore: true,
        },
        {
            icon: BarChart,
            title: "Performance Analytics",
            description: "Go beyond P&L to understand your true trading performance.",
            learnMore: true,
        }
    ];

    return (
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Why EdgeCipher?</h2>
                <p className="text-lg text-muted-foreground">
                    EdgeCipher is your personal trading coach, not another signal group or auto-trading bot. We focus on building discipline, robust risk management, and a winning psychology for crypto futures traders.
                </p>
                <ul className="space-y-4">
                    {[
                        "Arjun, your AI mentor, learns from your own trade history.",
                        "Build and follow your trading rules, instead of chasing random setups.",
                        "Turn your trade journal into real insights, not just a spreadsheet.",
                        "Stay in control: EdgeCipher never executes trades, it only coaches you."
                    ].map((item, i) => (
                        <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-4">
                {values.map((value, i) => <ValueCard key={i} {...value} />)}
            </div>
        </div>
    );
}

function HowItWorksSection() {
    const steps = [
        {
            step: "01",
            title: "Sign up & tell us about your trading",
            description: "Create your account, describe your style (scalper, day trader, swing), and set your goals.",
            tooltip: "This initial information helps Arjun understand your starting point to provide truly personalized coaching."
        },
        {
            step: "02",
            title: "Connect or log your trades",
            description: "Connect your exchange or log trades manually. EdgeCipher never controls your capital—it only reads your history.",
            note: "Your API keys are read-only and encrypted. They are used for analysis only."
        },
        {
            step: "03",
            title: "Arjun analyzes your performance & psychology",
            description: "Arjun reviews your stats, patterns, and journal notes to highlight strengths, weak spots, and rule breaks.",
            hint: "No more guessing why you keep repeating the same mistakes."
        },
        {
            step: "04",
            title: "Get a plan & follow your rules",
            description: "You get clear rules, daily focus, and weekly reviews so you can become consistent over time.",
            hint: "The goal isn’t more trades. It’s better decisions."
        }
    ];

    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground">From your trades to clear, actionable coaching.</p>
            <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                {/* Desktop timeline arrows */}
                <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2">
                    <div className="flex justify-around max-w-3xl mx-auto">
                        <ArrowRight className="h-8 w-8 text-border/70" />
                        <ArrowRight className="h-8 w-8 text-border/70" />
                        <ArrowRight className="h-8 w-8 text-border/70" />
                    </div>
                </div>

                {steps.map((item, index) => (
                    <div key={index} className="relative z-10">
                        <Card className="h-full bg-muted/30 border-border/50 text-left">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center text-sm font-bold">
                                        {item.step}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground">
                                            {item.tooltip ? 
                                                <InfoTooltip text={item.tooltip}>{item.title}</InfoTooltip>
                                                : item.title
                                            }
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">{item.description}</p>
                                {item.note && (
                                    <p className="mt-3 text-xs text-muted-foreground/80 flex items-center gap-2">
                                        <Info className="h-3 w-3" />
                                        {item.note}
                                    </p>
                                )}
                                {item.hint && (
                                    <p className="mt-3 text-xs italic text-primary/80">"{item.hint}"</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductSection() {
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');
    const smallVideos = [
        {
            title: "Why most traders fail without a journal",
            tag: "Psychology",
            href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        {
            title: "How Arjun analyzes your trades",
            tag: "Journaling",
            href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        {
            title: "Using Risk Center to protect your account",
            tag: "Risk",
            href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        {
            title: "Turning emotions into data",
            tag: "Psychology",
            href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        },
        {
            title: "Advanced: Setting up trade plans",
            tag: "Discipline",
            href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
    ];

    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">See EdgeCipher in action</h2>
            <p className="mt-4 text-lg text-muted-foreground">Short videos on discipline, journaling, and how Arjun helps you grow.</p>
            
            <div className="mt-16 max-w-4xl mx-auto">
                <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/10">
                     <iframe
                        src="https://www.youtube.com/embed/j1Y-y3_gsgI?si=q8x5v1e7v3y7m1z0"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>

            <div className="mt-16">
                 <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {smallVideos.map((video, index) => (
                             <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <a href={video.href} target="_blank" rel="noopener noreferrer" className="block group">
                                    <Card className="h-full bg-muted/30 border-border/50 overflow-hidden transform-gpu transition-all hover:bg-muted/50 hover:border-primary/30 hover:-translate-y-1">
                                        <div className="relative aspect-video">
                                            {videoThumbnail && (
                                                 <Image
                                                    src={videoThumbnail.imageUrl}
                                                    alt={video.title}
                                                    fill
                                                    style={{objectFit: 'cover'}}
                                                    className="transition-transform duration-300 group-hover:scale-105"
                                                    data-ai-hint={videoThumbnail.imageHint}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <PlayCircle className="h-12 w-12 text-white/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-white" />
                                            </div>
                                        </div>
                                        <CardContent className="p-4">
                                            <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">{video.tag}</Badge>
                                            <p className="font-semibold text-foreground text-left">{video.title}</p>
                                        </CardContent>
                                    </Card>
                                </a>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="ml-12" />
                    <CarouselNext className="mr-12" />
                </Carousel>
            </div>
             <p className="mt-12 text-sm text-muted-foreground/80">
                These are public YouTube videos from the EdgeCipher channel. In the real product, they’ll be curated and updated automatically.
            </p>
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
            <AboutSection />
        </Section>
        <Section id="how-it-works" className="bg-muted/20">
             <HowItWorksSection />
        </Section>
        <Section id="product">
             <ProductSection />
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
      <ThemeSwitcher />
    </div>
  );
}
