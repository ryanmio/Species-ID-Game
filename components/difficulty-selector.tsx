"use client";

import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/eol-api";

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string }> = {
  easy: {
    label: "Easy",
    description: "Different orders (lizard vs turtle vs snake)",
  },
  medium: {
    label: "Medium",
    description: "Same order, different families",
  },
  hard: {
    label: "Hard",
    description: "Same family (all felids or canids)",
  },
  expert: {
    label: "Expert",
    description: "Same genus (all Panthera species)",
  },
};

export function DifficultySelector({ difficulty, onChange, disabled }: DifficultySelectorProps) {
  const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];

  return (
    <div className="bg-card rounded-xl shadow-md border border-border p-4 mb-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">Difficulty</span>
          <span className="text-xs text-muted-foreground">
            {DIFFICULTY_INFO[difficulty].description}
          </span>
        </div>
        
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => onChange(d)}
              disabled={disabled}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                "border-2",
                difficulty === d
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {DIFFICULTY_INFO[d].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
