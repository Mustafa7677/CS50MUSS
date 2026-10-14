"use client";
export default function SchoolError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center" role="alert">
      <h1 className="text-lg font-bold">Бетті жүктеу мүмкін болмады</h1>
      <p className="mt-2 text-sm text-ink-muted">Күтпеген қате болды. Қайталап көріңіз; қате сақталса, платформа әкімшісіне хабарласыңыз.</p>
      <button type="button" onClick={reset} className="btn-primary mt-4">Қайталау</button>
    </div>
  );
}
