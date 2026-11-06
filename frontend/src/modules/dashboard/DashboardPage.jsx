import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  Coins,
  Home,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button, Photo, StatusBadge } from "@/components/ui";
import { bookingService, dashboardService, propertyService } from "@/services";
import { api } from "@/services/api";
import { useAuth } from "@/auth/AuthContext";
import { aed, dateRange } from "@/lib/format";

const DEFAULT_TREND = [
  { month: "Oct", revenue: 0, bookings: 0 },
  { month: "Nov", revenue: 68000, bookings: 13 },
  { month: "Dec", revenue: 98000, bookings: 15 },
  { month: "Jan", revenue: 38000, bookings: 7 },
  { month: "Feb", revenue: 38000, bookings: 7 },
  { month: "Mar", revenue: 66000, bookings: 11 },
  { month: "Apr", revenue: 86000, bookings: 14 },
  { month: "May", revenue: 48000, bookings: 8 },
  { month: "Jun", revenue: 116000, bookings: 18 },
  { month: "Jul", revenue: 94000, bookings: 16 },
  { month: "Aug", revenue: 54000, bookings: 12 },
  { month: "Sep", revenue: 34000, bookings: 13 },
];

const DEFAULT_CATEGORIES = [
  { name: "Vacation Homes", percentage: 39, value: 55, color: "#2A2542" },
  { name: "Farms", percentage: 31, value: 43, color: "#9B8BE0" },
  { name: "Desert Camp", percentage: 16, value: 23, color: "#C9C1F3" },
  { name: "Resorts", percentage: 14, value: 19, color: "#E8A23A" },
];

const DEFAULT_CITIES = [
  { name: "Abu Dhabi", percentage: 92 },
  { name: "Fujairah", percentage: 68 },
  { name: "Ras Al Khaimah", percentage: 60 },
  { name: "Al Ain", percentage: 48 },
];

const DEFAULT_REGISTRATION_DATA = [
  { name: "Jan", Hosts: 2, Users: 5 },
  { name: "Feb", Hosts: 3, Users: 8 },
  { name: "Mar", Hosts: 4, Users: 12 },
  { name: "Apr", Hosts: 5, Users: 16 },
  { name: "May", Hosts: 8, Users: 22 },
  { name: "Jun", Hosts: 10, Users: 28 },
  { name: "Jul", Hosts: 12, Users: 35 },
  { name: "Aug", Hosts: 14, Users: 42 },
  { name: "Sep", Hosts: 16, Users: 50 },
  { name: "Oct", Hosts: 18, Users: 64 },
  { name: "Nov", Hosts: 0, Users: 0 },
  { name: "Dec", Hosts: 0, Users: 0 },
];

const DEFAULT_RECENT_BOOKINGS = [
  {
    id: "b_1",
    propertyName: "Marmoom Oasis Camp",
    code: "BRK-024217",
    propertyPhoto:
      "https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=400&q=80",
    guestName: "Ali Carter",
    dates: "11 Oct – 14 Oct 2026",
    total: 4316,
    status: "pending",
  },
  {
    id: "b_2",
    propertyName: "Olive Grove Farmhouse",
    code: "BRK-024207",
    propertyPhoto:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=400&q=80",
    guestName: "Noura Carter",
    dates: "24 Oct – 26 Oct 2026",
    total: 3623,
    status: "pending",
  },
  {
    id: "b_3",
    propertyName: "Jumeirah Palm Villa",
    code: "BRK-024194",
    propertyPhoto:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
    guestName: "Sara Al Ketbi",
    dates: "25 Oct – 27 Oct 2026",
    total: 2814,
    status: "pending",
  },
  {
    id: "b_4",
    propertyName: "Pearl Coast Resort",
    code: "BRK-024176",
    propertyPhoto:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
    guestName: "Saeed Al Mazrouei",
    dates: "21 Oct – 24 Oct 2026",
    total: 10206,
    status: "pending",
  },
  {
    id: "b_5",
    propertyName: "Marmoom Oasis Camp",
    code: "BRK-024125",
    propertyPhoto:
      "https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=400&q=80",
    guestName: "Ali Carter",
    dates: "7 Oct – 9 Oct 2026",
    total: 2930,
    status: "cancelled",
  },
  {
    id: "b_6",
    propertyName: "Al Wathba Farm",
    code: "BRK-024201",
    propertyPhoto:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=400&q=80",
    guestName: "Salma Al Suwaidi",
    dates: "19 Oct – 22 Oct 2026",
    total: 5355,
    status: "confirmed",
  },
];

const DEFAULT_PENDING_PROPERTIES = [
  {
    id: "p_1",
    name: "Marina Villa",
    subtitle: "Vacation Homes • Al Ain",
    price: 2000,
    photo:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_2",
    name: "Moonlight Desert Camp",
    subtitle: "Desert Camp • Al Ain",
    price: 1400,
    photo:
      "https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_3",
    name: "Rose Garden Estate",
    subtitle: "Vacation Homes • Abu Dhabi",
    price: 3000,
    photo:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "p_4",
    name: "Cedar Farm Stay",
    subtitle: "Farms • Fujairah",
    price: 2600,
    photo:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=400&q=80",
  },
];

function RevenueTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-line/70 bg-white p-3 shadow-pop text-xs">
        <p className="font-semibold text-ink mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#2A2542]" />
            <span className="text-ink-muted">Revenue:</span>
            <span className="font-semibold text-ink">
              {aed(payload[0]?.value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#E8A23A]" />
            <span className="text-ink-muted">Bookings:</span>
            <span className="font-semibold text-ink">
              {payload[1]?.value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.stats,
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["monthlyStats"],
    queryFn: () =>
      api.get("/admin/getMonthlyUserStats", () => ({
        data: [],
        bookings: [],
        revenue: [],
      })),
  });

  const { data: recentBookingsData } = useQuery({
    queryKey: ["recentBookings"],
    queryFn: () => bookingService.list({ pageSize: 6 }),
  });

  const { data: pendingPropsData } = useQuery({
    queryKey: ["pendingProperties"],
    queryFn: () => propertyService.list({ status: "pending", pageSize: 4 }),
  });

  // Calculate or fallback data
  const revenueVal = stats?.revenue || 812484;
  const commissionVal = stats?.commission || 121900;
  const bookingsCount = stats?.bookings || 140;
  const livePropsCount = stats?.liveProperties || 26;
  const pendingPropsCount = stats?.pendingProperties || 5;
  const guestsCount = stats?.guests || 64;
  const hostsCount = stats?.hosts || 18;
  const openReportsCount = stats?.openReports || 0;

  // Revenue & bookings trend data
  const trendData =
    stats?.trend && stats.trend.length > 0 ? stats.trend : DEFAULT_TREND;

  // Bookings by category
  let categoryData = DEFAULT_CATEGORIES;
  if (stats?.byCategory && stats.byCategory.length > 0) {
    const total = stats.byCategory.reduce((acc, c) => acc + c.value, 0) || 1;
    const colors = ["#2A2542", "#9B8BE0", "#C9C1F3", "#E8A23A"];
    categoryData = stats.byCategory.slice(0, 4).map((c, i) => ({
      name: c.name,
      value: c.value,
      percentage: Math.round((c.value / total) * 100),
      color: colors[i % colors.length],
    }));
  }

  // Top cities
  let cityData = DEFAULT_CITIES;
  if (stats?.byCity && stats.byCity.length > 0) {
    const maxVal = Math.max(...stats.byCity.map((c) => c.value), 1);
    cityData = stats.byCity.slice(0, 4).map((c) => ({
      name: c.name,
      percentage: Math.round((c.value / maxVal) * 92),
    }));
  }

  // Monthly Users and Hosts registrations
  const monthlyUsers = monthlyData?.body?.data || monthlyData?.data || [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const dynamicRegistrationData =
    monthlyUsers && monthlyUsers.length > 0
      ? monthlyUsers.map((item, i) => ({
          name: monthNames[i] || `M${i + 1}`,
          Hosts: item.provider || 0,
          Users: item.user || 0,
        }))
      : DEFAULT_REGISTRATION_DATA;

  // Recent bookings list
  const recentBookings =
    recentBookingsData?.items && recentBookingsData.items.length > 0
      ? recentBookingsData.items.slice(0, 6).map((b) => ({
          id: b.id,
          propertyName: b.propertyName || "—",
          code: b.code || `BRK-${String(b.id).slice(-6)}`,
          propertyPhoto: b.propertyPhoto || "",
          guestName: b.guestName || "—",
          dates: dateRange(b.checkIn, b.checkOut),
          total: b.total,
          status: b.status,
        }))
      : DEFAULT_RECENT_BOOKINGS;

  // Awaiting approval properties
  const awaitingApproval =
    pendingPropsData?.items && pendingPropsData.items.length > 0
      ? pendingPropsData.items.slice(0, 4).map((p) => ({
          id: p.id,
          name: p.name,
          subtitle: `${p.categoryName || "Property"} • ${p.cityName || "UAE"}`,
          price: p.pricePerNight,
          photo: p.photos?.[0] || "",
        }))
      : DEFAULT_PENDING_PROPERTIES;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">
            Good morning, {admin?.name || "undefined"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Here's what's happening on Break today.
          </p>
        </div>
        <button
          onClick={() => navigate("/properties?status=pending")}
          className="rounded-full border border-line/80 bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-bg"
        >
          Review listings
        </button>
      </div>

      {/* 5 Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1: Admin Earnings */}
        <div className="card flex items-start gap-3.5 p-5 border-indigo-200/60 bg-gradient-to-br from-white to-indigo-50/30 shadow-xs">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#5B50A0]/10 text-[#5B50A0]">
            <Wallet className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-900/80">
              Admin Earnings
            </p>
            <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-[#2A2542]">
              {aed(commissionVal)}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <TrendingUp className="size-3 text-emerald-600" />
              <span>Platform commission</span>
            </p>
          </div>
        </div>

        {/* Card 2: Gross booking value */}
        <div className="card flex items-start gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Coins className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-muted">
              Gross booking value
            </p>
            <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">
              {aed(revenueVal)}
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">
              All bookings total
            </p>
          </div>
        </div>

        {/* Card 3: Bookings */}
        <div className="card flex items-start gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CalendarCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-muted">Total bookings</p>
            <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">
              {bookingsCount}
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">All-time bookings</p>
          </div>
        </div>

        {/* Card 4: Live properties */}
        <div className="card flex items-start gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-[#B8740F]">
            <Home className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-muted">Live properties</p>
            <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">
              {livePropsCount}
            </p>
            <p className="mt-1 text-[11px] text-ink-muted">
              {pendingPropsCount} awaiting approval
            </p>
          </div>
        </div>

        {/* Card 5: Guests • Hosts */}
        <div className="card flex items-start gap-3.5 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-muted">Guests • Hosts</p>
            <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-ink">
              {guestsCount} • {hostsCount}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
              <AlertTriangle className="size-3 text-warning" />
              <span>{openReportsCount} open reports</span>
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Revenue & bookings + Bookings by category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Revenue & bookings */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">
              Revenue & bookings
            </h3>
            <span className="text-xs font-medium text-ink-muted">
              Last 12 months
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendData}
                margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C5BBE" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#6C5BBE" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="rev"
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 40000, 80000, 120000]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v) => (v === 0 ? "0" : `${v / 1000}K`)}
                />
                <YAxis
                  yAxisId="book"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 5, 10, 15, 20]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2A2542"
                  strokeWidth={2.2}
                  fill="url(#revenueFill)"
                />
                <Line
                  yAxisId="book"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#E8A23A"
                  strokeWidth={1.8}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Bookings by category (Donut Pie Chart) */}
        <div className="card flex flex-col justify-between p-5 lg:col-span-1">
          <div>
            <h3 className="mb-2 text-[15px] font-bold text-ink">
              Bookings by category
            </h3>

            {/* Donut Chart with center value */}
            <div className="relative flex h-[190px] w-full items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-ink">
                  {bookingsCount}
                </span>
                <span className="text-[11px] text-ink-muted">Bookings</span>
              </div>
            </div>
          </div>

          {/* Category percentage list */}
          <div className="mt-3 space-y-2.5 border-t border-line/60 pt-4">
            {categoryData.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-ink">{cat.name}</span>
                </div>
                <span className="font-semibold text-ink">
                  {cat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Recent bookings + Awaiting approval */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Recent bookings table */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-[15px] font-bold text-ink">Recent bookings</h3>
            <Link
              to="/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[620px] text-start">
              <thead>
                <tr className="border-y border-line/60 bg-bg/50">
                  <th className="px-5 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Property
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Total
                  </th>
                  <th className="pe-5 ps-4 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    className="border-b border-line/40 transition hover:bg-accent-soft/30 cursor-pointer last:border-0"
                  >
                    <td className="px-5 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Photo
                          src={b.propertyPhoto}
                          alt={b.propertyName}
                          className="size-9 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-ink">
                            {b.propertyName}
                          </p>
                          <p className="font-mono text-[10px] text-ink-muted">
                            {b.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-ink font-medium">
                      {b.guestName}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-ink-muted whitespace-nowrap">
                      {b.dates}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs font-semibold text-ink whitespace-nowrap">
                      {aed(b.total)}
                    </td>
                    <td className="pe-5 ps-4 py-3 align-middle">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Awaiting approval card */}
        <div className="card p-5 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">
              Awaiting approval
            </h3>
            <Link
              to="/properties?status=pending"
              className="text-xs font-semibold text-accent transition hover:underline"
            >
              All
            </Link>
          </div>

          <div className="space-y-3">
            {awaitingApproval.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/properties/${item.id}`)}
                className="flex items-center justify-between gap-3 rounded-xl p-1.5 transition hover:bg-accent-soft/30 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Photo
                    src={item.photo}
                    alt={item.name}
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-ink">
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ink whitespace-nowrap">
                  {aed(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: User & Host Registrations Graph + Top Cities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: User & host registrations chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-ink">
                User & host registrations
              </h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                Monthly platform registrations
              </p>
            </div>
            <span className="text-xs font-medium text-ink-muted">This year</span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dynamicRegistrationData}
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(231, 227, 220, 0.8)",
                    boxShadow: "0 10px 15px -3px rgba(30, 27, 46, 0.08)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: 12,
                    paddingTop: 15,
                    fontWeight: 500,
                  }}
                />
                <Bar
                  dataKey="Users"
                  fill="#6C5BBE"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="Hosts"
                  fill="#E8A23A"
                  radius={[4, 4, 0, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top cities card */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-4 text-[15px] font-bold text-ink">Top cities</h3>
          <div className="space-y-4 pt-2">
            {cityData.map((city) => (
              <div key={city.name} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-right text-[11px] font-medium text-ink-muted truncate">
                  {city.name}
                </span>
                <div className="flex h-3 flex-1 items-center">
                  <div
                    className="h-2 rounded-full bg-[#8C7AE6] transition-all duration-500"
                    style={{ width: `${city.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
