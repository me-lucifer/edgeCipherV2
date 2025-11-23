
"use client";

import React, { useState, useEffect } from 'react';
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
import { LayoutDashboard, Bot, FileText, Gauge, BarChart, Settings, HelpCircle, Bell, UserCircle, LogOut, Cpu, PanelLeft, Book, BrainCircuit, LineChart, Newspaper, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardPlaceholder } from './dashboard-placeholder';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from './ui/separator';

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
  { id: 'strategyManagement', label: 'Strategy Mgmt', icon: BrainCircuit, comingSoon: true },
];

const marketNavItems: NavItem[] = [
  { id: 'riskCenter', label: 'Risk Center', icon: Gauge },
  { id: 'cryptoVix', label: 'Crypto VIX', icon: LineChart, comingSoon: true },
  { id: 'news', label: 'News', icon: Newspaper, comingSoon: true },
]

const communityNavItems: NavItem[] = [
    { id: 'community', label: 'Community', icon: Users, comingSoon: true },
    { id: 'settings', label: 'Settings', icon: Settings },
]

const NavItemGroup: React.FC<{
  items: NavItem[];
  currentModule: Module;
  isSidebarOpen: boolean;
  onItemClick: (id: Module) => void;
}> = ({ items, currentModule, isSidebarOpen, onItemClick }) => (
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
                <TooltipContent side="right">
                    <p>{item.label}</p>
                    {item.comingSoon && <p className="text-xs text-muted-foreground">(Coming Soon)</p>}
                </TooltipContent>
            </Tooltip>
        ))}
    </>
);


function ModuleView({ currentModule }: { currentModule: Module }) {
    if (currentModule === 'dashboard') {
        return <DashboardPlaceholder />;
    }

    const item = [...mainNavItems, ...analyticsNavItems, ...marketNavItems, ...communityNavItems].find(item => item.id === currentModule);

    return (
        <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-border">
                    {item && <item.icon className="h-8 w-8 text-muted-foreground" />}
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                    {item?.label}
                </h2>
                <p className="mt-2 text-muted-foreground">
                    This module is under construction.
                </p>
                {item?.comingSoon && (
                    <p className="mt-1 text-sm text-primary">
                        This feature is coming soon!
                    </p>
                )}
            </div>
        </div>
    );
}

function AppHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { logout } = useAuth();
  const [persona, setPersona] = useState<{ primaryPersonaName?: string }>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const personaData = localStorage.getItem("ec_persona_final") || localStorage.getItem("ec_persona_base");
      if (personaData) {
        setPersona(JSON.parse(personaData));
      }
    }
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 bg-muted/20 px-4 sm:px-6">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="d-block md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <div>
                <h1 className="text-lg font-semibold text-foreground">
                    Welcome, {persona.primaryPersonaName || 'Trader'}
                </h1>
                <p className="text-sm text-muted-foreground">Here's your mission control for disciplined trading.</p>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <UserCircle className="h-9 w-9" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => alert('Profile page coming soon!')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => alert('Settings page coming soon!')}>
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

export function AuthenticatedAppShell() {
  const [currentModule, setCurrentModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleItemClick = (id: Module) => {
    setCurrentModule(id);
  }

  return (
    <TooltipProvider>
    <div className="flex min-h-screen w-full bg-background">
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-border/50 bg-muted/30 transition-all duration-300 md:flex",
            isSidebarOpen ? "w-64" : "w-20"
        )}>
            <div className={cn("flex h-16 items-center border-b border-border/50 px-6", !isSidebarOpen && "justify-center px-2")}>
                <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
                    <Cpu className="h-6 w-6 text-primary" />
                    {isSidebarOpen && <span>EdgeCipher</span>}
                </a>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="ml-auto h-8 w-8 hidden">
                            <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    </TooltipContent>
                </Tooltip>
            </div>
            
            <nav className="flex flex-1 flex-col gap-4 p-2">
                <div className="flex flex-col gap-1">
                    <NavItemGroup items={mainNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleItemClick} />
                </div>
                <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
                <div className="flex flex-col gap-1">
                     <NavItemGroup items={analyticsNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleItemClick} />
                </div>
                <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
                <div className="flex flex-col gap-1">
                     <NavItemGroup items={marketNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleItemClick} />
                </div>
                
                <div className="mt-auto flex flex-col gap-1">
                    <Separator className={cn('my-2', !isSidebarOpen && 'mx-auto w-1/2')} />
                    <NavItemGroup items={communityNavItems} currentModule={currentModule} isSidebarOpen={isSidebarOpen} onItemClick={handleItemClick} />
                </div>
            </nav>

             <div className="border-t border-border/50 p-2">
                 <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" onClick={() => setSidebarOpen(!isSidebarOpen)} className={cn("w-full justify-center", !isSidebarOpen && "h-10 w-10 p-0")}>
                            <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                            <span className={cn("sr-only", isSidebarOpen && "not-sr-only ml-2")}>Collapse</span>
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
            <AppHeader onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto">
                <ModuleView currentModule={currentModule} />
            </main>
        </div>
    </div>
    </TooltipProvider>
  );
}
