import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  ShieldCheck,
  CalendarCheck,
  Banknote,
  ClipboardList,
  TrendingUp,
  Wallet,
  Tag,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
const statCards = [
  {
    title: "TOTAL USERS",
    value: "65",
    icon: Users,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-50",
  },
  {
    title: "HOSTS",
    value: "2",
    icon: ShieldCheck,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-50",
  },
  {
    title: "BOOKINGS",
    value: "18",
    icon: CalendarCheck,
    colorClass: "text-orange-500",
    bgClass: "bg-orange-50",
  },
  {
    title: "REVENUE (ADMIN)",
    value: "0",
    icon: Banknote,
    colorClass: "text-rose-500",
    bgClass: "bg-rose-50",
  },
  {
    title: "ACTIVE BOOKINGS",
    value: "3",
    icon: ClipboardList,
    colorClass: "text-cyan-500",
    bgClass: "bg-cyan-50",
  },
  {
    title: "MONTHLY REVENUE",
    value: "0",
    icon: TrendingUp,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-50",
  },
  {
    title: "PENDING WITHDRAWALS",
    value: "4",
    icon: Wallet,
    colorClass: "text-red-500",
    bgClass: "bg-red-50",
  },
  {
    title: "AVG BOOKING VALUE",
    value: "$275.56",
    icon: Tag,
    colorClass: "text-teal-500",
    bgClass: "bg-teal-50",
  },
];

const registrationData = [
  { name: "Jan", Hosts: 0, Users: 0 },
  { name: "Feb", Hosts: 0, Users: 0 },
  { name: "Mar", Hosts: 0, Users: 0 },
  { name: "Apr", Hosts: 0, Users: 0 },
  { name: "May", Hosts: 6, Users: 12 },
  { name: "Jun", Hosts: 1, Users: 20 },
  { name: "Jul", Hosts: 0, Users: 19 },
  { name: "Aug", Hosts: 3, Users: 13 },
  { name: "Sep", Hosts: 0, Users: 1 },
  { name: "Oct", Hosts: 0, Users: 0 },
  { name: "Nov", Hosts: 0, Users: 0 },
  { name: "Dec", Hosts: 0, Users: 0 },
];

const bookingTrendData = [
  { name: "Jan", bookings: 0 },
  { name: "Feb", bookings: 0 },
  { name: "Mar", bookings: 0 },
  { name: "Apr", bookings: 0 },
  { name: "May", bookings: 0 },
  { name: "Jun", bookings: 0 },
  { name: "Jul", bookings: 0 },
  { name: "Aug", bookings: 0 },
  { name: "Sep", bookings: 5 },
  { name: "Oct", bookings: 12 },
  { name: "Nov", bookings: 0 },
  { name: "Dec", bookings: 0 },
];

export function DashboardPage() {
  const { data: dashData } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: () => api.get("/admin/dashboard_data", () => ({ data: {}, topCategories: [], topLocations: [], recentBookings: [], recentUsers: [], recentProviders: [] })),
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["monthlyStats"],
    queryFn: () => api.get("/admin/getMonthlyUserStats", () => ({ data: [], bookings: [], revenue: [] })),
  });

  const stats = dashData?.body?.data || dashData?.data || {};
  const monthlyUsers = monthlyData?.body?.data || monthlyData?.data || [];
  const monthlyBookings = monthlyData?.body?.bookings || monthlyData?.bookings || [];

  const dynamicStatCards = [
    {
      title: "TOTAL USERS",
      value: stats.usersCount || "0",
      icon: Users,
      colorClass: "text-blue-500",
      bgClass: "bg-blue-50",
    },
    {
      title: "HOSTS",
      value: stats.providersCount || "0",
      icon: ShieldCheck,
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-50",
    },
    {
      title: "BOOKINGS",
      value: stats.bookingsCount || "0",
      icon: CalendarCheck,
      colorClass: "text-orange-500",
      bgClass: "bg-orange-50",
    },
    {
      title: "REVENUE (ADMIN)",
      value: `$${stats.totalRevenue || "0"}`,
      icon: Banknote,
      colorClass: "text-rose-500",
      bgClass: "bg-rose-50",
    },
    {
      title: "ACTIVE BOOKINGS",
      value: stats.activeBookings || "0",
      icon: ClipboardList,
      colorClass: "text-cyan-500",
      bgClass: "bg-cyan-50",
    },
    {
      title: "MONTHLY REVENUE",
      value: `$${stats.monthlyRevenue || "0"}`,
      icon: TrendingUp,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-50",
    },
    {
      title: "PENDING WITHDRAWALS",
      value: stats.pendingWithdrawals || "0",
      icon: Wallet,
      colorClass: "text-red-500",
      bgClass: "bg-red-50",
    },
    {
      title: "AVG BOOKING VALUE",
      value: `$${stats.averageBookingValue?.toFixed(2) || "0.00"}`,
      icon: Tag,
      colorClass: "text-teal-500",
      bgClass: "bg-teal-50",
    },
  ];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dynamicRegistrationData = monthlyUsers.length ? monthlyUsers.map((item, i) => ({
    name: monthNames[i],
    Hosts: item.provider || 0,
    Users: item.user || 0,
  })) : registrationData;

  const dynamicBookingTrendData = monthlyBookings.length ? monthlyBookings.map((item, i) => ({
    name: monthNames[i],
    bookings: item.count || 0,
  })) : bookingTrendData;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1.5 font-medium">Here's what's happening with your platform today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStatCards.map((stat, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-[1.25rem] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.1)]"
          >
            <div className={`absolute -right-8 -top-8 size-32 rounded-full opacity-30 blur-[30px] transition-all duration-500 group-hover:scale-150 ${stat.bgClass}`}></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-black tracking-tight text-gray-900">{stat.value}</h3>
              </div>
              <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm border border-white/50 bg-gradient-to-br from-white/60 to-white/10 backdrop-blur-md ${stat.bgClass}`}>
                <stat.icon className={`size-7 ${stat.colorClass}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[1.25rem] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">User & Host Registrations</h3>
            <p className="text-sm text-gray-500 mt-1">Monthly platform growth</p>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicRegistrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProviders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} />
                <Tooltip cursor={{ fill: "#f8fafc", opacity: 0.4 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 20, fontWeight: 500 }} />
                <Bar dataKey="Hosts" fill="url(#colorProviders)" radius={[6, 6, 0, 0]} barSize={16} />
                <Bar dataKey="Users" fill="url(#colorUsers)" radius={[6, 6, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Booking Trend</h3>
            <p className="text-sm text-gray-500 mt-1">Total bookings per month</p>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicBookingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8", fontWeight: 500 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
