import { searchHsn } from './hsn-search.service';
import { groqModel, groqApiUrl, nodeEnv } from '../config/env';
import type { PublicHsnResult, ChatResponse, GroqEvidenceItem } from '../types';

function formatRate(value: number | null): string {
  return value === null || value === undefined ? 'Not specified in dataset' : `${value}%`;
}

function buildFallbackAnswer(best: PublicHsnResult): string {
  const parts = [
    `### Primary Classification: HSN ${best.hsnCode}`,
    `**Description:** ${best.description}`,
    '',
    '#### Applicable GST Rates',
    `- **IGST (Inter-State):** ${formatRate(best.igst)}`,
    `- **CGST (Central Tax):** ${formatRate(best.cgst)}`,
    `- **SGST / UTGST (State Tax):** ${formatRate(best.sgst)}`,
    ''
  ];

  if (best.condition) {
    parts.push(`**Condition / Proviso:** ${best.condition}`, '');
  }

  parts.push(
    '> **Note:** Classification depends on precise product characteristics, material composition, packaging, and commercial use. Please verify with official GST schedule updates.'
  );

  return parts.join('\n');
}

async function generateGroundedAnswer(question: string, results: PublicHsnResult[]): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const evidence: GroqEvidenceItem[] = results.map((item, index) => ({
    sourceId: `S${index + 1}`,
    hsnCode: item.hsnCode,
    description: item.description,
    cgst: item.cgst,
    sgst: item.sgst,
    igst: item.igst,
    condition: item.condition
  }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(groqApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: groqModel,
        temperature: 0,
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: [
              'You are RAGChatbot, an expert Indian HSN & GST classification assistant.',
              'Answer ONLY from the supplied evidence dataset.',
              'Note that in official customs tariff nomenclature, computers, laptops, and data processing hardware are classified under "Automatic Data Processing Machines" (HSN 8471 / 847130 / 847141).',
              'Format your answer cleanly with Markdown headings, structured tables for rates, and concise bullet points.',
              'Structure your response using these exact sections:',
              '## 1) Primary HSN Match & Code',
              '## 2) GST Rate Breakdown (render a clean Markdown table with columns: | HSN Code | Description | CGST | SGST | IGST |)',
              '## 3) Specific Conditions or Exemptions',
              '## 4) What to Double-Check',
              'CRITICAL GST RULE: In Indian GST, IGST = CGST + SGST (for instance, 9% CGST + 9% SGST = 18% IGST). Never double-count rates or hallucinate rates like 36%.',
              'Cite matching sources inline using [S1], [S2] tags.',
              'Never invent rates or assume missing rates are 0%. Clearly indicate if unspecified in the dataset.',
              'Always state that final classification must be verified against official CBIC / GST notifications.'
            ].join(' ')
          },
          {
            role: 'user',
            content: JSON.stringify({ question, evidence })
          }
        ]
      })
    });

    if (!response.ok) {
      const error = new Error(`Groq request failed with status ${response.status}`) as Error & { code?: string };
      error.code = 'GROQ_PROVIDER_ERROR';
      throw error;
    }
    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    return payload.choices?.[0]?.message?.content?.trim() || null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function answerProductQuestion(message: string): Promise<ChatResponse> {
  const results = searchHsn(message, 5);
  if (!results.length || results[0].score < 2) {
    return {
      answer: "I couldn't find a relevant match in the supplied dataset. Try using more specific product keywords, material types, or an exact HSN code.",
      results: [],
      needsVerification: true,
      method: 'hybrid lexical retrieval',
      disclaimer: 'No relevant source record was found. Do not treat this as a tax classification.'
    };
  }

  let answer: string | null = null;
  let mode = 'retrieval-only fallback';
  try {
    answer = await generateGroundedAnswer(message, results);
    if (answer) mode = 'RAG: dataset retrieval + Groq generation';
  } catch (error: any) {
    if (nodeEnv !== 'production') {
      console.warn('AI provider unavailable; using grounded fallback:', error?.message);
    }
  }
  if (!answer) answer = buildFallbackAnswer(results[0]);

  return {
    answer,
    results,
    needsVerification: true,
    method: mode,
    disclaimer: 'HSN/GST values are reproduced from the official dataset. Verify classification and current tax treatment with authoritative CBIC notifications; this does not constitute legal or tax advice.'
  };
}
