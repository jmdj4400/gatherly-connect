// Centralized scoring utilities for matching

export interface Profile {
  interests: string[] | null;
  social_energy: number | null;
  city: string | null;
}

export interface Candidate {
  user_id: string;
  profile: Profile;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  
  return union === 0 ? 0 : intersection / union;
}

/**
 * Calculate social energy compatibility score (0-1)
 * Higher score means more compatible energy levels
 */
export function socialEnergyScore(a: number | null, b: number | null): number {
  if (a === null || b === null) return 0.5; // Neutral if unknown
  
  const diff = Math.abs(a - b);
  // Score based on 1-5 scale, max diff is 4
  return 1 - (diff / 4);
}

/**
 * Calculate location proximity score (0-1)
 */
export function locationScore(cityA: string | null, cityB: string | null): number {
  if (!cityA || !cityB) return 0.5; // Neutral if unknown
  return cityA.toLowerCase() === cityB.toLowerCase() ? 1 : 0.3;
}

/**
 * Compute overall compatibility score between two profiles
 */
export function computeScore(profileA: Profile, profileB: Profile): number {
  const interestWeight = 0.5;
  const energyWeight = 0.3;
  const locationWeight = 0.2;

  const interests = jaccardSimilarity(
    profileA.interests || [],
    profileB.interests || []
  );
  const energy = socialEnergyScore(
    profileA.social_energy,
    profileB.social_energy
  );
  const location = locationScore(profileA.city, profileB.city);

  return (
    interests * interestWeight +
    energy * energyWeight +
    location * locationWeight
  );
}

/**
 * Calculate average group compatibility score
 */
export function groupScore(members: Profile[]): number {
  if (members.length < 2) return 0;
  
  let total = 0;
  let count = 0;
  
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      total += computeScore(members[i], members[j]);
      count++;
    }
  }
  
  return count === 0 ? 0 : total / count;
}

/**
 * Greedy algorithm to assign candidates into optimal groups
 */
export function assignGroups(
  candidates: Candidate[],
  groupSize: number
): Candidate[][] {
  if (candidates.length === 0) return [];
  
  const groups: Candidate[][] = [];
  const remaining = [...candidates];
  
  while (remaining.length >= groupSize) {
    // Start with first remaining candidate
    const group: Candidate[] = [remaining.shift()!];
    
    // Greedily add best-scoring candidates
    while (group.length < groupSize && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const testGroup = [...group.map(c => c.profile), remaining[i].profile];
        const score = groupScore(testGroup);
        
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      
      group.push(remaining.splice(bestIndex, 1)[0]);
    }
    
    groups.push(group);
  }
  
  // Handle remaining candidates (less than group size)
  if (remaining.length > 0) {
    // Try to distribute to existing groups or create small group
    if (groups.length > 0 && remaining.length <= 2) {
      // Distribute to existing groups
      for (const candidate of remaining) {
        let bestGroupIndex = 0;
        let bestScore = -1;
        
        for (let i = 0; i < groups.length; i++) {
          if (groups[i].length < groupSize + 1) {
            const testGroup = [...groups[i].map(c => c.profile), candidate.profile];
            const score = groupScore(testGroup);
            
            if (score > bestScore) {
              bestScore = score;
              bestGroupIndex = i;
            }
          }
        }
        
        groups[bestGroupIndex].push(candidate);
      }
    } else {
      // Create small group
      groups.push(remaining);
    }
  }
  
  console.log(`[scoring] Assigned ${candidates.length} candidates into ${groups.length} groups`);
  return groups;
}

/**
 * Fallback scoring when embeddings are unavailable
 */
export function fallbackScore(profileA: Profile, profileB: Profile): number {
  // Use basic profile matching without embeddings
  return computeScore(profileA, profileB);
}
