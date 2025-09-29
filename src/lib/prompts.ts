export const SUMMARIZE_PROMPT_TEMPLATE = `You are helping people with Down syndrome and their families understand complex text.

TASK: Summarize the following text

REQUIREMENTS:
- Maximum {maxWords} words
- 8th grade reading level (ages 13-14)
- Use simple, clear language
- Short sentences (under 20 words each)
- Avoid medical jargon - use everyday words
- Keep all important information
- Make it easy to understand
- Write in a friendly, helpful tone

TEXT TO SUMMARIZE:
{text}

SUMMARY:`;

export function buildSummarizePrompt(text: string, maxWords: number): string {
  return SUMMARIZE_PROMPT_TEMPLATE
    .replace('{maxWords}', maxWords.toString())
    .replace('{text}', text);
}

export const READING_LEVEL_GUIDELINES = {
  8: {
    maxSentenceLength: 20,
    preferredWords: ['use', 'help', 'show', 'find', 'make', 'get', 'give', 'know'],
    avoidWords: ['utilize', 'facilitate', 'demonstrate', 'acquire', 'provide', 'comprehend']
  }
};

// Word replacement mappings for grade level simplification
export const WORD_SIMPLIFICATIONS = {
  'utilize': 'use',
  'demonstrate': 'show',
  'participate': 'take part',
  'approximately': 'about',
  'significant': 'important',
  'implement': 'do',
  'furthermore': 'also',
  'consequently': 'so',
  'individuals': 'people',
  'assistance': 'help',
  'facilitate': 'help',
  'comprehensive': 'complete',
  'methodology': 'method',
  'configuration': 'setup',
  'accompany': 'go with',
  'commence': 'start',
  'terminate': 'end',
  'subsequent': 'next',
  'previous': 'earlier',
  'additional': 'more',
  'sufficient': 'enough',
  'requirement': 'need',
  'component': 'part',
  'fundamental': 'basic',
  'essential': 'needed',
  'procedure': 'process',
  'alternative': 'other choice'
};