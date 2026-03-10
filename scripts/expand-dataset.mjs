#!/usr/bin/env node
// sites/zebra-scout/scripts/expand-dataset.mjs

//
// Expands Zebra Scout's condition dataset using Orphanet + HPO open data.
//
// Data sources (all CC-BY-4.0 or open):
//   - phenotype.hpoa: HPO disease-phenotype annotations (ORPHA entries)
//   - hp.json: HPO ontology with term names and synonyms
//   - en_product9_prev.xml: Orphanet prevalence data
//   - en_product9_ages.xml: Orphanet age of onset + inheritance data
//   - en_product1.xml: Orphanet disease definitions/names
//
// Usage:
//   node scripts/expand-dataset.mjs [--min-symptoms 3] [--max-conditions 1000]
//
// Outputs:
//   data/conditions-expanded.json
//   data/hpo-terms-expanded.json

import { createReadStream, writeFileSync, existsSync, readFileSync } from 'fs'
import { createInterface } from 'readline'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseArgs } from 'util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE_ROOT = join(__dirname, '..')
const DATA_DIR = join(SITE_ROOT, 'data')
const CACHE_DIR = join(SITE_ROOT, 'scripts', '.cache')

// ── Config ────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    'min-symptoms': { type: 'string', default: '3' },
    'max-conditions': { type: 'string', default: '1000' },
    'skip-download': { type: 'boolean', default: false },
  },
})

const MIN_SYMPTOMS = parseInt(args['min-symptoms'], 10)
const MAX_CONDITIONS = parseInt(args['max-conditions'], 10)

console.log(`Config: min ${MIN_SYMPTOMS} symptoms, max ${MAX_CONDITIONS} conditions`)

// ── Download helpers ──────────────────────────────────────────────────

import { mkdirSync } from 'fs'

const URLS = {
  hpoa: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa',
  hpJson: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.json',
  prevXml: 'https://www.orphadata.com/data/xml/en_product9_prev.xml',
  agesXml: 'https://www.orphadata.com/data/xml/en_product9_ages.xml',
  diseasesXml: 'https://www.orphadata.com/data/xml/en_product1.xml',
}

