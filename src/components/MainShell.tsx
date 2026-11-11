'use client';

import { usePathname } from 'next/navigation';
import PageHeader from './PageHeader';

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signin';

  return (
    <main
      className={`flex-1 min-h-screen bg-[#121212] flex flex-col overflow-x-hidden${
        isAuthPage ? '' : ' ml-[220px]'
      }`}
    >
      {!isAuthPage && <PageHeader />}
      {children}
    </main>
  );
}
