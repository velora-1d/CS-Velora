import { redirect } from "next/navigation";

export default function BotSettingsRedirect() {
  redirect("/settings?tab=bot");
}
