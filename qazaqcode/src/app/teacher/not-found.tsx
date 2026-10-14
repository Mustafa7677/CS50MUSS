import Link from "next/link";

export default function TeacherNotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="text-xl font-bold">Бет табылмады</h1>
      <p className="mt-1 text-sm text-ink-muted">Мұндай сынып, тапсырма не жұмыс жоқ немесе оған қолжетімділігіңіз жоқ.</p>
      <Link href="/teacher" className="btn-primary mt-5">Сыныптарыма оралу</Link>
    </div>
  );
}
