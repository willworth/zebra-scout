// sites/zebra-scout/src/app/about/page.tsx

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="prose prose-gray mx-auto max-w-2xl">
      <h1>About Zebra Scout</h1>

      <div className="not-prose rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-8">
        <strong>⚠️ Reminder:</strong> Zebra Scout is a research and educational
        tool. It does not provide medical diagnoses. Always consult a qualified
        healthcare provider.
      </div>

      <h2>Why this exists</h2>
      <p>
        In 2023, a mother named Alex used ChatGPT to identify her son&apos;s
        condition — <strong>tethered cord syndrome</strong> — after 17 doctors
        over 3 years had failed to connect the dots. She didn&apos;t use AI to
        replace her doctors. She used it to ask <em>better questions</em>.
      </p>
      <p>
        This is the diagnostic odyssey. On average, rare disease patients see{' '}
        <strong>7.3 physicians</strong> over <strong>4.8 years</strong> before
        getting a correct diagnosis. For some, it takes decades.
      </p>
      <p>
        Zebra Scout exists because no parent should have to become a medical
        detective — but until the healthcare system catches up, tools that help
        people ask better questions can save years of suffering.
      </p>

      <h2>How it works</h2>
      <p>
        Zebra Scout uses a curated database of 65 rare conditions and 241
        symptoms, mapped to the{' '}
        <a
          href="https://hpo.jax.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Human Phenotype Ontology (HPO)
        </a>{' '}
        — the standard medical vocabulary for describing clinical features,
        maintained by the Jackson Laboratory.
      </p>
      <p>When you enter symptoms, the tool:</p>
      <ol>
        <li>
          Searches 241 HPO terms (plus synonyms) to find standardised matches
          for your symptoms
        </li>
        <li>
          Compares your selected symptoms against the known symptom profile of
          each of the 65 conditions in the database
        </li>
        <li>
          Calculates a <strong>symptom overlap score</strong> — pure set
          mathematics measuring how much your symptoms overlap with each
          condition&apos;s profile (40% Jaccard similarity + 60% condition
          coverage)
        </li>
        <li>Returns up to 15 conditions ranked by overlap score</li>
      </ol>
      <p>
        <strong>This is not AI and not probabilistic.</strong> There is no
        language model, no neural network, no machine learning. The same
        symptoms will always produce the same results. The score is a measure of
        symptom overlap, not a probability of having the condition.
      </p>
      <p>
        All computation happens in your browser. No data is sent to any server.
        No accounts needed. You can verify any result by following the Orphanet
        link on each condition.
      </p>

      <h2>What this is NOT</h2>
      <ul>
        <li>
          <strong>Not a diagnosis.</strong> Only a qualified medical
          professional can diagnose a condition. A high overlap score means your
          symptoms appear in the condition&apos;s profile — it does not mean you
          have it.
        </li>
        <li>
          <strong>Not comprehensive.</strong> The database covers 65 conditions
          and 241 symptoms. The full Orphanet catalogue has over 6,000 rare
          diseases, and the HPO has 17,000+ terms. A condition not appearing in
          results may simply not be in our dataset.
        </li>
        <li>
          <strong>Not a replacement for medical care.</strong> Use this to start
          a conversation with your doctor, not to end one. Bring the results
          page to your appointment as a starting point for discussion.
        </li>
      </ul>

      <h2>The data</h2>
      <p>
        Conditions and symptom mappings are curated from public sources
        including{' '}
        <a
          href="https://www.orpha.net/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Orphanet
        </a>
        ,{' '}
        <a href="https://omim.org/" target="_blank" rel="noopener noreferrer">
          OMIM
        </a>
        , and the{' '}
        <a
          href="https://hpo.jax.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          HPO
        </a>
        . This is a prototype — a production version would integrate these
        databases directly via their APIs.
      </p>

      <h2>Why &ldquo;Zebra&rdquo;?</h2>
      <p>
        There&apos;s a saying in medicine: &ldquo;When you hear hoofbeats, think
        horses, not zebras.&rdquo; It teaches doctors to consider common
        diagnoses first. But for rare disease patients, the answer really{' '}
        <em>is</em> the zebra — and that saying can become a barrier to
        diagnosis. The zebra stripe ribbon has become the symbol of the rare
        disease community.
      </p>

      <h2>Open source</h2>
      <p>
        Zebra Scout is part of the{' '}
        <a
          href="https://github.com/willworth"
          target="_blank"
          rel="noopener noreferrer"
        >
          willworth
        </a>{' '}
        monorepo. The data and matching algorithm are open source —
        contributions welcome.
      </p>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a
            href="https://willworth.dev/articles/rare-disease-diagnosis"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rare Disease Diagnosis — willworth.dev
          </a>
        </li>
        <li>
          <a
            href="https://www.eurordis.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            EURORDIS — Rare Diseases Europe
          </a>
        </li>
        <li>
          <a
            href="https://rarediseases.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NORD — National Organization for Rare Disorders
          </a>
        </li>
        <li>
          <a
            href="https://undiagnosed.hms.harvard.edu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Undiagnosed Diseases Program
          </a>
        </li>
      </ul>

      <div className="not-prose mt-8 text-center">
        <Link
          href="/symptoms"
          className="inline-block rounded-lg bg-purple-700 px-6 py-3 font-semibold text-white hover:bg-purple-800 transition-colors"
        >
          Try Zebra Scout →
        </Link>
      </div>
    </div>
  )
}
