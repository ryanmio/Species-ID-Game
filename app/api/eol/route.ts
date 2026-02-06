import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CacheManager, createCacheKey } from "@/lib/cache";

// API timeout configuration (in milliseconds)
const API_TIMEOUT = 10000; // 10 seconds per iNaturalist request
const ROUTE_TIMEOUT = 30000; // 30 seconds total for the route

// Initialize cache for API responses (50MB max, 5 minute TTL)
const apiCache = new CacheManager<INatTaxon | INatTaxaResponse | INatTaxonDetail>(50 * 1024 * 1024);

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute sliding window
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per IP
const requestLog = new Map<string, number[]>(); // IP -> timestamps of requests

function getClientIp(request: NextRequest): string {
  return request.ip || request.headers.get("x-forwarded-for") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];
  
  // Remove timestamps outside the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  // Update the log
  requestLog.set(ip, recentTimestamps);
  
  // Check if over limit
  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  // Record this request
  recentTimestamps.push(now);
  requestLog.set(ip, recentTimestamps);
  
  return false;
}

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of requestLog.entries()) {
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (recentTimestamps.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, recentTimestamps);
    }
  }
}, 5 * 60 * 1000);

// iNaturalist API types
interface INatTaxon {
  id: number;
  name: string;
  preferred_common_name?: string;
  default_photo?: {
    medium_url?: string;
    url?: string;
    square_url?: string;
  };
  rank: string;
  rank_level: number;
  iconic_taxon_name?: string;
  ancestor_ids?: number[];
  ancestors?: INatTaxon[];
}

interface INatTaxaResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: INatTaxon[];
}

interface INatTaxonDetail {
  id: number;
  name: string;
  rank: string;
  ancestor_ids: number[];
  ancestors: {
    id: number;
    name: string;
    rank: string;
    preferred_common_name?: string;
  }[];
}

// Difficulty levels determine what taxonomic level we use for distractors
// Easy: Same class (e.g., all mammals - very different animals)
// Medium: Same order (e.g., all rodents or all carnivores)
// Hard: Same family (e.g., all canids or all felids - similar animals)
// Expert: Same genus (e.g., all Canis species - very similar species)
export type Difficulty = "easy" | "medium" | "hard" | "expert";

// Rank levels in iNaturalist (lower = more specific)
const RANK_LEVELS: Record<string, number> = {
  kingdom: 70,
  phylum: 60,
  subphylum: 57,
  class: 50,
  subclass: 47,
  order: 40,
  suborder: 37,
  family: 30,
  subfamily: 27,
  genus: 20,
  species: 10,
};

// Target ranks for each difficulty
// Note: Hard and Expert have custom strict logic that skips species rather than falling back
const DIFFICULTY_TARGET_RANKS: Record<Difficulty, string[]> = {
  easy: ["class"],                        // e.g., all mammals
  medium: ["order", "class"],             // e.g., all primates, fallback to class
  hard: ["family"],                       // e.g., all felids (strict - no fallback, skips if insufficient)
  expert: ["genus", "family"],            // e.g., all Panthera species, can fall back to family only
};

// All available animal groups
const ALL_ANIMAL_TAXON_IDS = [
  40151,  // Mammalia (mammals)
  3,      // Aves (birds)  
  47178,  // Actinopterygii (ray-finned fishes)
  26036,  // Reptilia (reptiles)
  20978,  // Amphibia (amphibians)
  47158,  // Insecta (insects)
  47119,  // Arachnida (arachnids)
  47115,  // Mollusca (mollusks)
  47157,  // Crustacea (crustaceans)
];

const ANIMAL_TAXON_IDS = ALL_ANIMAL_TAXON_IDS; // Declare the variable here

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatName(taxon: INatTaxon): string {
  if (taxon.preferred_common_name) {
    return taxon.preferred_common_name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  return taxon.name;
}

// Helper to fetch with timeout and caching
async function fetchWithTimeout(url: string, timeoutMs: number = API_TIMEOUT, cacheKeyOverride?: string): Promise<Response> {
  const cacheKey = cacheKeyOverride || url;
  
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    // Return cached response as a Response object
    return new Response(JSON.stringify(cached), {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AnimalGuessingGame/1.0"
      }
    });
    
    // Cache successful responses (5 minutes)
    if (response.ok) {
      const data = await response.clone().json();
      apiCache.set(cacheKey, data, 5 * 60 * 1000);
      
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "X-Cache": "MISS" }
      });
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch a single random species with good photos from a taxon group
async function fetchRandomSpecies(taxonId: number): Promise<INatTaxon | null> {
  const randomPage = Math.floor(Math.random() * 20) + 1;
  const url = `https://api.inaturalist.org/v1/taxa?taxon_id=${taxonId}&rank=species&per_page=30&page=${randomPage}&photos=true&order=desc&order_by=observations_count`;
  
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) return null;
    
    const data: INatTaxaResponse = await response.json();
    const taxaWithPhotos = data.results.filter(t => t.default_photo?.medium_url || t.default_photo?.url);
    
    if (taxaWithPhotos.length === 0) return null;
    
    return taxaWithPhotos[Math.floor(Math.random() * taxaWithPhotos.length)];
  } catch (err) {
    console.error("[iNat API] Timeout fetching random species:", err);
    return null;
  }
}

