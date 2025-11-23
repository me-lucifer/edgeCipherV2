
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
import { LayoutDashboard, Bot, FileText, Gauge, BarChart, Settings, HelpCircle, Bell, UserCircle, LogOut, Cpu, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardPlaceholder } from './dashboard-placeholder';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Module = 'dashboard' | 'aiCoaching' | 'tradePlanning' | 'riskCenter' | 'analytics';

const navItems: { id: Module; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'aiCoaching', label: 'AI Coaching', icon: Bot },
  { id: 'tradePlanning', label: 'Trade Planning', icon: FileText },
  { id: 'riskCenter', label: 'Risk Center', icon: Gauge },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
];

function ModuleView({ currentModule }: { currentModule: Module }) {
    if (currentModule === 'dashboard') {
        return <DashboardPlaceholder />;
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                    {navItems.find(item => item.id === currentModule)?.label}
                </h2>
                <p className="mt-2 text-muted-foreground">
                    This module is under construction.
                </p>
            </div>
        </div>
    );
}

function AppHeader() {
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
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-muted/20 px-4 sm:px-6 lg:px-8">
        <div>
            <h1 className="text-lg font-semibold text-foreground">
                Welcome, {persona.primaryPersonaName || 'Trader'}
            </h1>
            <p className="text-sm text-muted-foreground">Here's your mission control for disciplined trading.</p>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <UserCircle className="h-8 w-8" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
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

  return (
    <TooltipProvider>
    <div className={cn(
        "flex min-h-screen w-full bg-background transition-all",
        isSidebarOpen ? "md:pl-64" : "md:pl-20"
    )}>
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-border/50 bg-muted/30 transition-all duration-300 md:flex",
            isSidebarOpen ? "w-64" : "w-20"
        )}>
            <div className={cn("flex h-16 items-center border-b border-border/50 px-6", !isSidebarOpen && "justify-center px-2")}>
                <a href="#" className="flex items-center gap-2 font-semibold text-foreground">
                    <Cpu className="h-6 w-6 text-primary" />
                    {isSidebarOpen && <span>EdgeCipher</span>}
                </a>
            </div>
            <nav className="flex flex-col gap-2 p-4">
                {navItems.map((item) => (
                    <Tooltip key={item.id} delayDuration={0}>
                         <TooltipTrigger asChild>
                            <Button
                                variant={currentModule === item.id ? "secondary" : "ghost"}
                                onClick={() => setCurrentModule(item.id)}
                                className={cn(
                                    "justify-start gap-3",
                                    !isSidebarOpen && "h-10 w-10 justify-center p-0"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", currentModule === item.id && "text-primary")} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Button>
                        </TooltipTrigger>
                        {!isSidebarOpen && (
                            <TooltipContent side="right">
                                {item.label}
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))}
            </nav>
            <div className="mt-auto p-4">
                <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="w-full">
                    <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                </Button>
            </div>
        </aside>
        
        <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1">
                <ModuleView currentModule={currentModule} />
            </main>
        </div>
    </div>
    </TooltipProvider>
  );
}
