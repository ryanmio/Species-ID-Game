"use client";

import { Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreBoardProps {
  score: number;
  totalQuestions: number;
  onReset: () => void;
}

export function ScoreBoard({ score, totalQuestions, onReset }: ScoreBoardProps) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="bg-card rounded-xl shadow-md border border-border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Score</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-card-foreground">{score}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-lg text-muted-foreground">{totalQuestions}</span>
          </div>
          {totalQuestions > 0 && (
            <div
              className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                percentage >= 70 && "bg-success/20 text-success",
                percentage >= 40 && percentage < 70 && "bg-accent/20 text-accent-foreground",
                percentage < 40 && "bg-destructive/20 text-destructive"
              )}
            >
              {percentage}%
            </div>
          )}
        </div>

        {totalQuestions > 0 && (
          <button
            onClick={onReset}
            className="p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Reset score"
            title="Reset score"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
