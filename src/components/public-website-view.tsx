"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Cpu, Menu, View, Info, ShieldCheck, Video, CheckCircle2, BrainCircuit, FileText, Gauge, BarChart, ArrowRight, PlayCircle, Youtube, Linkedin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from './theme-switcher';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthModal, type AuthModalTab } from './auth-modal';
import { LoggedInDropdown } from './logged-in-dropdown';
import { TopBanner } from './top-banner';
import { DashboardPlaceholder } from './dashboard-placeholder';

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

function handleScrollTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
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
};

function Header({ 
  onSwitchView, 
  isLoggedIn, 
  onLogout, 
  onShowDashboard, 
  onAuthOpen 
}: { 
  onSwitchView: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onShowDashboard: () => void;
  onAuthOpen: (tab: AuthModalTab) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleScrollTo(e, href);
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
        {isLoggedIn ? (
          <LoggedInDropdown onLogout={onLogout} onShowDashboard={onShowDashboard} />
        ) : (
          <>
            <Button variant="ghost" onClick={() => onAuthOpen('login')}>Login</Button>
            <Button onClick={() => onAuthOpen('signup')}>Start Free</Button>
          </>
        )}
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
                  {isLoggedIn ? (
                    <>
                      <Button size="lg" variant="outline" onClick={() => { onShowDashboard(); setIsOpen(false); }}>Dashboard</Button>
                      <Button size="lg" onClick={() => { onLogout(); setIsOpen(false); }}>Logout</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="lg" onClick={() => { onAuthOpen('login'); setIsOpen(false); }}>Login</Button>
                      <Button size="lg" onClick={() => { onAuthOpen('signup'); setIsOpen(false); }}>Start Free</Button>
                    </>
                  )}
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

function Hero({ onAuthOpen }: { onAuthOpen: (tab: AuthModalTab) => void }) {
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
                    <Button size="lg" onClick={() => onAuthOpen('signup')}>Start Free</Button>
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

const PricingCard = ({
    badge,
    title,
    price,
    features,
    ctaText,
    ctaVariant = "default",
    highlighted = false,
    onClickCta
}: {
    badge?: string,
    title: string,
    price: string,
    features: string[],
    ctaText: string,
    ctaVariant?: "default" | "outline",
    highlighted?: boolean,
    onClickCta: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => (
    <Card className={cn(
        "flex flex-col",
        highlighted ? "border-primary/50 shadow-xl shadow-primary/10" : "border-border/50 bg-muted/30"
    )}>
        <CardHeader className="relative">
            {badge && (
                <Badge 
                    variant={highlighted ? "default" : "secondary"}
                    className={cn(
                        "absolute top-0 -translate-y-1/2 left-6",
                         highlighted ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-foreground"
                    )}
                >
                    {badge}
                </Badge>
            )}
            <CardTitle>{title}</CardTitle>
            <p className="text-3xl font-bold pt-2">{price}</p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
            <ul className="space-y-3 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
        <div className="p-6 pt-0">
            <Button onClick={onClickCta} className="w-full" variant={highlighted ? 'default' : 'outline'} size="lg">
                {ctaText}
            </Button>
        </div>
    </Card>
);

function PricingSection({ onAuthOpen }: { onAuthOpen: (tab: AuthModalTab) => void }) {
    const plans = [
        {
            badge: "Best for beginners",
            title: "Starter",
            price: "$0 / month",
            features: [
                "AI coaching on limited recent trades",
                "Manual trade journaling",
                "Basic performance analytics",
                "Access to public community",
            ],
            ctaText: "Start Free",
            ctaVariant: "outline",
            action: () => onAuthOpen('signup')
        },
        {
            badge: "Most popular",
            title: "Pro Trader",
            price: "$39 / month",
            features: [
                "Full performance analytics & filters",
                "Deeper psychology insights from Arjun",
                "Risk Center with custom rules & alerts",
                "Priority updates & new features"
            ],
            ctaText: "Get Pro",
            highlighted: true,
            action: () => onAuthOpen('signup')
        },
        {
            badge: "Coming soon",
            title: "Team / Mentor",
            price: "Let's talk",
            features: [
                "For trading groups, mentors, and communities",
                "Multiple accounts under one view",
                "Custom onboarding & support"
            ],
            ctaText: "Contact Sales",
            ctaVariant: "outline",
            action: (e: React.MouseEvent<HTMLButtonElement>) => {
              const el = e.target as HTMLElement;
              const anchor = document.createElement('a');
              anchor.href = "#contact";
              handleScrollTo(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }) as unknown as React.MouseEvent<HTMLAnchorElement>, '#contact');
            }
        }
    ];

    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start free. Upgrade when you’re ready to go deeper.</p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, i) => (
                    <PricingCard 
                        key={i} 
                        badge={plan.badge}
                        title={plan.title}
                        price={plan.price}
                        features={plan.features}
                        ctaText={plan.ctaText}
                        highlighted={plan.highlighted}
                        onClickCta={plan.action}
                    />
                ))}
            </div>
            <p className="mt-12 text-sm text-muted-foreground/80">
                No auto-trading. EdgeCipher never touches your capital — it only coaches you.
            </p>
        </div>
    );
}

