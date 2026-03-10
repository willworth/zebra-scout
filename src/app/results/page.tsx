// sites/zebra-scout/src/app/results/page.tsx

'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, Suspense } from 'react'
import Link from 'next/link'
import { matchConditions, getTermById } from '@/lib/matcher'
import type { MatchResult } from '@/lib/types'

function ResultsContent() {
  const searchParams = useSearchParams()
  const symptomIdsRaw = searchParams.get('symptoms')
  const freeText = searchParams.get('freetext') ?? ''

  const symptomIds = useMemo(
    () => symptomIdsRaw?.split(',') ?? [],
    [symptomIdsRaw]
  )

  const selectedTerms = useMemo(
    () => symptomIds.map((id) => getTermById(id)).filter(Boolean),
    [symptomIds]
  )

  const results = useMemo(() => matchConditions(symptomIds), [symptomIds])

  if (symptomIds.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No symptoms selected.</p>
        <Link
          href="/symptoms"
          className="mt-4 inline-block text-purple-700 underline"
        >
          Go back and add symptoms
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Possible Conditions</h1>
        <p className="mt-2 text-gray-600">
          Based on {selectedTerms.length} symptom
          {selectedTerms.length !== 1 ? 's' : ''}, ranked by match quality.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>⚠️ Important:</strong> These are{' '}
        <strong>possible conditions to discuss with your doctor</strong>, not a
        diagnosis. The percentage shown is <strong>symptom overlap</strong> —
        how many of your symptoms appear in the condition&apos;s known profile.
        It is not a probability of having the condition. Many common conditions
        share similar symptoms. A medical professional needs to evaluate your
        specific situation.
      </div>

      {/* Your symptoms summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Your symptoms:
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {selectedTerms.map(
            (term) =>
              term && (
                <span
                  key={term.id}
                  className="rounded-full bg-purple-100 px-2.5 py-1 text-xs text-purple-800"
                >
                  {term.name}
                </span>
              )
          )}
        </div>
        {freeText && (
          <div className="mt-3 rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
            <strong>Additional notes:</strong> {freeText}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No conditions in our database matched your symptoms. This
            doesn&apos;t mean there isn&apos;t a match — our database covers ~60
            rare conditions.
          </p>
          <Link
            href="/symptoms"
            className="mt-4 inline-block text-purple-700 underline"
          >
            Try different symptoms
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <ResultCard
              key={result.condition.id}
              result={result}
              rank={index + 1}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-purple-900 mb-2">
          📋 Bring this list to your doctor
        </h2>
        <p className="text-sm text-purple-700 mb-4">
          Print or screenshot this page. These results give your doctor specific
          conditions to consider, which can save months of diagnostic odyssey.
        </p>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-purple-700 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-800 transition-colors"
        >
          🖨️ Print this page
        </button>
      </div>

      <div className="flex justify-center gap-4 text-sm">
        <Link href="/symptoms" className="text-purple-700 underline">
          ← Edit symptoms
        </Link>
        <Link href="/about" className="text-gray-500 underline">
          About this tool
        </Link>
      </div>
    </div>
  )
}

function ResultCard({ result, rank }: { result: MatchResult; rank: number }) {
  const scorePercent = Math.round(result.score * 100)
  const matchPercent = Math.round(
    (result.matchCount / result.totalConditionSymptoms) * 100
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
              {rank}
            </span>
            <h3 className="font-semibold text-lg">{result.condition.name}</h3>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {result.condition.description}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-purple-700">
            {scorePercent}%
          </div>
          <div className="text-xs text-gray-500">symptom overlap</div>
        </div>
      </div>

      {/* Match bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            {result.matchCount} of {result.totalConditionSymptoms} condition
            symptoms match
          </span>
          <span>{matchPercent}% coverage</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-purple-500 transition-all"
            style={{ width: `${matchPercent}%` }}
          />
        </div>
      </div>

      {/* Matched symptoms */}
      <div className="mt-3">
        <div className="text-xs font-medium text-gray-500 mb-1">
          Matching symptoms:
        </div>
        <div className="flex flex-wrap gap-1">
          {result.matchedSymptoms.map((s) => (
            <span
              key={s.id}
              className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800"
            >
              ✓ {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Unmatched condition symptoms */}
      {result.unmatchedConditionSymptoms.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium text-gray-500 mb-1">
            Other symptoms of this condition (not selected):
          </div>
          <div className="flex flex-wrap gap-1">
            {result.unmatchedConditionSymptoms.map((s) => (
              <span
                key={s.id}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
              >
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 sm:grid-cols-4">
        <div>
          <span className="font-medium">Prevalence:</span>{' '}
          {result.condition.prevalence}
        </div>
        <div>
          <span className="font-medium">Inheritance:</span>{' '}
          {result.condition.inheritanceMode}
        </div>
        <div>
          <span className="font-medium">Onset:</span>{' '}
          {result.condition.ageOfOnset}
        </div>
        <div>
          <a
            href={result.condition.orphanetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 underline hover:text-purple-800"
          >
            View on Orphanet →
          </a>
        </div>
      </div>

      {/* Key info */}
      {result.condition.keyInfo && (
        <div className="mt-3 rounded border border-blue-100 bg-blue-50 p-2 text-xs text-blue-800">
          💡 {result.condition.keyInfo}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-gray-500">
          Loading results...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
