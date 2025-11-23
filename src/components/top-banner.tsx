
"use client";

import { Info, X } from "lucide-react";
import { useState } from "react";

export function TopBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary/10 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-foreground">
          <Info className="inline h-4 w-4 mr-2" />
          <strong className="font-semibold">Prototype mode:</strong> In a real app, you would be redirected to your dashboard. We're keeping you here to review the flow.
        </p>
      </div>
      <div className="flex flex-1 justify-end">
        <button type="button" className="-m-3 p-3 focus-visible:outline-offset-[-4px]" onClick={() => setIsVisible(false)}>
          <span className="sr-only">Dismiss</span>
          <X className="h-5 w-5 text-foreground" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
