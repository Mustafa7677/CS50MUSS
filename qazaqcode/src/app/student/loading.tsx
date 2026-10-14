export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse space-y-4">
      <div className="h-8 w-56 rounded-lg bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-line" />)}</div>
      <div className="h-48 rounded-xl bg-line" />
      <span className="sr-only">Жүктелуде...</span>
    </div>
  );
}
