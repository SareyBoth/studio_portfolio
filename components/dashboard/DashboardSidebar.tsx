'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Frame,
  FolderKanban,
  Sparkles,
  Briefcase,
  GraduationCap,
  Inbox,
  HardDrive,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface DashboardSidebarProps {
  adminName: string;
  adminEmail: string;
  unreadInquiries: number;
}

export default function DashboardSidebar({
  adminName,
  adminEmail,
  unreadInquiries,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Profile & CV', icon: User },
    { href: '/dashboard/studio', label: '3D Studio Frames', icon: Frame },
    { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
    { href: '/dashboard/skills', label: 'Skills', icon: Sparkles },
    { href: '/dashboard/experience', label: 'Experience', icon: Briefcase },
    { href: '/dashboard/education', label: 'Education', icon: GraduationCap },
    { href: '/dashboard/inquiries', label: 'Inquiries', icon: Inbox, badge: unreadInquiries },
    { href: '/dashboard/media', label: 'R2 Media', icon: HardDrive },
    { href: '/dashboard/settings', label: 'Security & Redis', icon: Settings },
  ];

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const renderLinks = () => (
    <nav className="flex flex-col gap-1 flex-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition-colors ${
              active
                ? 'bg-[#d7ff3f] text-black font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-black text-[#d7ff3f]' : 'bg-[#d7ff3f] text-black'
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#14151a]/95 backdrop-blur-xl border-b border-white/10">
        <Link href="/dashboard" className="font-mono text-sm font-black text-white">
          STUDIO<span className="text-[#d7ff3f]">.CMS</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300"
          >
            Studio ↗
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle dashboard navigation"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-40 bg-[#0e1015] border-t border-white/10 flex flex-col">
          {renderLinks()}
          <div className="p-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#111217] border-r border-white/10">
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="font-mono text-base font-black text-white block">
              STUDIO<span className="text-[#d7ff3f]">.CMS</span>
            </Link>
            <span className="text-[10px] font-mono text-zinc-500">
              PG · Redis · Cloudflare R2
            </span>
          </div>
          <Link
            href="/"
            title="View Live 3D Studio"
            className="p-2 rounded-lg bg-white/5 hover:bg-[#d7ff3f] hover:text-black text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {renderLinks()}

        <div className="p-4 border-t border-white/10 flex flex-col gap-3">
          <div className="px-2">
            <div className="text-xs font-bold text-white truncate">{adminName}</div>
            <div className="text-[11px] font-mono text-zinc-500 truncate">{adminEmail}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-zinc-300 hover:text-red-300 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
