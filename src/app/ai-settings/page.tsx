import { redirect } from "next/navigation";

export default function AiSettingsRedirect() {
  redirect("/settings?tab=ai");
}
