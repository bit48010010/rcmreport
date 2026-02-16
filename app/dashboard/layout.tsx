"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  children?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    label: "แดชบอร์ด",
    href: "/dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "ผู้ป่วยนอก",
    href: "/dashboard/outpatient",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    children: [
      { label: "สรุปภาพรวม", href: "/dashboard/outpatient" },
      { label: "รายบุคคล", href: "/dashboard/outpatient/individual" },
    ],
  },
  {
    label: "ผู้ป่วยใน",
    href: "/dashboard/inpatient",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    label: "ส่งเสริมป้องกัน",
    href: "/dashboard/prevention",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      router.push("/");
      return;
    }
    setUserName(localStorage.getItem("user") || "User");
    setMounted(true);

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("th-TH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("user");
    router.push("/");
  };

  // Determine page title from pathname
  const getPageTitle = () => {
    for (const item of menuItems) {
      if (item.children) {
        const child = item.children.find((c) => c.href === pathname);
        if (child) return `${item.label} - ${child.label}`;
      }
      if (item.href === pathname) return item.label;
    }
    return "แดชบอร์ด";
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col shrink-0 shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <Image
            src="/logorcm.png"
            alt="RCM Logo"
            width={40}
            height={40}
            className="rounded-xl shrink-0"
          />
          {sidebarOpen && (
            <div className="animate-slide-in-left">
              <h2 className="text-sm font-bold text-white">RCM Report</h2>
              <p className="text-[10px] text-blue-200">Management System</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1 mt-4">
          {menuItems.map((item, i) => {
            const isActive = pathname === item.href || (item.children && item.children.some((c) => c.href === pathname));
            const isExpanded = isActive && !!item.children;

            return (
              <div key={i}>
                {item.children ? (
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white font-semibold shadow-sm"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <svg className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/20 text-white font-semibold shadow-sm"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                    </svg>
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                )}

                {/* Sub-menu */}
                {isExpanded && sidebarOpen && item.children && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children.map((child, j) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={j}
                          href={child.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                            isChildActive
                              ? "bg-white/15 text-white font-semibold"
                              : "text-blue-200 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isChildActive ? "bg-white" : "bg-blue-300"}`} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Toggle */}
        <div className="p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {sidebarOpen && <span>ย่อเมนู</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{currentTime}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {/* User Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{userName}</span>
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 bg-gray-50 min-h-[calc(100vh-65px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
