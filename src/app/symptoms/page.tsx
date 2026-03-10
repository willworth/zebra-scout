// sites/zebra-scout/src/app/symptoms/page.tsx

'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { searchTerms } from '@/lib/matcher'
import type { HPOTerm } from '@/lib/types'

export default function SymptomsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<HPOTerm[]>([])
  const [freeText, setFreeText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const results = useMemo(() => searchTerms(query), [query])

  const addTerm = useCallback(
    (term: HPOTerm) => {
      if (!selected.find((s) => s.id === term.id)) {
        setSelected((prev) => [...prev, term])
      }
      setQuery('')
      setShowDropdown(false)
    },
    [selected]
  )

  const removeTerm = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleSubmit = () => {
    if (selected.length === 0) return
    const ids = selected.map((s) => s.id).join(',')
    const params = new URLSearchParams({ symptoms: ids })
    if (freeText.trim()) {
      params.set('freetext', freeText.trim())
    }
    router.push(`/results?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Enter Symptoms</h1>
        <p className="mt-2 text-gray-600">
          Search for symptoms using medical or everyday terms. The more symptoms
          you add, the better the results.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <label
          htmlFor="symptom-search"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Search for a symptom
        </label>
        <input
          id="symptom-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder='e.g. "joint pain", "seizures", "fatigue"...'
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
          autoComplete="off"
        />

        {/* Dropdown */}
        {showDropdown && results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((term) => {
              const isSelected = selected.some((s) => s.id === term.id)
              return (
                <li key={term.id}>
                  <button
                    type="button"
                    onClick={() => addTerm(term)}
                    disabled={isSelected}
                    className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors ${
                      isSelected ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="font-medium">{term.name}</div>
                    {term.synonyms.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Also: {term.synonyms.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Selected symptoms */}
      {selected.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Selected symptoms ({selected.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {selected.map((term) => (
              <span
                key={term.id}
                className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1.5 text-sm text-purple-800"
              >
                {term.name}
                <button
                  type="button"
                  onClick={() => removeTerm(term.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-purple-200 transition-colors"
                  aria-label={`Remove ${term.name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Encouragement */}
      {selected.length > 0 && selected.length < 4 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          💡 Tip: Adding more symptoms improves accuracy. Try to add at least
          3–5 symptoms for better results.
        </div>
      )}

      {/* Free text */}
      <div>
        <label
          htmlFor="free-text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Other symptoms or notes (optional)
        </label>
        <textarea
          id="free-text"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Describe any symptoms not found in the search above, or add context (e.g. 'symptoms worse after eating', 'started at age 3')..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
        <p className="mt-1 text-xs text-gray-500">
          Free text notes will be included in your results for your doctor but
          are not used in matching.
        </p>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className={`w-full rounded-lg py-3 text-lg font-semibold text-white shadow-md transition-all ${
          selected.length === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-purple-700 hover:bg-purple-800 hover:shadow-lg active:scale-[0.98]'
        }`}
      >
        {selected.length === 0
          ? 'Add at least one symptom to continue'
          : `Find matching conditions (${selected.length} symptom${selected.length !== 1 ? 's' : ''}) →`}
      </button>
    </div>
  )
}
