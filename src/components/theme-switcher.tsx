
"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { Paintbrush, Check } from "lucide-react"
import { useTheme, type Theme } from "./theme-provider"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const themes: { name: string, id: Theme, color: string }[] = [
    { name: "Aurora Teal", id: "teal", color: "bg-[#22d3ee]" },
    { name: "Royal Purple", id: "purple", color: "bg-[#a855f7]" },
    { name: "Neon Lime", id: "lime", color: "bg-[#a3e635]" },
    { name: "Steel Gold", id: "gold", color: "bg-[#fbbf24]" },
]

export function ThemeSwitcher() {
    const { theme: activeTheme, setTheme } = useTheme()
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <DropdownMenu>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Select Theme">
                                    <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Change color theme</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {themes.map((theme) => (
                         <DropdownMenuItem key={theme.id} onClick={() => setTheme(theme.id)}>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-4 h-4 rounded-full", theme.color)} />
                                <span>{theme.name}</span>
                                {activeTheme === theme.id && <Check className="ml-auto h-4 w-4" />}
                            </div>
                         </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
