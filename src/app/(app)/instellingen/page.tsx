import { getCurrentWedding } from "@/lib/wedding";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = { title: "Instellingen" };

export default async function SettingsPage() {
  const { wedding, user } = await getCurrentWedding();
  if (!wedding) return null;
  return <SettingsView wedding={wedding} email={user.email ?? ""} />;
}
