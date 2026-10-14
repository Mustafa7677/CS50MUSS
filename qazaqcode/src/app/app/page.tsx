import { redirect } from "next/navigation";
import { homeFor, requireContext } from "@/lib/context";

export default async function AppIndex() {
  redirect(homeFor(await requireContext()));
}
