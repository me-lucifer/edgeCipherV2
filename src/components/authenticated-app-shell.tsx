
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/context/auth-provider';
import { LayoutDashboard, Bot, FileText, Gauge, BarChart, Settings, HelpCircle, Bell, UserCircle, LogOut, Cpu, PanelLeft, Book, BrainCircuit, LineChart, Newspaper, Users, Sparkles, Menu, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardModule } from './dashboard-module';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from './ui/separator';
import { ThemeSwitcher } from './theme-switcher';
import { AiCoachingModule } from './ai-coaching-module';
import { TradePlanningModule } from './trade-planning-module';
import { TradeJournalModule } from './trade-journal-module';
import { PerformanceAnalyticsModule } from './performance-analytics-module';
import { StrategyManagementModule } from './strategy-management-module';
import { RiskCenterModule } from './risk-center-module';
import { CryptoVixModule } from './crypto-vix-module';
import { NewsModule } from './news-module';
import { CommunityModule } from './community-module';
import { ProfileSettingsModule } from './profile-settings-module';
import { DashboardDemoHelper } from './dashboard-demo-helper';
import { Badge } from './ui/badge';
import { useEventLog } from '@/context/event-log-provider';

type Module = 
  | 'dashboard' 
  | 'aiCoaching' 
  | 'tradePlanning' 
  | 'tradeJournal'
  | 'analytics'
  | 'strategyManagement'
  | 'riskCenter'
  | 'cryptoVix'
  | 'news'
  | 'community'
  | 'settings';

interface NavItem {
  id: Module;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'aiCoaching', label: 'AI Coaching', icon: Bot },
  { id: 'tradePlanning', label: 'Trade Planning', icon: FileText },
  { id: 'tradeJournal', label: 'Trade Journal', icon: Book },
];

const analyticsNavItems: NavItem[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'strategyManagement', label: 'Strategy Mgmt', icon: BrainCircuit, comingSoon: false },
];

const marketNavItems: NavItem[] = [
  { id: 'riskCenter', label: 'Risk Center', icon: Gauge },
  { id: 'cryptoVix', label: 'Crypto VIX', icon: LineChart, comingSoon: false },
  { id: 'news', label: 'News', icon: Newspaper, comingSoon: false },
]

const communityNavItems: NavItem[] = [
    { id: 'community', label: 'Community', icon: Users, comingSoon: false },
]

const settingsNavItems: NavItem[] = [
    { id: 'settings', label: 'Settings', icon: Settings },
];

const NavItemGroup: React.FC<{
  items: NavItem[];
  currentModule: Module;
  isSidebarOpen?: boolean;
  onItemClick: (id: Module) => void;
}> = ({ items, currentModule, isSidebarOpen = true, onItemClick }) => (
    <>
        {items.map((item) => (
            <Tooltip key={item.id} delayDuration={0}>
                 <TooltipTrigger asChild>
                    <Button
                        variant={currentModule === item.id ? "secondary" : "ghost"}
                        onClick={() => onItemClick(item.id)}
                        className={cn(
                            "w-full justify-start gap-3",
                            !isSidebarOpen && "h-10 w-10 justify-center p-0"
                        )}
                        disabled={item.comingSoon}
                    >
                        <item.icon className={cn("h-5 w-5", currentModule === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {isSidebarOpen && <span>{item.label}</span>}
                        {item.comingSoon && isSidebarOpen && <span className="ml-auto text-xs text-muted-foreground/70">Soon</span>}
                    </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                    <TooltipContent side="right">
                        <p>{item.label}</p>
                        {item.comingSoon && <p className="text-xs text-muted-foreground">(Coming Soon)</p>}
                    </TooltipContent>
                )}
            </Tooltip>
        ))}
    </>
);


