"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { SOSButton } from "./SOSButton";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative mx-auto min-h-dvh max-w-lg">
      <Header />
      <main className="px-4 pb-24 pt-4">{children}</main>
      <SOSButton />
      <BottomNav />
    </div>
  );
}
