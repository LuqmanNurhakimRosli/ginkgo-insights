export function SuggestedPrompt({
  text,
  onSelect,
}: {
  text: string;
  onSelect: (t: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(text)}
      className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-[12.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-accent-foreground"
    >
      {text}
    </button>
  );
}