function FaqSection() {
    const faqs = [
        {
            question: "Is EdgeCipher a signal group or auto-trading bot?",
            answer: "No. EdgeCipher does not give ‘buy/sell now’ signals and it never executes trades on your behalf. It’s an AI coach that helps you understand your own performance, risk, and behaviour."
        },
        {
            question: "Do I have to be an experienced trader to use EdgeCipher?",
            answer: "Not at all. Many users are beginners. You can start by manually logging trades, learning the basics, and using Arjun to understand your patterns and mistakes."
        },
        {
            question: "Does EdgeCipher have access to my money?",
            answer: "No. When you connect an exchange or broker in the real product, you use read-only API keys. EdgeCipher only reads your trade history to analyze it and never controls your capital."
        },
        {
            question: "Can I use EdgeCipher without connecting my broker?",
            answer: "Yes. You can manually log your trades and still get journaling, analytics, and AI coaching based on the data you provide."
        },
        {
            question: "Is this financial advice?",
            answer: "No. EdgeCipher is an educational and analytical tool. It helps you reflect, plan, and analyze your own decisions, but it does not provide personalized investment advice."
        },
        {
            question: "Which markets does EdgeCipher support?",
            answer: "The initial focus is on crypto futures. Over time, more instruments and platforms may be added based on user demand."
        }
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Frequently asked questions</h2>
                <p className="mt-4 text-lg text-muted-foreground">If you’re new to crypto trading or AI coaching, you’re in the right place.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
                        <AccordionTrigger className="text-left hover:no-underline">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
             <p className="mt-12 text-center text-sm text-muted-foreground/80">
                Still have questions? Scroll to Contact or reach out via email.
            </p>
        </div>
    );
}

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  topic: z.enum(["general", "pricing", "partnership", "bug"]),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
  isNewTrader: z.boolean().default(false),
});

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      topic: "general",
      message: "",
      isNewTrader: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (typeof window !== 'undefined') {
      localStorage.setItem("ec_contact_last", JSON.stringify(values));
    }
    setSubmitted(true);
    form.reset();
  }
  
  if (submitted) {
    return (
      <Card className="bg-muted/30 border-primary/30">
        <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">Thanks for reaching out!</h3>
            <p className="mt-2 text-muted-foreground">
                In the real app, the team would receive your message. For this prototype, we’ve saved your submission locally.
            </p>
             <Button onClick={() => setSubmitted(false)} className="mt-6">Send another message</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General question</SelectItem>
                  <SelectItem value="pricing">Pricing / plans</SelectItem>
                  <SelectItem value="partnership">Partnership / team</SelectItem>
                  <SelectItem value="bug">Bug / feedback</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea placeholder="How can we help?" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isNewTrader"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>I'm a new trader and might need extra guidance.</FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full">Send Message</Button>
      </form>
    </Form>
  )
}

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
)

