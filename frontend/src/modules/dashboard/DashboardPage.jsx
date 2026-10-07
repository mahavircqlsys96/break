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
    title: "PROVIDERS",
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
  { name: "Jan", Providers: 0, Users: 0 },
  { name: "Feb", Providers: 0, Users: 0 },
  { name: "Mar", Providers: 0, Users: 0 },
  { name: "Apr", Providers: 0, Users: 0 },
  { name: "May", Providers: 6, Users: 12 },
  { name: "Jun", Providers: 1, Users: 20 },
  { name: "Jul", Providers: 0, Users: 19 },
  { name: "Aug", Providers: 3, Users: 13 },
  { name: "Sep", Providers: 0, Users: 1 },
  { name: "Oct", Providers: 0, Users: 0 },
  { name: "Nov", Providers: 0, Users: 0 },
  { name: "Dec", Providers: 0, Users: 0 },
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

  const stats = dashData?.data || {};
  const monthlyUsers = monthlyData?.data || [];
  const monthlyBookings = monthlyData?.bookings || [];

  const dynamicStatCards = [
    {
      title: "TOTAL USERS",
      value: stats.usersCount || "0",
      icon: Users,
      colorClass: "text-blue-500",
      bgClass: "bg-blue-50",
    },
    {
      title: "PROVIDERS",
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
    Providers: item.provider || 0,
    Users: item.user || 0,
  })) : registrationData;

  const dynamicBookingTrendData = monthlyBookings.length ? monthlyBookings.map((item, i) => ({
    name: monthNames[i],
    bookings: item.count || 0,
  })) : bookingTrendData;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dynamicStatCards.map((stat, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                {stat.title}
              </p>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
            </div>
            <div className={`flex size-12 items-center justify-center rounded-2xl ${stat.bgClass}`}>
              <stat.icon className={`size-6 ${stat.colorClass}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="User & Provider Registrations" className="lg:col-span-2 h-[420px]">
          <div className="h-[340px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicRegistrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <Tooltip cursor={{ fill: "#f9fafb" }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: 13, paddingTop: 20 }} />
                <Bar dataKey="Providers" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Booking Trend" className="h-[420px]">
          <div className="h-[340px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicBookingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
