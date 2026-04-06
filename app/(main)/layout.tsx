import { MainSiteShell } from "@/components/layout/MainSiteShell";

export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return <MainSiteShell>{children}</MainSiteShell>;
}