// Get detailed taxon info including ancestors
async function getTaxonDetails(taxonId: number): Promise<INatTaxonDetail | null> {
  const url = `https://api.inaturalist.org/v1/taxa/${taxonId}`;
  
  try {
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (err) {
    console.error("[iNat API] Timeout fetching taxon details:", err);
    return null;
  }
}

// Find ancestor at a specific rank
function findAncestorAtRank(ancestors: INatTaxonDetail["ancestors"], targetRank: string): { id: number; name: string } | null {
  for (const ancestor of ancestors) {
    if (ancestor.rank === targetRank) {
      return { id: ancestor.id, name: ancestor.name };
    }
  }
  return null;
}

// Fetch species from a specific taxon for distractors
// excludeTaxonId: exclude species that belong to this taxon (e.g., exclude the order so distractors come from different orders within the class)
// NOTE: iNaturalist's taxa endpoint doesn't support without_taxon_id, so we filter locally using ancestor_ids
async function fetchSpeciesFromTaxon(
  taxonId: number, 
  count: number, 
  excludeIds: number[],
  excludeTaxonId?: number
): Promise<INatTaxon[]> {
  const results: INatTaxon[] = [];
  const seenNames = new Set<string>();
  let page = 1;
  let attempts = 0;
  
  // We need ancestor_ids to filter by excluded taxon - must fetch more pages to find enough non-excluded species
  const maxAttempts = excludeTaxonId ? 15 : 8;
  
  while (results.length < count && attempts < maxAttempts) {
    attempts++;
    const url = `https://api.inaturalist.org/v1/taxa?taxon_id=${taxonId}&rank=species&per_page=100&page=${page}&photos=true&order=desc&order_by=observations_count`;
    
    try {
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        page++;
        continue;
      }
      
      const data: INatTaxaResponse = await response.json();
      
      // If no more results, stop
      if (data.results.length === 0) break;
      
      for (const taxon of data.results) {
        if (results.length >= count) break;
        if (excludeIds.includes(taxon.id)) continue;
        
        // LOCAL FILTERING: Check if this taxon belongs to the excluded taxon using ancestor_ids
        // ancestor_ids contains all ancestor taxon IDs for this species
        if (excludeTaxonId && taxon.ancestor_ids && taxon.ancestor_ids.includes(excludeTaxonId)) {
          continue; // Skip - this species belongs to the excluded taxon
        }
        
        const name = formatName(taxon);
        if (seenNames.has(name.toLowerCase())) continue;
        
        if (taxon.default_photo?.medium_url || taxon.default_photo?.url) {
          results.push(taxon);
          seenNames.add(name.toLowerCase());
        }
      }
      
      page++;
    } catch (err) {
      console.error("[iNat API] Timeout fetching species from taxon:", err);
      page++;
      continue;
    }
  }
  
  return results;
}

