"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, Settings } from "lucide-react";
import type { Difficulty } from "@/lib/eol-api";
import type { TaxonGroup } from "@/components/taxa-filter";

const ANIMAL_GROUPS: TaxonGroup[] = [
  { id: 40151, name: "Mammalia", label: "Mammals", icon: "🐘" },
  { id: 3, name: "Aves", label: "Birds", icon: "🦅" },
  { id: 47178, name: "Actinopterygii", label: "Fish", icon: "🐟" },
  { id: 26036, name: "Reptilia", label: "Reptiles", icon: "🦎" },
  { id: 20978, name: "Amphibia", label: "Amphibians", icon: "🐸" },
  { id: 47158, name: "Insecta", label: "Insects", icon: "🦋" },
  { id: 47119, name: "Arachnida", label: "Arachnids", icon: "🕷️" },
  { id: 47115, name: "Mollusca", label: "Mollusks", icon: "🐙" },
  { id: 47157, name: "Crustacea", label: "Crustaceans", icon: "🦀" },
];

const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string }> = {
  easy: {
    label: "Easy",
    description: "Different orders",
  },
  medium: {
    label: "Medium",
    description: "Same order",
  },
  hard: {
    label: "Hard",
    description: "Same family",
  },
  expert: {
    label: "Expert",
    description: "Same genus",
  },
};

interface GameSettingsProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  enabledTaxa: number[];
  onTaxaChange: (taxa: number[]) => void;
  disabled?: boolean;
}

export function GameSettings({
  difficulty,
  onDifficultyChange,
  enabledTaxa,
  onTaxaChange,
  disabled,
}: GameSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingTaxa, setPendingTaxa] = useState<number[]>(enabledTaxa);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty>(difficulty);

  const hasPendingChanges =
    JSON.stringify([...pendingTaxa].sort()) !== JSON.stringify([...enabledTaxa].sort()) ||
    pendingDifficulty !== difficulty;

  const toggleTaxon = (taxonId: number) => {
    if (disabled) return;

    const isEnabled = pendingTaxa.includes(taxonId);

    // Prevent disabling all taxa
    if (isEnabled && pendingTaxa.length === 1) {
      return;
    }

    if (isEnabled) {
      setPendingTaxa(pendingTaxa.filter((id) => id !== taxonId));
    } else {
      setPendingTaxa([...pendingTaxa, taxonId]);
    }
  };

  const handleApply = () => {
    onTaxaChange(pendingTaxa);
    onDifficultyChange(pendingDifficulty);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setPendingTaxa(enabledTaxa);
    setPendingDifficulty(difficulty);
    setIsExpanded(false);
  };

  const enabledCount = enabledTaxa.length;
  const summaryText =
    enabledCount === ANIMAL_GROUPS.length
      ? "All groups"
      : `${enabledCount} group${enabledCount !== 1 ? "s" : ""}`;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => {
          if (!isExpanded) {
            setPendingTaxa(enabledTaxa);
            setPendingDifficulty(difficulty);
          }
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">
              {DIFFICULTY_INFO[difficulty].label}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{summaryText}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          {/* Difficulty Section */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Difficulty
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {(["easy", "medium", "hard", "expert"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setPendingDifficulty(d)}
                  disabled={disabled}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs font-medium transition-all",
                    "border",
                    pendingDifficulty === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  title={DIFFICULTY_INFO[d].description}
                >
                  {DIFFICULTY_INFO[d].label}
                </button>
              ))}
            </div>
          </div>

          {/* Animal Groups Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Animal Groups
              </h4>
              {pendingTaxa.length < ANIMAL_GROUPS.length && (
                <button
                  onClick={() => setPendingTaxa(ANIMAL_GROUPS.map((g) => g.id))}
                  disabled={disabled}
                  className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ANIMAL_GROUPS.map((group) => {
                const isEnabled = pendingTaxa.includes(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleTaxon(group.id)}
                    disabled={disabled}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                      "border",
                      disabled && "opacity-50 cursor-not-allowed",
                      isEnabled
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary/50 border-transparent text-muted-foreground hover:border-border"
                    )}
                    title={group.label}
                  >
                    <span className="text-sm" aria-hidden="true">
                      {group.icon}
                    </span>
                    <span>{group.label}</span>
                    {isEnabled && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
            {pendingTaxa.length === 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                At least one group must be enabled
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={disabled || !hasPendingChanges}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded transition-all",
                hasPendingChanges
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
