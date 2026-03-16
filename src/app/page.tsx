import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  
  if (session) {
    if (session.user?.role === "owner") {
      redirect("/owner/dashboard");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
