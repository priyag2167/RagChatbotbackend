import fs from 'node:fs';
import path from 'node:path';
import { normalize, tokenize } from '../utils/normalize';
import type {
  RawDatabase,
  RawHsnRecord,
  InternalHsnRecord,
  PublicHsnResult,
  DatasetStats
} from '../types';

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'gst_hsn_sac_database.json');
const raw: RawDatabase = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const chapters = raw.chapters || [];

function parseRate(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(String(value).replace(/%/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

const records: InternalHsnRecord[] = (raw.hsn_sac_records || [])
  .map((record: RawHsnRecord) => ({
    id: String(record.id ?? '').trim(),
    description: String(record.display ?? '').trim(),
    cgst: parseRate(record.CGST),
    sgst: parseRate(record.SGST),
    igst: parseRate(record.IGST),
    condition: String(record.Condition ?? '').trim(),
    normalized: normalize(`${record.id ?? ''} ${record.display ?? ''} ${record.Condition ?? ''}`),
    words: new Set(tokenize(`${record.display ?? ''} ${record.Condition ?? ''}`))
  }))
  .filter(record => record.id && record.description);

function toPublicRecord(record: InternalHsnRecord, score: number): PublicHsnResult {
  return {
    hsnCode: record.id,
    description: record.description,
    cgst: record.cgst,
    sgst: record.sgst,
    igst: record.igst,
    condition: record.condition || null,
    score: Number(score.toFixed(3)),
    source: 'Provided HSN & GST dataset'
  };
}

interface TariffMapping {
  targetHsns: string[];
  keywords: string[];
}

const TARIFF_SYNONYMS: Record<string, TariffMapping> = {
  computer: { targetHsns: ['8471', '847130', '847141'], keywords: ['automatic', 'data', 'processing', 'machines'] },
  computers: { targetHsns: ['8471', '847130', '847141'], keywords: ['automatic', 'data', 'processing', 'machines'] },
  pc: { targetHsns: ['8471', '847141'], keywords: ['automatic', 'data', 'processing', 'machines'] },
  desktop: { targetHsns: ['847141', '8471'], keywords: ['automatic', 'data', 'processing'] },
  desktops: { targetHsns: ['847141', '8471'], keywords: ['automatic', 'data', 'processing'] },
  laptop: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  laptops: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  notebook: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  notebooks: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  tablet: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  tablets: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  ipad: { targetHsns: ['847130', '8471'], keywords: ['portable', 'automatic', 'data', 'processing'] },
  mobile: { targetHsns: ['8517', '851712', '851713'], keywords: ['cellular', 'telephones', 'wireless', 'network'] },
  mobiles: { targetHsns: ['8517', '851712', '851713'], keywords: ['cellular', 'telephones'] },
  phone: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  phones: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  cellphone: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  cellphones: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  smartphone: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  smartphones: { targetHsns: ['8517', '851712'], keywords: ['cellular', 'telephones'] },
  printer: { targetHsns: ['8443', '847160'], keywords: ['printing', 'machinery', 'input', 'output'] },
  printers: { targetHsns: ['8443', '847160'], keywords: ['printing', 'machinery', 'input', 'output'] },
  keyboard: { targetHsns: ['847160'], keywords: ['input', 'units', 'automatic', 'data', 'processing'] },
  keyboards: { targetHsns: ['847160'], keywords: ['input', 'units', 'automatic', 'data', 'processing'] },
  mouse: { targetHsns: ['847160'], keywords: ['input', 'units', 'automatic', 'data', 'processing'] },
  monitor: { targetHsns: ['8528', '847160'], keywords: ['monitors', 'projectors'] },
  monitors: { targetHsns: ['8528', '847160'], keywords: ['monitors', 'projectors'] },
  car: { targetHsns: ['8703', '8702'], keywords: ['motor', 'cars', 'vehicles'] },
  cars: { targetHsns: ['8703', '8702'], keywords: ['motor', 'cars', 'vehicles'] },
  automobile: { targetHsns: ['8703'], keywords: ['motor', 'cars', 'vehicles'] },
  automobiles: { targetHsns: ['8703'], keywords: ['motor', 'cars', 'vehicles'] },
  bike: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  bikes: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  motorcycle: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  motorcycles: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  scooter: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  scooters: { targetHsns: ['8711'], keywords: ['motorcycles', 'mopeds'] },
  ac: { targetHsns: ['8415'], keywords: ['air', 'conditioning', 'machines'] },
  fridge: { targetHsns: ['8418'], keywords: ['refrigerators', 'freezers'] },
  refrigerator: { targetHsns: ['8418'], keywords: ['refrigerators', 'freezers'] },
  refrigerators: { targetHsns: ['8418'], keywords: ['refrigerators', 'freezers'] },
  tv: { targetHsns: ['8528'], keywords: ['reception', 'apparatus', 'television'] },
  television: { targetHsns: ['8528'], keywords: ['reception', 'apparatus', 'television'] },
  televisions: { targetHsns: ['8528'], keywords: ['reception', 'apparatus', 'television'] },
  clothes: { targetHsns: ['6109', '6203', '6204'], keywords: ['articles', 'apparel', 'clothing'] },
  clothing: { targetHsns: ['6109', '6203', '6204'], keywords: ['articles', 'apparel', 'clothing'] },
  garments: { targetHsns: ['6109', '6203', '6204'], keywords: ['articles', 'apparel', 'clothing'] },
  shirt: { targetHsns: ['6105', '6205'], keywords: ['shirts', 'apparel'] },
  shirts: { targetHsns: ['6105', '6205'], keywords: ['shirts', 'apparel'] },
  tshirt: { targetHsns: ['6109'], keywords: ['t-shirts', 'singlets', 'apparel'] },
  tshirts: { targetHsns: ['6109'], keywords: ['t-shirts', 'singlets', 'apparel'] },
  shoe: { targetHsns: ['6401', '6402', '6403', '6404'], keywords: ['footwear'] },
  shoes: { targetHsns: ['6401', '6402', '6403', '6404'], keywords: ['footwear'] },
  footwear: { targetHsns: ['6401', '6402', '6403', '6404'], keywords: ['footwear'] },
  medicine: { targetHsns: ['3004'], keywords: ['medicaments', 'therapeutic', 'prophylactic'] },
  medicines: { targetHsns: ['3004'], keywords: ['medicaments', 'therapeutic', 'prophylactic'] },
  drug: { targetHsns: ['3004'], keywords: ['medicaments', 'therapeutic'] },
  drugs: { targetHsns: ['3004'], keywords: ['medicaments', 'therapeutic'] },
  pharma: { targetHsns: ['3004'], keywords: ['medicaments', 'pharmaceutical'] },
  pharmaceutical: { targetHsns: ['3004'], keywords: ['medicaments', 'pharmaceutical'] },
  gold: { targetHsns: ['7113', '7108'], keywords: ['jewellery', 'gold', 'precious'] },
  jewellery: { targetHsns: ['7113'], keywords: ['articles', 'jewellery'] },
  jewelry: { targetHsns: ['7113'], keywords: ['articles', 'jewellery'] },
  cement: { targetHsns: ['2523'], keywords: ['portland', 'cement', 'clinkers'] },
  steel: { targetHsns: ['7208', '7210', '7214'], keywords: ['steel', 'flat-rolled', 'iron'] },
  iron: { targetHsns: ['7208', '7210', '7308'], keywords: ['iron', 'steel'] },
  software: { targetHsns: ['997331', '85238020'], keywords: ['software', 'licensing', 'databases'] },
  hotel: { targetHsns: ['9963', '996311'], keywords: ['accommodation', 'hotel'] },
  restaurant: { targetHsns: ['9963', '996331'], keywords: ['restaurant', 'food', 'beverage'] },
  food: { targetHsns: ['996331', '2106'], keywords: ['food', 'beverage', 'edible'] },
  transport: { targetHsns: ['9965', '9967'], keywords: ['transport', 'services', 'goods'] },
  courier: { targetHsns: ['9968'], keywords: ['postal', 'courier', 'services'] },
  consulting: { targetHsns: ['9983'], keywords: ['other', 'professional', 'technical', 'services'] },
  legal: { targetHsns: ['9982'], keywords: ['legal', 'services'] }
};

export function searchHsn(query: string, requestedLimit = 5): PublicHsnResult[] {
  const normalizedQuery = normalize(query);
  const queryTokens = [...new Set(tokenize(query))];
  const numericQuery = /^[0-9]{2,8}$/.test(normalizedQuery.replace(/\s/g, ''))
    ? normalizedQuery.replace(/\s/g, '')
    : '';

  if (!queryTokens.length && !numericQuery) return [];

  // Commercial synonym & classification expansion
  const targetHsnSet = new Set<string>();
  const expansionKeywords = new Set<string>();

  for (const token of queryTokens) {
    const mapping = TARIFF_SYNONYMS[token.toLowerCase()];
    if (mapping) {
      mapping.targetHsns.forEach(hsn => targetHsnSet.add(hsn));
      mapping.keywords.forEach(kw => expansionKeywords.add(kw));
    }
  }

  const targetHsns = Array.from(targetHsnSet);
  const expansionTokens = Array.from(expansionKeywords);

  const ranked: Array<{ record: InternalHsnRecord; score: number }> = [];
  for (const record of records) {
    let score = 0;

    if (numericQuery && record.id === numericQuery) score += 100;
    else if (numericQuery && record.id.startsWith(numericQuery)) score += 28;

    if (normalizedQuery && record.normalized.includes(normalizedQuery)) score += 18;

    // Direct boost for official tariff heading target matches
    if (targetHsns.length > 0) {
      if (targetHsns.includes(record.id)) {
        score += 65;
      } else if (targetHsns.some(h => record.id.startsWith(h))) {
        score += 42;
      }
    }

    let matchedTokens = 0;
    for (const token of queryTokens) {
      if (record.words.has(token)) {
        score += 5;
        matchedTokens += 1;
      } else if (token.length >= 4 && [...record.words].some(word => word.startsWith(token))) {
        score += 1.5;
      }
    }

    // Boost for matching expansion tariff keywords (e.g. 'automatic', 'data', 'processing')
    for (const kw of expansionTokens) {
      if (record.words.has(kw)) {
        score += 3.5;
      }
    }

    if (queryTokens.length && matchedTokens === queryTokens.length) score += 4;
    if (queryTokens.length > 1 && matchedTokens / queryTokens.length < 0.5 && targetHsns.length === 0) {
      score *= 0.55;
    }

    // Slightly prefer specific subheadings over broad headings on similar scores.
    score += Math.min(record.id.length, 8) * 0.08;

    if (score > 0) ranked.push({ record, score });
  }

  ranked.sort((a, b) => b.score - a.score || b.record.id.length - a.record.id.length);
  const limit = Math.min(Math.max(Number(requestedLimit) || 5, 1), 8);
  return ranked.slice(0, limit).map(item => toPublicRecord(item.record, item.score));
}

export function getDatasetStats(): DatasetStats {
  return { records: records.length, chapters: chapters.length };
}
