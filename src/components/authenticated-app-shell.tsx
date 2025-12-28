
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
import { LayoutDashboard, Bot, FileText, Gauge, BarChart, Settings, HelpCircle, Bell, UserCircle, LogOut, Cpu, PanelLeft, Book, BrainCircuit, LineChart, Newspaper, Users, Sparkles, Menu, Terminal, AlertTriangle, ArrowRight, BarChartHorizontal } from 'lucide-react';
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
import { AiCoachingModule } from './ai-coaching-module';
import { TradePlanningModule } from './trade-planning-module';
import { TradeJournalModule, useJournal, type JournalFilters } from './trade-journal-module';
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
import { DemoControls } from './demo-controls';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChartModule } from './chart-module';

export type Module = 
  | 'dashboard' 
  | 'aiCoaching' 
  | 'tradePlanning' 
  | 'tradeJournal'
  | 'chart'
  | 'analytics'
  | 'strategyManagement'
  | 'riskCenter'
  | 'cryptoVix'
  | 'news'
  | 'community'
  | 'settings';

export interface ModuleContext {
    initialMessage?: string;
    draftId?: string;
    filters?: Partial<JournalFilters>;
    planContext?: {
      instrument: string;
      direction?: 'Long' | 'Short';
      origin: string;
    }
}

interface NavItem {
  id: Module;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
  badgeCount?: number;
}

const mainNavItems: (pendingJournalCount: number) => NavItem[] = (pendingJournalCount) => [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'aiCoaching', label: 'AI Coaching', icon: Bot },
  { id: 'tradePlanning', label: 'Trade Planning', icon: FileText },
  { id: 'tradeJournal', label: 'Trade Journal', icon: Book, badgeCount: pendingJournalCount },
];

const analyticsNavItems: NavItem[] = [
  { id: 'chart', label: 'Chart', icon: BarChartHorizontal, comingSoon: false },
  { id: 'analytics', label: 'Performance Analytics', icon: BarChart },
  { id: 'strategyManagement', label: 'Strategy Management', icon: BrainCircuit, comingSoon: false },
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
                            "w-full justify-start gap-3 relative",
                            !isSidebarOpen && "h-10 w-10 justify-center p-0"
                        )}
                        disabled={item.comingSoon}
                    >
                        <item.icon className={cn("h-5 w-5", currentModule === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {isSidebarOpen && <span>{item.label}</span>}
                        {item.comingSoon && isSidebarOpen && <span className="ml-auto text-xs text-muted-foreground/70">Soon</span>}
                         {isSidebarOpen && item.badgeCount && item.badgeCount > 0 && (
                            <Badge className="ml-auto bg-amber-500/80 text-white hover:bg-amber-500">
                                {item.badgeCount > 9 ? '9+' : item.badgeCount}
                            </Badge>
                        )}
                         {!isSidebarOpen && item.badgeCount && item.badgeCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{item.label}</p>
                    {item.comingSoon && <p className="text-xs text-muted-foreground">(Coming Soon)</p>}
                    {item.badgeCount && item.badgeCount > 0 && <p className="text-xs text-amber-400">{item.badgeCount} trades pending journaling</p>}
                </TooltipContent>
            </Tooltip>
        ))}
    </>
);


