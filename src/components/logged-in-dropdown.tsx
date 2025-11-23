
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
import { LayoutDashboard, LogOut, UserCircle } from "lucide-react"

interface LoggedInDropdownProps {
    onLogout: () => void;
    onShowDashboard: () => void;
}

export function LoggedInDropdown({ onLogout, onShowDashboard }: LoggedInDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Logged In (Prototype)</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Prototype Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowDashboard}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Simulate Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout (Prototype)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
