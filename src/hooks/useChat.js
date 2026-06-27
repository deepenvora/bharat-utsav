import { useState } from 'react';
import events from '../data/india-cultural-calendar.json';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'tell', 'me', 'about', 'show', 'find', 'search', 'list', 'give',
  'what', 'which', 'who', 'when', 'where', 'why', 'how',
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or',
  'festival', 'festivals', 'celebrated', 'celebrate', 'celebration',
  'significance', 'do', 'does', 'can', 'you', 'please',
]);

function extractKeywords(query) {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) || [];
  const keywords = words.filter((word) => !STOP_WORDS.has(word));
  return keywords.length ? keywords : words;
}

function matchesKeyword(entry, keyword) {
  return (
    entry.title?.toLowerCase().includes(keyword) ||
    entry.keywords?.some((k) => k.toLowerCase().includes(keyword)) ||
    entry.state?.some((s) => s.toLowerCase().includes(keyword)) ||
    entry.whyCelebrated?.toLowerCase().includes(keyword) ||
    entry.religion?.toLowerCase().includes(keyword) ||
    entry.month?.toLowerCase() === keyword
  );
}

function searchFestivals(query, data) {
  const keywords = extractKeywords(query);
  return data.filter((entry) => keywords.some((keyword) => matchesKeyword(entry, keyword))).slice(0, 5);
}

function generateLocalResponse(query, data) {
  const results = searchFestivals(query, data);
  if (!results.length) {
    return "I couldn't find anything matching that. Try searching for a festival name, state, or month.";
  }

  if (results.length === 1) {
    const f = results[0];
    return `**${f.title}** (${f.month})\n\n${f.whyCelebrated}\n\n${f.howCelebrated || ''}`;
  }

  return (
    `Found ${results.length} festivals:\n\n` +
    results.map((f) => `• **${f.title}** — ${f.whyCelebrated?.slice(0, 80)}...`).join('\n')
  );
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) {
      return;
    }

    setMessages((current) => [...current, { role: 'user', content: trimmed }]);
    setIsTyping(true);

    const reply = generateLocalResponse(trimmed, events);
    setMessages((current) => [...current, { role: 'assistant', content: reply }]);
    setIsTyping(false);
  };

  return { messages, isTyping, sendMessage };
}
