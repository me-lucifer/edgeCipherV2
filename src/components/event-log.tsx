
"use client";

import { useEventLog } from "@/context/event-log-provider";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export function EventLog() {
    const { logs, isOpen, setIsOpen } = useEventLog();

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent className="h-1/2">
                <DrawerHeader>
                    <DrawerTitle>Event Log (Prototype)</DrawerTitle>
                </DrawerHeader>
                <ScrollArea className="flex-1 px-4">
                    <div className="font-mono text-xs text-muted-foreground space-y-2">
                        {logs.map(log => (
                            <div key={log.id}>
                                <div className="flex gap-4">
                                    <span className="text-foreground/50">{log.timestamp}</span>
                                    <span>{log.message}</span>
                                </div>
                                <Separator className="my-2 bg-border/50" />
                            </div>
                        ))}
                         {logs.length === 0 && <p>No events logged yet.</p>}
                    </div>
                </ScrollArea>
            </DrawerContent>
        </Drawer>
    );
}
