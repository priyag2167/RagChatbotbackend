export interface RawHsnRecord {
  id?: string | number;
  display?: string;
  CGST?: string | number | null;
  SGST?: string | number | null;
  IGST?: string | number | null;
  Condition?: string | null;
}

export interface RawDatabase {
  chapters?: unknown[];
  hsn_sac_records?: RawHsnRecord[];
}

export interface InternalHsnRecord {
  id: string;
  description: string;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  condition: string;
  normalized: string;
  words: Set<string>;
}

export interface PublicHsnResult {
  hsnCode: string;
  description: string;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  condition: string | null;
  score: number;
  source: string;
}

export interface DatasetStats {
  records: number;
  chapters: number;
}

export interface ChatResponse {
  answer: string;
  results: PublicHsnResult[];
  needsVerification: boolean;
  method: string;
  disclaimer: string;
}

export interface GroqEvidenceItem {
  sourceId: string;
  hsnCode: string;
  description: string;
  cgst: number | null;
  sgst: number | null;
  igst: number | null;
  condition: string | null;
}
