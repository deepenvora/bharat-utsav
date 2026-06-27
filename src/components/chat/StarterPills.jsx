const STARTER_PROMPTS = [
  'Which festivals are in March?',
  'Tell me about Onam',
  'Festivals celebrated in Kerala',
  'What is the significance of Holi?',
];

export default function StarterPills({ onSelect }) {
  return (
    <div className="flex flex-col gap-2 p-4 md:flex-row md:flex-wrap">
      {STARTER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-left text-sm text-[var(--color-text-primary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] md:w-auto"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
