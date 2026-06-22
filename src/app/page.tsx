import { redirect } from "next/navigation";

import { getHomePathForCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  redirect(await getHomePathForCurrentUser());
}
