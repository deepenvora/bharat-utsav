const STARTER_PROMPTS = [
  'Which festivals are in March?',
  'Tell me about Onam',
  'Festivals celebrated in Kerala',
  'What is the significance of Holi?',
];

export default function StarterPills({ onSelect, scroll = false }) {
  return (
    <div className={scroll ? 'flex gap-2 overflow-x-auto px-4 py-3' : 'flex flex-wrap gap-2 p-4'}>
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