function ModuleView({ currentModule, onSetModule, moduleContext, isLoading, journalEntries, updateJournalEntry }: { currentModule: Module; onSetModule: (module: Module, context?: ModuleContext) => void; moduleContext: ModuleContext | null; isLoading: boolean, journalEntries: any[], updateJournalEntry: (entry: any) => void }) {
    if (currentModule === 'dashboard') {
        return <DashboardModule onSetModule={onSetModule} isLoading={isLoading} />;
    }

    if (currentModule === 'aiCoaching') {
      return <AiCoachingModule onSetModule={onSetModule} initialMessage={moduleContext?.initialMessage || null} />;
    }

    if (currentModule === 'tradePlanning') {
      return <TradePlanningModule onSetModule={onSetModule} planContext={moduleContext?.planContext} />;
    }

    if (currentModule === 'tradeJournal') {
      return <TradeJournalModule onSetModule={onSetModule} draftId={moduleContext?.draftId} filters={moduleContext?.filters} journalEntries={journalEntries} updateJournalEntry={updateJournalEntry} />;
    }
    
    if (currentModule === 'chart') {
      return <ChartModule onSetModule={onSetModule} planContext={moduleContext?.planContext} />;
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

    const allNavItems = [...mainNavItems(0), ...analyticsNavItems, ...marketNavItems, ...communityNavItems, ...settingsNavItems];
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

function AppHeader({ onSetModule, onOpenMobileNav }: { onSetModule: (module: Module) => void; onOpenMobileNav: () => void; }) {
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
            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onOpenMobileNav} aria-label="Open sidebar menu">
                <Menu className="h-6 w-6" />
            </Button>
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

function SidebarNav({ currentModule, handleSetModule, isSidebarOpen, pendingJournalCount }: { currentModule: Module, handleSetModule: (id: Module) => void, isSidebarOpen?: boolean, pendingJournalCount: number }) {
  return (
    <nav className="flex flex-1 flex-col gap-4 p-2">
      <div className="flex flex-col gap-1">
          <NavItemGroup items={mainNavItems(pendingJournalCount)} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleSetModule} />
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

function PendingJournalBanner({ onOpenJournal }: { onOpenJournal: () => void }) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-amber-900/90 backdrop-blur-sm border-t border-amber-500/30 text-amber-200 p-4 transform-gpu transition-all animate-in slide-in-from-bottom-12">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <div>
                        <p className="font-semibold text-amber-300">You have unjournaled trades.</p>
                        <p className="text-sm text-amber-300/80 hidden sm:block">Arjun recommends finishing your journal before taking new trades.</p>
                    </div>
                </div>
                 <Button variant="outline" size="sm" onClick={onOpenJournal} className="bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30 hover:text-amber-100">
                    Open Trade Journal <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export function AuthenticatedAppShell() {
  const [currentModule, setCurrentModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [moduleContext, setModuleContext] = useState<ModuleContext | null>(null);
  const [isInitialLoading, setInitialLoading] = useState(true);
  const [isDemoHelperOpen, setDemoHelperOpen] = useState(false);
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showJournalLockout, setShowJournalLockout] = useState(false);
  const [pendingNav, setPendingNav] = useState<{ id: Module, context?: ModuleContext } | null>(null);

  const { entries: journalEntries, updateEntry: updateJournalEntry } = useJournal();
  const pendingJournalCount = journalEntries.filter(e => e.status === 'pending').length;
  const hasPendingJournals = pendingJournalCount > 0;

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
        
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            return;
        }
        
        if (e.key === 'g' && !sequenceTimeoutRef.current) {
            sequenceTimeoutRef.current = setTimeout(() => {
                sequenceTimeoutRef.current = null;
            }, 1500);
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

    const handleStartDisciplineDemo = () => {
        handleSetModule('chart', { planContext: { instrument: 'BTC-PERP', origin: 'Discipline Demo' } });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('start-discipline-demo', handleStartDisciplineDemo);

    return () => {
        clearTimeout(timer);
        if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current);
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('start-discipline-demo', handleStartDisciplineDemo);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateTo = (id: Module, context?: ModuleContext) => {
    setCurrentModule(id);
    setMobileNavOpen(false);
    setModuleContext(context || null);
    if(id !== 'tradePlanning') {
      // Clear context if not navigating to trade planning
      setModuleContext(current => current ? { ...current, planContext: undefined } : null);
    }
  };

  const handleSetModule = (id: Module, context?: ModuleContext) => {
    if (id === 'tradePlanning' && pendingJournalCount >= 3) {
      setPendingNav({ id, context });
      setShowJournalLockout(true);
    } else {
      navigateTo(id, context);
    }
  }

  const handleOpenJournal = () => {
    handleSetModule('tradeJournal');
  }
  
  const handleContinueToPlanning = () => {
      if (pendingNav) {
          navigateTo(pendingNav.id, pendingNav.context);
      }
      setShowJournalLockout(false);
      setPendingNav(null);
  };

  return (
    <TooltipProvider>
      <AlertDialog open={showJournalLockout} onOpenChange={setShowJournalLockout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Too many unjournaled trades</AlertDialogTitle>
            <AlertDialogDescription>
              Arjun recommends journaling your recent trades before planning new ones. Skipping this step makes it harder to improve.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNav(null)}>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleContinueToPlanning}>
                Continue anyway (Prototype)
            </Button>
            <AlertDialogAction onClick={() => {
              setShowJournalLockout(false);
              setPendingNav(null);
              navigateTo('tradeJournal');
            }}>
              Go to Journal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
              
              <SidebarNav currentModule={currentModule} handleSetModule={handleSetModule} isSidebarOpen={isSidebarOpen} pendingJournalCount={pendingJournalCount} />

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
              "flex flex-1 flex-col transition-all duration-300",
              isSidebarOpen ? "md:pl-64" : "md:pl-20"
          )}>
              <AppHeader onSetModule={handleSetModule} onOpenMobileNav={() => setMobileNavOpen(true)} />
              
              <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetContent side="left" className="w-64 p-0">
                      <div className="flex h-16 items-center border-b border-border/50 px-6">
                          <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
                              <Cpu className="h-6 w-6 text-primary" />
                              <span>EdgeCipher</span>
                          </a>
                      </div>
                      <SidebarNav currentModule={currentModule} handleSetModule={handleSetModule} pendingJournalCount={pendingJournalCount} />
                  </SheetContent>
              </Sheet>

              <main className="flex-1 overflow-y-auto">
                  <div className="mx-auto max-w-7xl h-full p-4 sm:p-6 lg:p-8">
                      <ModuleView 
                          currentModule={currentModule} 
                          onSetModule={handleSetModule} 
                          moduleContext={moduleContext}
                          isLoading={isInitialLoading && currentModule === 'dashboard'} 
                          journalEntries={journalEntries}
                          updateJournalEntry={updateJournalEntry}
                      />
                  </div>
              </main>
          </div>
          {(currentModule === 'dashboard' || currentModule === 'chart') && <DemoControls />}
          {currentModule === 'dashboard' && !isInitialLoading && (
              <DashboardDemoHelper isOpen={isDemoHelperOpen} onOpenChange={setDemoHelperOpen} />
          )}
          {hasPendingJournals && <PendingJournalBanner onOpenJournal={handleOpenJournal} />}
      </div>
    </TooltipProvider>
  );
}
