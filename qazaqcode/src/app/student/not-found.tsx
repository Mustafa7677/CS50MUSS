import Link from "next/link";

export default function StudentNotFound() {
  return (
    <div className="card px-6 py-12 text-center" data-testid="not-found">
      <p className="text-4xl font-bold text-brand">404</p>
      <p className="mt-2 text-lg font-semibold">Бет табылмады</p>
      <p className="mt-1 text-sm text-ink-muted">Тапсырма жоқ немесе ол сіздің сыныбыңызға берілмеген.</p>
      <Link href="/student/assignments" className="btn-primary mt-5">Тапсырмаларыма оралу</Link>
    </div>
  );
}
