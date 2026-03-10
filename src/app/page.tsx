// sites/zebra-scout/src/app/page.tsx

import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-12 text-center">
      <div className="text-6xl">🦓</div>

      <h1 className="text-4xl font-bold tracking-tight">Zebra Scout</h1>

      <p className="max-w-xl text-lg text-gray-600">
        When doctors hear hoofbeats, they think horses.
        <br />
        Sometimes it&apos;s a zebra.
      </p>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-left max-w-lg">
        <h2 className="font-semibold text-amber-900 mb-2">
          ⚠️ This is NOT a diagnosis
        </h2>
        <p className="text-sm text-amber-800">
          Zebra Scout helps you identify possible rare conditions that match
          your symptoms — so you can have a <strong>better conversation</strong>{' '}
          with your doctor. It cannot and does not replace professional medical
          evaluation.
        </p>
      </div>

      <div className="max-w-lg space-y-4 text-left text-gray-600">
        <h3 className="font-semibold text-gray-900">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            <strong>Enter symptoms</strong> — search from medical terminology or
            describe in your own words
          </li>
          <li>
            <strong>Get matches</strong> — see which rare conditions share those
            symptoms, ranked by overlap
          </li>
          <li>
            <strong>Talk to your doctor</strong> — bring the list to your next
            appointment as a starting point
          </li>
        </ol>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 max-w-lg text-sm text-purple-800">
        <p>
          <strong>Why &ldquo;Zebra&rdquo;?</strong> In medical school, students
          are taught: &ldquo;When you hear hoofbeats, think horses, not
          zebras.&rdquo; But for the millions of people with rare diseases, the
          answer <em>is</em> the zebra — and it often takes years and dozens of
          doctors to find it.
        </p>
      </div>

      <Link
        href="/symptoms"
        className="rounded-lg bg-purple-700 px-8 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-purple-800 hover:shadow-lg active:scale-95"
      >
        Start Symptom Check →
      </Link>

      <p className="text-xs text-gray-400 max-w-md">
        Inspired by{' '}
        <a
          href="https://willworth.dev/articles/rare-disease-diagnosis"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          the story of a mother who used AI to diagnose her son&apos;s rare
          condition
        </a>{' '}
        after 17 doctors missed it.
      </p>
    </div>
  )
}