function ContactSection() {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact us</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">We’ll be happy to hear from you, whether you’re a beginner or a prop firm.</p>

            <div className="mt-16 grid lg:grid-cols-2 gap-12 text-left">
                <div>
                    <ContactForm />
                </div>
                <div className="space-y-8">
                     <div className="p-6 rounded-lg bg-muted/30 border border-border/50">
                        <h3 className="font-semibold text-foreground">Response Times</h3>
                        <p className="text-muted-foreground mt-2 text-sm">We aim to respond within 24-48 business hours in the real product. For this prototype, your message is stored in your browser's local storage.</p>
                     </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Other ways to reach us</h3>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <Mail className="h-5 w-5 text-primary" />
                            <a href="mailto:support@edgecipher.com" className="hover:text-foreground">support@edgecipher.com (placeholder)</a>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="font-semibold text-foreground">Follow us</h3>
                        <div className="flex items-center gap-4">
                           <a href="#" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "text-muted-foreground hover:text-foreground")}>
                                <Youtube className="h-5 w-5" />
                                <span className="sr-only">YouTube</span>
                           </a>
                           <a href="#" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "text-muted-foreground hover:text-foreground")}>
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">X (Twitter)</span>
                           </a>
                            <a href="#" className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), "text-muted-foreground hover:text-foreground")}>
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                           </a>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

function Footer() {
    const footerNavLinks = [
        { href: '#home', label: 'Home' },
        { href: '#how-it-works', label: 'How it works' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#faq', label: 'FAQ' },
        { href: '#contact', label: 'Contact' },
    ];

    const legalLinks = [
        { href: '#', label: 'Terms of Use' },
        { href: '#', label: 'Privacy Policy' },
    ];
    
    return (
        <footer className="bg-muted/20 border-t border-border/50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-4 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2">
                            <Cpu className="h-6 w-6 text-primary" />
                            <span className="text-xl font-bold text-foreground">EdgeCipher</span>
                        </div>
                        <p className="text-muted-foreground text-sm max-w-xs">
                            AI-powered coaching for crypto futures traders.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                           <a href="#" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-muted-foreground hover:text-foreground h-8 w-8")}>
                                <Youtube className="h-5 w-5" />
                                <span className="sr-only">YouTube</span>
                           </a>
                           <a href="#" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-muted-foreground hover:text-foreground h-8 w-8")}>
                                <XIcon className="h-5 w-5" />
                                <span className="sr-only">X (Twitter)</span>
                           </a>
                            <a href="#" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-muted-foreground hover:text-foreground h-8 w-8")}>
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                           </a>
                        </div>
                    </div>

                    {/* Center Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Quick Links</h4>
                        <ul className="space-y-2">
                            {footerNavLinks.map(link => (
                                <li key={link.href}>
                                    <a 
                                        href={link.href} 
                                        onClick={(e) => handleScrollTo(e, link.href)} 
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Legal</h4>
                        <ul className="space-y-2">
                            {legalLinks.map(link => (
                                <li key={link.href}>
                                    <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 text-sm text-muted-foreground space-y-4">
                    <p>
                        Trading involves risk. EdgeCipher is an educational and analytical tool and does not provide financial advice or guarantee profits.
                    </p>
                    <p>
                        &copy; {new Date().getFullYear()} EdgeCipher. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export function PublicWebsiteView({ onSwitchView }: PublicWebsiteViewProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('signup');
  const [showBanner, setShowBanner] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ec_auth');
      if (token) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleAuthOpen = (tab: AuthModalTab) => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setIsLoggedIn(true);
    setShowBanner(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ec_auth');
    }
    setIsLoggedIn(false);
    setShowBanner(false);
  };

  if (showDashboard) {
    return <DashboardPlaceholder onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background text-foreground">
      {showBanner && <TopBanner />}
      <Header 
        onSwitchView={onSwitchView}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onShowDashboard={() => setShowDashboard(true)}
        onAuthOpen={handleAuthOpen}
      />
      <main>
        <Section id="home" className="pt-0 lg:-mt-20">
          <Hero onAuthOpen={handleAuthOpen} />
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
             <PricingSection onAuthOpen={handleAuthOpen} />
        </Section>
        <Section id="faq">
             <FaqSection />
        </Section>
        <Section id="contact" className="bg-muted/20">
             <ContactSection />
        </Section>
      </main>
      <Footer />
      <ThemeSwitcher />
      <AuthModal 
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        defaultTab={authModalTab}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
