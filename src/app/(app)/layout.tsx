import { getCurrentWedding } from "@/lib/wedding";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { Topbar, DesktopUserMenu } from "@/components/app/topbar";
import { themeToCss } from "@/lib/themes";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, wedding } = await getCurrentWedding();
  const partnerNames = `${wedding!.partner_one_name} & ${wedding!.partner_two_name}`;
  const themeCss = themeToCss(wedding!.theme);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <div className="min-h-screen flex bg-background">
        <Sidebar partnerNames={partnerNames} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar email={user.email ?? ""} partnerNames={partnerNames} weddingId={wedding!.id} />
          <DesktopUserMenu email={user.email ?? ""} weddingId={wedding!.id} />
          <main className="flex-1 container py-6 sm:py-8 pb-24 lg:pb-8">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </>
  );
}
