// sites/zebra-scout/src/lib/matcher.ts

import type { HPOTerm, Condition, MatchResult } from './types'
import conditionsData from '../../data/conditions.json'
import hpoTermsData from '../../data/hpo-terms.json'

// De-duplicate HPO terms by ID (some duplicates in data)
const termMap = new Map<string, HPOTerm>()
for (const term of hpoTermsData as HPOTerm[]) {
  if (!termMap.has(term.id)) {
    termMap.set(term.id, term)
  }
}

export const hpoTerms: HPOTerm[] = Array.from(termMap.values())
export const conditions: Condition[] = conditionsData as Condition[]

/**
 * Search HPO terms by name or synonym (case-insensitive, substring match)
 */
export function searchTerms(query: string): HPOTerm[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return hpoTerms
    .filter(
      (term) =>
        term.name.toLowerCase().includes(q) ||
        term.synonyms.some((s) => s.toLowerCase().includes(q))
    )
    .slice(0, 20)
}

/**
 * Resolve an HPO ID to its term
 */
export function getTermById(id: string): HPOTerm | undefined {
  return termMap.get(id)
}

/**
 * Match selected symptoms against conditions using Jaccard-like scoring.
 * Score = matchedCount / union(selectedSymptoms, conditionSymptoms)
 * But we weight more toward "how much of the condition is explained"
 */
export function matchConditions(selectedTermIds: string[]): MatchResult[] {
  if (selectedTermIds.length === 0) return []

  const selectedSet = new Set(selectedTermIds)

  const results: MatchResult[] = conditions.map((condition) => {
    const conditionSymptomIds = new Set(condition.symptoms)
    const matched: string[] = []
    const unmatched: string[] = []

    for (const symptomId of condition.symptoms) {
      if (selectedSet.has(symptomId)) {
        matched.push(symptomId)
      } else {
        unmatched.push(symptomId)
      }
    }

    // Combined score: Jaccard similarity + bonus for condition coverage
    const union = new Set([...selectedTermIds, ...condition.symptoms])
    const jaccardScore = matched.length / union.size

    // How much of this condition is explained by selected symptoms
    const conditionCoverage = matched.length / conditionSymptomIds.size

    // Weighted: 40% Jaccard + 60% condition coverage (reward explaining more of a condition)
    const score = 0.4 * jaccardScore + 0.6 * conditionCoverage

    return {
      condition,
      matchedSymptoms: matched
        .map((id) => getTermById(id))
        .filter(Boolean) as HPOTerm[],
      unmatchedConditionSymptoms: unmatched
        .map((id) => getTermById(id))
        .filter(Boolean) as HPOTerm[],
      score,
      matchCount: matched.length,
      totalConditionSymptoms: condition.symptoms.length,
    }
  })

  // Filter: at least 1 match, then sort by score descending
  return results
    .filter((r) => r.matchCount > 0)
    .sort((a, b) => b.score - a.score || b.matchCount - a.matchCount)
    .slice(0, 15)
}
