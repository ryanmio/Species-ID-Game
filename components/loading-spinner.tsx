"use client";

export function LoadingSpinner() {
  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-12">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-muted rounded-full" />
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-card-foreground">
            Finding an animal...
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Searching the Encyclopedia of Life
          </p>
        </div>
      </div>
    </div>
  );
}
