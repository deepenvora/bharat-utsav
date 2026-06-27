function splitSentences(text) {
  if (!text) return [];
  return text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`;
}

export function generateSummary(entry) {
  if (!entry) return '';

  const sentences = [];

  const aboutSentences = splitSentences(entry.aboutLong);
  if (aboutSentences.length > 0) {
    sentences.push(truncate(aboutSentences.slice(0, 2).join(' '), 150));
  } else if (entry.whyCelebrated) {
    sentences.push(entry.whyCelebrated.trim());
  }

  const howSentences = splitSentences(entry.howCelebrated);
  if (howSentences.length > 0) {
    sentences.push(howSentences[0]);
  }

  if (entry.type === 'Festival') {
    const traditions = entry.traditions || [];
    const foods = entry.foods || [];
    if (traditions.length >= 2 && foods.length >= 1) {
      sentences.push(`Known for traditions like ${traditions[0]} and ${traditions[1]}, and dishes such as ${foods[0]}.`);
    }
  }

  return sentences.join(' ').trim();
}