function ModuleView({ currentModule, onSetModule, aiCoachingInitialMessage, isLoading }: { currentModule: Module; onSetModule: (module: Module, context?: any) => void; aiCoachingInitialMessage: string | null; isLoading: boolean }) {
    if (currentModule === 'dashboard') {
        return <DashboardModule onSetModule={onSetModule} isLoading={isLoading} />;
    }

    if (currentModule === 'aiCoaching') {
      return <AiCoachingModule onSetModule={onSetModule} initialMessage={aiCoachingInitialMessage} />;
    }

    if (currentModule === 'tradePlanning') {
      return <TradePlanningModule onSetModule={onSetModule} />;
    }

    if (currentModule === 'tradeJournal') {
      return <TradeJournalModule onSetModule={onSetModule} />;
    }
    
    if (currentModule === 'analytics') {
      return <PerformanceAnalyticsModule onSetModule={onSetModule} />;
    }
    
    if (currentModule === 'strategyManagement') {
      return <StrategyManagementModule onSetModule={onSetModule} />;
    }

    if (currentModule === 'riskCenter') {
      return <RiskCenterModule onSetModule={onSetModule} />;
    }
    
    if (currentModule === 'cryptoVix') {
      return <CryptoVixModule onSetModule={onSetModule} />;
    }

    if (currentModule === 'news') {
        return <NewsModule onSetModule={onSetModule} />;
    }

    if (currentModule === 'community') {
        return <CommunityModule onSetModule={onSetModule} />;
    }

    if (currentModule === 'settings') {
      return <ProfileSettingsModule onSetModule={onSetModule} />;
    }

    const allNavItems = [...mainNavItems, ...analyticsNavItems, ...marketNavItems, ...communityNavItems, ...settingsNavItems];
    const item = allNavItems.find(item => item.id === currentModule);

    return (
        <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8 h-full">
            <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
                    {item && <item.icon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                    {item?.label} Module
                </h2>
                <p className="mt-2 text-muted-foreground">
                    This is a prototype placeholder for the {item?.label} module. This is where the dedicated interface for this feature will live.
                </p>
                {item?.comingSoon && (
                    <p className="mt-4 text-sm font-semibold text-primary/80">
                        This feature is coming soon!
                    </p>
                )}
            </div>
        </div>
    );
}

function AppHeader({ onSetModule }: { onSetModule: (module: Module) => void; }) {
  const { logout } = useAuth();
  const [persona, setPersona] = useState<{ primaryPersonaName?: string }>({});
  const [greeting, setGreeting] = useState("Welcome");
  const { toggleEventLog } = useEventLog();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
      if (personaData) {
        setPersona(JSON.parse(personaData));
      }
      
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-muted/20 px-4 sm:px-6">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-lg font-semibold text-foreground">
                    {greeting}, {persona.primaryPersonaName?.split(' ')[0] || 'Trader'}
                </h1>
                <p className="text-sm text-muted-foreground">Here's your mission control for disciplined trading.</p>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="hidden sm:flex cursor-help border-amber-500/50 text-amber-400">Prototype</Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p>This is a non-production prototype. Data is mocked or stored only in your browser. No real trading or live API calls happen here.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={toggleEventLog} aria-label="Toggle Event Log">
                            <Terminal className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Toggle Event Log (Ctrl + L)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>View notifications (prototype)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
                        <UserCircle className="h-9 w-9" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSetModule('settings')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSetModule('settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                         <HelpCircle className="mr-2 h-4 w-4" />
                        <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}

function SidebarNav({ currentModule, handleSetModule, isSidebarOpen }: { currentModule: Module, handleSetModule: (id: Module) => void, isSidebarOpen?: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-4 p-2">
      <div className="flex flex-col gap-1">
          <NavItemGroup items={mainNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
      </div>
      <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
      <div className="flex flex-col gap-1">
           <NavItemGroup items={analyticsNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
      </div>
      <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
      <div className="flex flex-col gap-1">
           <NavItemGroup items={marketNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
      </div>
      
      <div className="mt-auto flex flex-col gap-1">
          <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
          <NavItemGroup items={communityNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
          <NavItemGroup items={settingsNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
      </div>
    </nav>
  )
}

export function AuthenticatedAppShell() {
  const [currentModule, setCurrentModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiCoachingInitialMessage, setAiCoachingInitialMessage] = useState<string | null>(null);
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [isDemoHelperOpen, setDemoHelperOpen] = useState(false);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1200);

    const helperSeen = localStorage.getItem('ec_demo_helper_seen');
    if (!helperSeen) {
        setDemoHelperOpen(true);
        localStorage.setItem('ec_demo_helper_seen', 'true');
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '?' && e.shiftKey) {
            setDemoHelperOpen(prev => !prev);
        }
        
        // Handle navigation shortcuts
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }
        
        if (e.key === 'g' && !sequenceTimeoutRef.current) {
            sequenceTimeoutRef.current = setTimeout(() => {
                sequenceTimeoutRef.current = null;
            }, 1500); // 1.5 second window
        } else if (sequenceTimeoutRef.current) {
            const navMap: Record<string, Module> = {
                'd': 'dashboard',
                'a': 'aiCoaching',
                'p': 'tradePlanning',
                'j': 'tradeJournal',
                'r': 'riskCenter',
                'c': 'community',
                's': 'settings',
            };
            if (navMap[e.key]) {
                handleSetModule(navMap[e.key]);
                console.log(`Shortcut: Navigated to ${navMap[e.key]}`);
            }
            if (sequenceTimeoutRef.current) {
                clearTimeout(sequenceTimeoutRef.current);
                sequenceTimeoutRef.current = null;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        clearTimeout(timer);
        if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
        }
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSetModule = (id: Module, context?: any) => {
    setCurrentModule(id);
    setMobileNavOpen(false); // Close mobile nav on item click
    if (id === 'aiCoaching' && context?.initialMessage) {
        setAiCoachingInitialMessage(context.initialMessage);
    } else {
        setAiCoachingInitialMessage(null); // Clear message when navigating away or to coach without context
    }
  }

  return (
    <TooltipProvider>
    <div className="flex min-h-screen w-full bg-background">
        <aside className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/50 bg-muted/30 transition-all duration-300 md:flex",
            isSidebarOpen ? "w-64" : "w-20"
        )}>
            <div className={cn("flex h-16 items-center border-b border-border/50 px-6", !isSidebarOpen && "justify-center px-2")}>
                <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
                    <Cpu className="h-6 w-6 text-primary" />
                    {isSidebarOpen && <span>EdgeCipher</span>}
                </a>
            </div>
            
            <SidebarNav currentModule={currentModule} handleSetModule={handleSetModule} isSidebarOpen={isSidebarOpen} />

             <div className="border-t border-border/50 p-2">
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" onClick={() => setSidebarOpen(!isSidebarOpen)} className={cn("w-full justify-start gap-3 px-3", !isSidebarOpen && "h-10 w-10 justify-center p-0")} aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
                            <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                            {isSidebarOpen && <span className="text-sm">Collapse</span>}
                        </Button>
                    </TooltipTrigger>
                    {!isSidebarOpen && (
                        <TooltipContent side="right">
                            Expand sidebar
                        </TooltipContent>
                    )}
                </Tooltip>
            </div>
        </aside>
        
        <div className={cn(
            "flex flex-1 flex-col transition-all",
            isSidebarOpen ? "md:pl-64" : "md:pl-20"
        )}>
            <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-muted/20 px-4 sm:px-6">
                <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
                    <SheetTrigger asChild>
                         <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar menu">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                     <SheetContent side="left" className="w-64 p-0">
                        <div className="flex h-16 items-center border-b border-border/50 px-6">
                            <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
                                <Cpu className="h-6 w-6 text-primary" />
                                <span>EdgeCipher</span>
                            </a>
                        </div>
                        <SidebarNav currentModule={currentModule} handleSetModule={handleSetModule} />
                    </SheetContent>
                </Sheet>
                
                <div className="flex-1">
                    <AppHeader onSetModule={handleSetModule} />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-6xl h-full p-4 sm:p-6 lg:p-8">
                    <ModuleView 
                        currentModule={currentModule} 
                        onSetModule={handleSetModule} 
                        aiCoachingInitialMessage={aiCoachingInitialMessage}
                        isLoading={isInitialLoading && currentModule === 'dashboard'} 
                    />
                </div>
            </main>
        </div>
        <ThemeSwitcher />
         {currentModule === 'dashboard' && !isInitialLoading && (
            <DashboardDemoHelper isOpen={isDemoHelperOpen} onOpenChange={setDemoHelperOpen} />
        )}
    </div>
    </TooltipProvider>
  );
}
