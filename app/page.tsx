"use client";

import { useState, useCallback, useEffect } from "react";
import { GameCard } from "@/components/game-card";
import { ScoreBoardWithSettings } from "@/components/score-board-with-settings";
import { LoadingSpinner } from "@/components/loading-spinner";
import { fetchAnimalQuestion, type AnimalQuestion, type Difficulty } from "@/lib/eol-api";

const ANIMAL_GROUPS_IDS = [40151, 3, 47178, 26036, 20978, 47158, 47119, 47115, 47157];

export default function Home() {
  const [question, setQuestion] = useState<AnimalQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [enabledTaxa, setEnabledTaxa] = useState<number[]>(() => ANIMAL_GROUPS_IDS);

  const loadNewQuestion = useCallback(async (diff: Difficulty, taxa: number[]) => {
    setLoading(true);
    setError(null);
    setSelectedAnswer(null);
    setIsCorrect(null);

    try {
      const newQuestion = await fetchAnimalQuestion(diff, taxa);
      setQuestion(newQuestion);
    } catch (err) {
      console.error("Error fetching question:", err);
      setError("Failed to load animal data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewQuestion(difficulty, enabledTaxa);
  }, [loadNewQuestion, difficulty, enabledTaxa]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || !question) return;

    setSelectedAnswer(answer);
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);
    setTotalQuestions((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    loadNewQuestion(difficulty, enabledTaxa);
  };

  const handleTaxaChange = (newTaxa: number[]) => {
    setEnabledTaxa(newTaxa);
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty);
      // Reset score when changing difficulty
      setScore(0);
      setTotalQuestions(0);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
            Animal Guessing Game
          </h1>
          <p className="text-muted-foreground">
            Test your knowledge of the animal kingdom!
          </p>
        </header>

        <div className="mb-6">
          <ScoreBoardWithSettings
            score={score}
            totalQuestions={totalQuestions}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            enabledTaxa={enabledTaxa}
            onTaxaChange={handleTaxaChange}
            disabled={loading}
          />
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-card rounded-xl shadow-lg border border-border p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
                <span className="text-xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Couldn't load animal</h3>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => loadNewQuestion(difficulty, enabledTaxa)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Try Again
            </button>
          </div>
        ) : question ? (
          <GameCard
            question={question}
            selectedAnswer={selectedAnswer}
            isCorrect={isCorrect}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        ) : null}

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://www.inaturalist.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              iNaturalist
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
