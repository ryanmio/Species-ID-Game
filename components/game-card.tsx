"use client";

import { useState, useEffect } from "react";
import type { AnimalQuestion } from "@/lib/eol-api";
import { getSafeImageUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight, ExternalLink, AlertCircle } from "lucide-react";

interface GameCardProps {
  question: AnimalQuestion;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}

export function GameCard({
  question,
  selectedAnswer,
  isCorrect,
  onAnswer,
  onNext,
}: GameCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const safeImageUrl = getSafeImageUrl(question.imageUrl);

  // Reset image state when question changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [question.imageUrl]);

  const hasAnswered = selectedAnswer !== null;

  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden border border-border">
      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 flex-col gap-2">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">Image unavailable</p>
          </div>
        ) : (
          <img
            src={safeImageUrl}
            alt="Mystery animal"
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay hint when answered */}
        {hasAnswered && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all",
              isCorrect
                ? "bg-success/20"
                : "bg-destructive/20"
            )}
          >
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                isCorrect
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              )}
            >
              {isCorrect ? (
                <Check className="w-10 h-10" />
              ) : (
                <X className="w-10 h-10" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Question Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-card-foreground mb-4 text-center">
          What animal is this?
        </h2>

        {/* Answer Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = option === question.correctAnswer;
            const showAsCorrect = hasAnswered && isCorrectAnswer;
            const showAsWrong = hasAnswered && isSelected && !isCorrect;

            return (
              <button
                key={`${option}-${index}`}
                onClick={() => onAnswer(option)}
                disabled={hasAnswered}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200 font-medium",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  !hasAnswered && "hover:border-primary hover:bg-secondary",
                  !hasAnswered && "border-border bg-card text-card-foreground",
                  showAsCorrect && "border-success bg-success/10 text-success",
                  showAsWrong && "border-destructive bg-destructive/10 text-destructive",
                  hasAnswered && !showAsCorrect && !showAsWrong && "border-border bg-muted/50 text-muted-foreground opacity-60"
                )}
              >
                <span className="flex items-center gap-2">
                  {showAsCorrect && <Check className="w-5 h-5 flex-shrink-0" />}
                  {showAsWrong && <X className="w-5 h-5 flex-shrink-0" />}
                  <span className="text-sm sm:text-base italic">{option}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Result Message */}
        {hasAnswered && (
          <div className="text-center mb-4">
            <p
              className={cn(
                "text-lg font-medium",
                isCorrect ? "text-success" : "text-destructive"
              )}
            >
              {isCorrect ? "Correct!" : "Not quite..."}
            </p>
            {!isCorrect && (
              <p className="text-muted-foreground mt-1">
                The answer was <span className="italic font-medium text-card-foreground">{question.correctAnswer}</span>
              </p>
            )}
            <a
              href={`https://www.inaturalist.org/taxa/${question.pageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              Learn more on iNaturalist <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Next Button */}
        {hasAnswered && (
          <button
            onClick={onNext}
            className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Next Animal <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
