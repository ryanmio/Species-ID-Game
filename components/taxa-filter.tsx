"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

export interface TaxonGroup {
  id: number;
  name: string;
  label: string;
  icon: string;
}

export const ANIMAL_GROUPS: TaxonGroup[] = [
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

interface TaxaFilterProps {
  enabledTaxa: number[];
  onChange: (enabledTaxa: number[]) => void;
  disabled?: boolean;
}

export function TaxaFilter({ enabledTaxa, onChange, disabled }: TaxaFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Local state for pending changes (before Apply is clicked)
  const [pendingTaxa, setPendingTaxa] = useState<number[]>(enabledTaxa);
  
  // Check if there are pending changes
  const hasPendingChanges = JSON.stringify([...pendingTaxa].sort()) !== JSON.stringify([...enabledTaxa].sort());

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

  const enableAll = () => {
    if (disabled) return;
    setPendingTaxa(ANIMAL_GROUPS.map((g) => g.id));
  };

  const handleApply = () => {
    onChange(pendingTaxa);
  };

  const handleCancel = () => {
    setPendingTaxa(enabledTaxa);
    setIsExpanded(false);
  };

  const allEnabled = pendingTaxa.length === ANIMAL_GROUPS.length;
  
  // Summary text for collapsed state
  const enabledCount = enabledTaxa.length;
  const summaryText = enabledCount === ANIMAL_GROUPS.length 
    ? "All groups" 
    : `${enabledCount} group${enabledCount !== 1 ? 's' : ''} selected`;

  return (
    <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => {
          if (!isExpanded) {
            // Reset pending to current when opening
            setPendingTaxa(enabledTaxa);
          }
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-sm">Animal Groups</h3>
          <span className="text-xs text-muted-foreground">({summaryText})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <div className="flex items-center justify-end mb-3">
            {!allEnabled && (
              <button
                onClick={enableAll}
                disabled={disabled}
                className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ANIMAL_GROUPS.map((group) => {
              const isEnabled = pendingTaxa.includes(group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => toggleTaxon(group.id)}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    "border",
                    disabled && "opacity-50 cursor-not-allowed",
                    isEnabled
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:border-border"
                  )}
                >
                  <span className="text-base" aria-hidden="true">{group.icon}</span>
                  <span>{group.label}</span>
                  {isEnabled && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
          {pendingTaxa.length === 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              At least one group must be enabled
            </p>
          )}
          
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={disabled || !hasPendingChanges}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
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
