export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className="font-display text-2xl leading-none tracking-tight">Natural Land</span>
      <span className="rounded-sm bg-sun px-1.5 py-1 text-[0.65rem] font-bold leading-none tracking-[0.2em] text-ink">
        CR
      </span>
    </span>
  );
}
