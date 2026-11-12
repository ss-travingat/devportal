'use client';

import { usePathname } from 'next/navigation';
import PageHeader from './PageHeader';

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signin';

  return (
    <main
      className={`flex-1 min-w-0 min-h-screen bg-[#121212] flex flex-col overflow-x-clip${
        isAuthPage ? '' : ' md:ml-[220px] sidebar-collapsed:md:ml-16 md:transition-[margin-left] md:duration-200 md:ease-in-out'
      }`}
    >
      {!isAuthPage && <PageHeader />}
      {children}
    </main>
  );
}
