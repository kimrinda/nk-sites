export default function Loading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="aspect-[4/5] animate-pulse rounded-[28px] bg-[var(--muted)]" />
      ))}
    </div>
  );
}
