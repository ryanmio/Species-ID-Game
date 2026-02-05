export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface AnimalQuestion {
  imageUrl: string;
  correctAnswer: string;
  options: string[];
  commonName?: string;
  pageId: number;
  taxonomicGroup?: string;
}

// Main function to fetch a complete animal question via our API route
export async function fetchAnimalQuestion(
  difficulty: Difficulty = "easy",
  enabledTaxa?: number[]
): Promise<AnimalQuestion> {
  const params = new URLSearchParams({ difficulty });
  if (enabledTaxa && enabledTaxa.length > 0) {
    params.set("taxa", enabledTaxa.join(","));
  }
  
  const response = await fetch(`/api/eol?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch animal question");
  }

  const data = await response.json();
  return data as AnimalQuestion;
}
