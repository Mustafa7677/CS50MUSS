"use client";
export default function StudentError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="card px-6 py-10 text-center">
      <p className="text-lg font-semibold">Бетті жүктеу мүмкін болмады</p>
      <p className="mt-1 text-sm text-ink-muted">Уақытша қате болды. Енгізген деректеріңіз жоғалған жоқ.</p>
      <button type="button" className="btn-primary mt-4" onClick={() => reset()}>Қайталау</button>
    </div>
  );
}