export async function GET(request: NextRequest) {
  // Check rate limit first
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 30 requests per minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const difficulty = (searchParams.get("difficulty") || "easy") as Difficulty;
  const taxaParam = searchParams.get("taxa");
  
  // Parse enabled taxa IDs from query param, default to all
  let enabledTaxaIds = ALL_ANIMAL_TAXON_IDS;
  if (taxaParam) {
    const parsedIds = taxaParam.split(",").map(Number).filter((id) => !isNaN(id) && ALL_ANIMAL_TAXON_IDS.includes(id));
    if (parsedIds.length > 0) {
      enabledTaxaIds = parsedIds;
    }
  }
  
  const maxRetries = 12;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    try {
      // Pick a random animal class from enabled taxa
      const startTaxonId = enabledTaxaIds[Math.floor(Math.random() * enabledTaxaIds.length)];
      
      // Fetch a random species
      const correctTaxon = await fetchRandomSpecies(startTaxonId);
      if (!correctTaxon) {
        continue;
      }
      
      const imageUrl = correctTaxon.default_photo?.medium_url || correctTaxon.default_photo?.url || "";
      if (!imageUrl) continue;
      
      // Validate image URL is from trusted source
      try {
        const urlObj = new URL(imageUrl);
        const trustedDomains = ["inaturalist.org", "cloudinary.net", "staticflickr.com", "upload.wikimedia.org"];
        const isTrusted = trustedDomains.some(domain => urlObj.hostname.includes(domain));
        if (!isTrusted) {
          console.warn("[iNat API] Image from untrusted domain:", urlObj.hostname);
          continue;
        }
      } catch (err) {
        console.warn("[iNat API] Invalid image URL:", imageUrl);
        continue;
      }
      
      const correctAnswer = formatName(correctTaxon);
      
      // Get the taxon's ancestors to find the right taxonomic level for distractors
      const taxonDetails = await getTaxonDetails(correctTaxon.id);
      if (!taxonDetails || !taxonDetails.ancestors) {
        continue;
      }
      
      // Find ancestors at different ranks for difficulty-based filtering
      const classAncestor = findAncestorAtRank(taxonDetails.ancestors, "class");
      const orderAncestor = findAncestorAtRank(taxonDetails.ancestors, "order");
      const familyAncestor = findAncestorAtRank(taxonDetails.ancestors, "family");
      const genusAncestor = findAncestorAtRank(taxonDetails.ancestors, "genus");
      
      let distractorTaxonId: number;
      let excludeTaxonId: number | undefined;
      let actualRank: string;
      
      // Set up distractor source and exclusions based on difficulty
      // Easy: Same class, exclude same order (lizard gets turtles/snakes/crocs, not other lizards)
      // Medium: Same order, exclude same family
      // Hard: Same family (strict)
      // Expert: Same genus, fallback to family
      
      if (difficulty === "easy") {
        distractorTaxonId = classAncestor?.id || startTaxonId;
        excludeTaxonId = orderAncestor?.id; // Exclude the same order
        actualRank = "class";
      } else if (difficulty === "medium") {
        distractorTaxonId = orderAncestor?.id || classAncestor?.id || startTaxonId;
        excludeTaxonId = familyAncestor?.id; // Exclude the same family
        actualRank = orderAncestor ? "order" : "class";
      } else if (difficulty === "hard") {
        distractorTaxonId = familyAncestor?.id || orderAncestor?.id || startTaxonId;
        excludeTaxonId = undefined; // No exclusion - we want same family
        actualRank = familyAncestor ? "family" : "order";
      } else {
        // Expert: try genus first
        distractorTaxonId = genusAncestor?.id || familyAncestor?.id || startTaxonId;
        excludeTaxonId = undefined; // No exclusion - we want same genus/family
        actualRank = genusAncestor ? "genus" : (familyAncestor ? "family" : "class");
      }
      
      // Fetch distractors from the target taxonomic group (with local filtering for exclusions)
      const distractorTaxa = await fetchSpeciesFromTaxon(distractorTaxonId, 20, [correctTaxon.id], excludeTaxonId);
      
      // Get 3 unique distractors
      const distractors: string[] = [];
      const shuffledDistractors = shuffleArray(distractorTaxa);
      
      for (const taxon of shuffledDistractors) {
        if (distractors.length >= 3) break;
        const name = formatName(taxon);
        if (name.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(name)) {
          distractors.push(name);
        }
      }
      
      // For hard mode, if we couldn't find 3 distractors at family level,
      // skip this species and try another - don't fall back to order level
      if (difficulty === "hard" && distractors.length < 3) {
        continue;
      }
      
      // For expert mode, if genus doesn't have enough, try family level as fallback
      if (difficulty === "expert" && distractors.length < 3) {
        const familyAncestor = findAncestorAtRank(taxonDetails.ancestors, "family");
        if (familyAncestor) {
          const familyTaxa = await fetchSpeciesFromTaxon(familyAncestor.id, 15, [correctTaxon.id]);
          for (const taxon of familyTaxa) {
            if (distractors.length >= 3) break;
            const name = formatName(taxon);
            if (name.toLowerCase() !== correctAnswer.toLowerCase() && !distractors.includes(name)) {
              distractors.push(name);
            }
          }
          if (distractors.length >= 3) {
            actualRank = "family";
          }
        }
        // If still not enough at family level, skip this species
        if (distractors.length < 3) {
          continue;
        }
      }
      
      // For easy mode, if we can't find enough distractors from different orders,
      // skip this species - we don't want to show similar animals on easy mode
      if (difficulty === "easy" && distractors.length < 3) {
        continue;
      }
      
      // For medium mode, if we can't find enough from different families in the order,
      // skip this species
      if (difficulty === "medium" && distractors.length < 3) {
        continue;
      }
      
      // Last resort fallback
      while (distractors.length < 3) {
        distractors.push(`Unknown Species ${distractors.length + 1}`);
      }
      
      // Create shuffled options
      const options = shuffleArray([correctAnswer, ...distractors.slice(0, 3)]);
      
      return NextResponse.json({
        imageUrl,
        correctAnswer,
        options,
        pageId: correctTaxon.id,
        taxonomicGroup: actualRank,
      });
    } catch (err) {
      console.error("[iNat API] Error in attempt", attempts, ":", err);
      // Add exponential backoff: 1s, 2s, 4s, etc.
      const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      if (attempts >= maxRetries) {
        return NextResponse.json(
          { error: "Failed to fetch animal question" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json(
    { error: "Failed to fetch animal question after maximum retries" },
    { status: 500 }
  );
}
