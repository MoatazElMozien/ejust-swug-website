import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getSocialLinks, getTeam } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [socials, team] = await Promise.all([getSocialLinks(), getTeam()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <Header showTeam={team.length > 0} />
      <main className="flex-1">{children}</main>
      <Footer socials={socials} />
    </div>
  );
}
