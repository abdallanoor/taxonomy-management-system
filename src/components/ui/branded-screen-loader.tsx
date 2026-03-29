"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FolderLibraryIcon } from "@hugeicons/core-free-icons";

export function BrandedScreenLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-8 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer glowing subtle ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-primary/10 animate-[spin_4s_linear_infinite]" />

        {/* Fast spinning modern partial ring */}
        <div className="absolute inset-2 rounded-full border-[3px] border-primary border-t-transparent border-r-transparent animate-[spin_1s_cubic-bezier(0.5,0.2,0.5,0.8)_infinite]" />

        {/* Middle pulsing subtle element */}
        <div className="absolute inset-4 rounded-full bg-primary/5 animate-pulse" />

        {/* Center Icon */}
        <HugeiconsIcon
          icon={FolderLibraryIcon}
          size={36}
          className="text-primary animate-pulse"
        />
      </div>

      <div className="flex flex-col items-center space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          نظام تصنيف المواد النصية
        </h2>
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground/80">
          <span>جاري تجهيز مساحة العمل</span>
          <span className="flex gap-0.5 mt-2">
            <span className="w-1 h-1 rounded-full bg-primary/60 animate-[bounce_1.4s_infinite_0s]" />
            <span className="w-1 h-1 rounded-full bg-primary/60 animate-[bounce_1.4s_infinite_0.2s]" />
            <span className="w-1 h-1 rounded-full bg-primary/60 animate-[bounce_1.4s_infinite_0.4s]" />
          </span>
        </div>
      </div>
    </div>
  );
}