async function downloadIfMissing(key, url) {
  mkdirSync(CACHE_DIR, { recursive: true })
  const path = join(CACHE_DIR, key)
  if (args['skip-download'] && existsSync(path)) {
    console.log(`  [cached] ${key}`)
    return path
  }
  // Re-download if older than 7 days
  if (existsSync(path)) {
    const stat = (await import('fs')).statSync(path)
    const age = Date.now() - stat.mtimeMs
    if (age < 7 * 24 * 60 * 60 * 1000) {
      console.log(`  [fresh] ${key}`)
      return path
    }
  }
  console.log(`  [downloading] ${key}...`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(path, buf)
  console.log(`  [done] ${key} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
  return path
}

// ── Step 1: Parse HPOA file → disease→symptoms map ───────────────────

async function parseHPOA(path) {
  /** @type {Map<string, {name: string, symptoms: Set<string>}>} */
  const diseases = new Map()

  const rl = createInterface({ input: createReadStream(path, 'utf-8') })
  for await (const line of rl) {
    if (line.startsWith('#') || line.startsWith('database_id')) continue
    const parts = line.split('\t')
    if (parts.length < 11) continue

    const dbId = parts[0]
    const diseaseName = parts[1]
    const qualifier = parts[2]
    const hpoId = parts[3]
    const aspect = parts[10]

    // Only ORPHA entries, only phenotypic (P) aspect, skip NOT annotations
    if (!dbId.startsWith('ORPHA:')) continue
    if (aspect !== 'P') continue
    if (qualifier === 'NOT') continue

    const code = dbId.replace('ORPHA:', '')

    if (!diseases.has(code)) {
      diseases.set(code, { name: diseaseName, symptoms: new Set() })
    }
    diseases.get(code).symptoms.add(hpoId)
  }

  return diseases
}

// ── Step 2: Parse HPO ontology → term names + synonyms ───────────────

function parseHPOTerms(path) {
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  /** @type {Map<string, {name: string, synonyms: string[]}>} */
  const terms = new Map()

  for (const node of data.graphs[0].nodes) {
    if (!node.id?.includes('HP_')) continue
    const id = node.id.replace('http://purl.obolibrary.org/obo/', '').replace('_', ':')
    const name = node.lbl
    if (!name) continue

    const synonyms = (node.meta?.synonyms ?? [])
      .filter((s) => s.pred === 'hasExactSynonym' || s.pred === 'hasRelatedSynonym')
      .map((s) => s.val)
      .filter((s) => s.length < 80) // Skip very long synonyms
      .slice(0, 5) // Cap at 5 synonyms

    terms.set(id, { name, synonyms })
  }

  return terms
}

// ── Step 3: Parse Orphanet XML for prevalence ────────────────────────

function parsePrevalenceXML(path) {
  // Simple regex-based XML parsing (no dependency needed)
  const xml = readFileSync(path, 'utf-8')
  /** @type {Map<string, string>} orphaCode → prevalence string */
  const prevalence = new Map()

  // Match each Disorder block
  const disorderRegex = /<Disorder id="[^"]*">([\s\S]*?)<\/Disorder>/g
  let match
  while ((match = disorderRegex.exec(xml)) !== null) {
    const block = match[1]
    const codeMatch = block.match(/<OrphaCode>(\d+)<\/OrphaCode>/)
    if (!codeMatch) continue
    const code = codeMatch[1]

    // Find point prevalence class
    const prevClassMatch = block.match(
      /<PrevalenceType id="23669">[\s\S]*?<PrevalenceClass[^>]*>\s*<Name lang="en">([^<]+)<\/Name>/
    )
    if (prevClassMatch) {
      prevalence.set(code, prevClassMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
    }
  }

  return prevalence
}

// ── Step 4: Parse Orphanet XML for age of onset + inheritance ────────

function parseAgesXML(path) {
  const xml = readFileSync(path, 'utf-8')
  /** @type {Map<string, {ageOfOnset: string, inheritance: string}>} */
  const metadata = new Map()

  const disorderRegex = /<Disorder id="[^"]*">([\s\S]*?)<\/Disorder>/g
  let match
  while ((match = disorderRegex.exec(xml)) !== null) {
    const block = match[1]
    const codeMatch = block.match(/<OrphaCode>(\d+)<\/OrphaCode>/)
    if (!codeMatch) continue
    const code = codeMatch[1]

    // Age of onset
    const ageMatches = [...block.matchAll(/<AverageAgeOfOnset[^>]*>\s*<Name lang="en">([^<]+)<\/Name>/g)]
    const ages = ageMatches.map((m) => m[1])

    // Inheritance
    const inhMatches = [...block.matchAll(/<TypeOfInheritance[^>]*>\s*<Name lang="en">([^<]+)<\/Name>/g)]
    const inheritance = inhMatches.map((m) => m[1])

    metadata.set(code, {
      ageOfOnset: ages.join(', ') || 'Variable',
      inheritance: inheritance.join(', ') || 'Unknown',
    })
  }

  return metadata
}

// ── Step 5: Parse Orphanet XML for disease definitions ───────────────

function parseDiseasesXML(path) {
  const xml = readFileSync(path, 'utf-8')
  /** @type {Map<string, {name: string, definition: string, type: string}>} */
  const diseases = new Map()

  const disorderRegex = /<Disorder id="[^"]*">([\s\S]*?)<\/Disorder>/g
  let match
  while ((match = disorderRegex.exec(xml)) !== null) {
    const block = match[1]
    const codeMatch = block.match(/<OrphaCode>(\d+)<\/OrphaCode>/)
    if (!codeMatch) continue
    const code = codeMatch[1]

    const nameMatch = block.match(/<Name lang="en">([^<]+)<\/Name>/)
    const name = nameMatch ? nameMatch[1] : ''

    // Get disease type (Disease, Clinical subtype, Group of disorders, etc.)
    const typeMatch = block.match(/<DisorderType[^>]*>\s*<Name lang="en">([^<]+)<\/Name>/)
    const type = typeMatch ? typeMatch[1] : ''

    // Get definition if present (from SummaryInformationList)
    const defMatch = block.match(/<Definition lang="en">([^<]*)<\/Definition>/)
    const definition = defMatch ? defMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : ''

    diseases.set(code, { name, definition, type })
  }

  return diseases
}

// ── Main pipeline ─────────────────────────────────────────────────────

async function main() {
  console.log('\n1. Downloading source data...')
  const hpoaPath = await downloadIfMissing('phenotype.hpoa', URLS.hpoa)
  const hpJsonPath = await downloadIfMissing('hp.json', URLS.hpJson)
  const prevPath = await downloadIfMissing('en_product9_prev.xml', URLS.prevXml)
  const agesPath = await downloadIfMissing('en_product9_ages.xml', URLS.agesXml)
  const diseasesPath = await downloadIfMissing('en_product1.xml', URLS.diseasesXml)

  console.log('\n2. Parsing HPO annotations (disease→symptom mappings)...')
  const hpoaDiseases = await parseHPOA(hpoaPath)
  console.log(`   ${hpoaDiseases.size} ORPHA diseases with phenotype annotations`)

  console.log('\n3. Parsing HPO ontology (term names + synonyms)...')
  const hpoTerms = parseHPOTerms(hpJsonPath)
  console.log(`   ${hpoTerms.size} HPO terms loaded`)

  console.log('\n4. Parsing Orphanet prevalence data...')
  const prevalence = parsePrevalenceXML(prevPath)
  console.log(`   ${prevalence.size} diseases with prevalence data`)

  console.log('\n5. Parsing Orphanet age of onset + inheritance...')
  const agesInheritance = parseAgesXML(agesPath)
  console.log(`   ${agesInheritance.size} diseases with age/inheritance data`)

  console.log('\n6. Parsing Orphanet disease definitions...')
  const diseaseInfo = parseDiseasesXML(diseasesPath)
  console.log(`   ${diseaseInfo.size} diseases with definitions`)

  // ── Filter + merge ────────────────────────────────────────────────

  console.log('\n7. Filtering and merging...')

  // Quality gate: >= MIN_SYMPTOMS HPO-mapped symptoms
  // Only include actual "Disease" types (not groups, subtypes without phenotypes)
  const qualifiedCodes = [...hpoaDiseases.entries()]
    .filter(([code, d]) => d.symptoms.size >= MIN_SYMPTOMS)
    .filter(([code]) => {
      const info = diseaseInfo.get(code)
      // Include Disease and Clinical subtype
      return !info || info.type === 'Disease' || info.type === 'Clinical subtype'
    })
    .sort((a, b) => {
      // Prioritise: has prevalence > has definition > more symptoms
      const aPrev = prevalence.has(a[0]) ? 1 : 0
      const bPrev = prevalence.has(b[0]) ? 1 : 0
      if (aPrev !== bPrev) return bPrev - aPrev

      const aInfo = diseaseInfo.get(a[0])
      const bInfo = diseaseInfo.get(b[0])
      const aDef = aInfo?.definition ? 1 : 0
      const bDef = bInfo?.definition ? 1 : 0
      if (aDef !== bDef) return bDef - aDef

      return b[1].symptoms.size - a[1].symptoms.size
    })
    .slice(0, MAX_CONDITIONS)

  console.log(`   ${qualifiedCodes.length} conditions passed quality gate (>=${MIN_SYMPTOMS} symptoms)`)

  // ── Build conditions.json ─────────────────────────────────────────

  // Collect all HPO IDs used
  const usedHpoIds = new Set()

  const conditions = qualifiedCodes.map(([code, disease]) => {
    const symptoms = [...disease.symptoms]
    symptoms.forEach((id) => usedHpoIds.add(id))

    const info = diseaseInfo.get(code)
    const prev = prevalence.get(code)
    const ages = agesInheritance.get(code)

    return {
      id: `ORPHA:${code}`,
      name: info?.name || disease.name,
      description: info?.definition || `A rare condition characterised by ${symptoms.length} documented clinical features.`,
      symptoms,
      prevalence: prev || 'Unknown',
      inheritanceMode: ages?.inheritance || 'Unknown',
      ageOfOnset: ages?.ageOfOnset || 'Variable',
      orphanetUrl: `https://www.orpha.net/en/disease/detail/${code}`,
      keyInfo: '',
    }
  })

  // ── Build hpo-terms.json ──────────────────────────────────────────

  const hpoTermsOutput = [...usedHpoIds]
    .map((id) => {
      const term = hpoTerms.get(id)
      if (!term) return null
      return {
        id,
        name: term.name,
        synonyms: term.synonyms,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))

  // ── Write output ──────────────────────────────────────────────────

  console.log('\n8. Writing output files...')

  const conditionsPath = join(DATA_DIR, 'conditions-expanded.json')
  const termsPath = join(DATA_DIR, 'hpo-terms-expanded.json')

  writeFileSync(conditionsPath, JSON.stringify(conditions, null, 2))
  writeFileSync(termsPath, JSON.stringify(hpoTermsOutput, null, 2))

  console.log(`   ${conditionsPath} — ${conditions.length} conditions`)
  console.log(`   ${termsPath} — ${hpoTermsOutput.length} HPO terms`)

  // ── Stats ─────────────────────────────────────────────────────────

  console.log('\n── Summary ──')
  console.log(`Conditions: ${conditions.length}`)
  console.log(`HPO terms: ${hpoTermsOutput.length}`)
  const avgSymptoms = conditions.reduce((s, c) => s + c.symptoms.length, 0) / conditions.length
  console.log(`Avg symptoms/condition: ${avgSymptoms.toFixed(1)}`)
  const withPrevalence = conditions.filter((c) => c.prevalence !== 'Unknown').length
  console.log(`With prevalence data: ${withPrevalence} (${((withPrevalence / conditions.length) * 100).toFixed(0)}%)`)
  const withDefinition = conditions.filter((c) => !c.description.startsWith('A rare condition')).length
  console.log(`With definitions: ${withDefinition} (${((withDefinition / conditions.length) * 100).toFixed(0)}%)`)

  console.log('\n── Data Sources (all CC-BY-4.0) ──')
  console.log('HPO Annotations: https://hpo.jax.org/data/annotations')
  console.log('HPO Ontology: https://hpo.jax.org')
  console.log('Orphanet: https://www.orphadata.com (CC-BY-4.0)')
  console.log('\nDone!')
}

main().catch((e) => {
  console.error('Pipeline failed:', e)
  process.exit(1)
})
