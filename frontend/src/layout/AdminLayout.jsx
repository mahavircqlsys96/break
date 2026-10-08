import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronDown,
  Database,
  FileText,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Send,
  Settings,
  Star,
  UserRound,
  Users,
  Wallet,
  X,
  ShieldCheck,
  Flag,
  User,
  MapPin,
  CreditCard,
  Target,
  PawPrint
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/Logo";
import { Avatar, IconButton } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";

const NAV = [
  {
    group: "MAIN",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    group: "USERS & HOSTS",
    items: [
      { to: "/guests", label: "Users", icon: Users },
      { to: "/hosts", label: "Hosts", icon: UserRound },
    ],
  },
  {
    group: "PROPERTIES",
    items: [
      { to: "/properties", label: "Properties", icon: Building2 },
      { to: "/property-types", label: "Property Types", icon: Database },
      { to: "/property-amenities", label: "Property Amenities", icon: Star },
      { to: "/friendly-animals", label: "Friendly Animals", icon: PawPrint },
    ],
  },
  {
    group: "BOOKINGS & FINANCE",
    items: [
      { to: "/bookings", label: "Bookings", icon: CalendarCheck },
      { to: "/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    group: "CONTENT & SUPPORT",
    items: [
      { to: "/reports", label: "Reports", icon: Flag },
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/contact-us", label: "Support", icon: Headphones },
    ],
  },
  {
    group: "CMS PAGES",
    items: [
      { to: "/cms/aboutUs", label: "About Us", icon: FileText },
      { to: "/cms/privacy", label: "Privacy Policy", icon: ShieldCheck },
      { to: "/cms/terms", label: "Terms & Conditions", icon: FileText },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-[#11131c] text-white">
      <div className="flex h-[72px] items-center px-6 pt-4">
        <Logo light={true} />
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 pt-6 scrollbar-thin">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {g.group}
            </p>
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.to === "/"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                        isActive
                          ? "bg-gradient-to-r from-[#d8356b] to-[#714fb2] text-white shadow-sm"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <it.icon
                          className={cn(
                            "size-5",
                            it.iconColor ? it.iconColor : (isActive ? "text-white" : "text-white/40 group-hover:text-white/70")
                          )}
                        />
                        <span className="flex-1">{it.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

function UserMenu() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full py-1 pe-2 ps-1 transition"
      >
        <span className="hidden text-end leading-tight sm:block">
          <span className="block text-[14px] font-medium text-ink">{admin?.name || "Admin"}</span>
        </span>
        {admin?.image ? (
          <img
            src={import.meta.env.VITE_IMAGE_BASE + (admin.image.startsWith('/') ? admin.image.substring(1) : admin.image)}
            alt={admin.name || "Admin"}
            className="size-8 rounded-full bg-gray-200 object-cover"
          />
        ) : (
          <Avatar name={admin?.name || "Admin"} size={32} />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-40 mt-2 w-52 overflow-hidden rounded-2xl border border-line/70 bg-surface p-1.5 shadow-pop">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-danger hover:bg-danger-soft"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-[280px] max-w-[85vw]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <IconButton
              label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="absolute end-3 top-4 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </IconButton>
          </aside>
        </div>
      )}

      <div className="lg:ps-[264px] flex flex-col min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pb-0">
          <header className="flex h-[72px] items-center gap-4 rounded-2xl bg-white px-4 shadow-sm">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-lg"
            >
              <Menu className="size-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              {(() => {
                const item = NAV.flatMap(g => g.items).find(i => i.to === location.pathname);
                return item ? item.label : "Dashboard";
              })()}
            </h2>

            <div className="flex-1" />
            <UserMenu />
          </header>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
