// sites/zebra-scout/src/lib/types.ts

export interface HPOTerm {
  id: string
  name: string
  synonyms: string[]
}

export interface Condition {
  id: string
  name: string
  description: string
  symptoms: string[] // HPO term IDs
  prevalence: string
  inheritanceMode: string
  ageOfOnset: string
  orphanetUrl: string
  keyInfo: string
}

export interface MatchResult {
  condition: Condition
  matchedSymptoms: HPOTerm[]
  unmatchedConditionSymptoms: HPOTerm[]
  score: number // Jaccard similarity
  matchCount: number
  totalConditionSymptoms: number
}
