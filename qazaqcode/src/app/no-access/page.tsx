import { requireContext } from "@/lib/context";
import { logoutAction } from "../actions";

export default async function NoAccess() {
  const ctx = await requireContext();
  return (
    <main id="main" className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-md p-7">
        <h1 className="text-xl font-bold">Ұйымға қосылмағансыз</h1>
        <p className="mt-2 text-sm text-ink-muted">{ctx.fullName}, аккаунтыңыз әлі ешбір мектепке қосылмаған. Мектеп әкімшісінен шақыру сілтемесін, не мұғалімнен сынып кодын сұраңыз.</p>
        <form action={logoutAction} className="mt-4"><button className="btn-secondary" type="submit">Шығу</button></form>
      </div>
    </main>
  );
}
