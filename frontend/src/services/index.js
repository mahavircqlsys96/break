// One service object per admin module. Each call hits `${VITE_API_URL}/admin/...` when a
// backend is configured and otherwise resolves against the in-memory seed in src/mocks.
import * as db from "@/mocks/seed";
import {
  api,
  ApiError,
  findOr404,
  newId,
  paginate,
  patchIn,
  removeFrom,
  tokenStore,
} from "./api";

// ---------- joined views ----------

const nameOf = (id) =>
  db.guests.find((g) => g.id === id)?.name ??
  db.hosts.find((h) => h.id === id)?.name ??
  "Deleted account";

const propertyView = (p) => ({
  ...p,
  categoryName: db.categories.find((c) => c.id === p.categoryId)?.name ?? "—",
  cityName: db.cities.find((c) => c.id === p.cityId)?.name ?? "—",
  hostName: nameOf(p.hostId),
});

const bookingView = (b) => {
  const p = db.properties.find((x) => x.id === b.propertyId);
  return {
    ...b,
    propertyName: p?.name ?? "—",
    propertyPhoto: p?.photos[0] ?? "",
    cityName: db.cities.find((c) => c.id === p?.cityId)?.name ?? "—",
    guestName: nameOf(b.guestId),
    hostName: nameOf(b.hostId),
  };
};

const reviewView = (r) => ({
  ...r,
  propertyName: db.properties.find((p) => p.id === r.propertyId)?.name ?? "—",
  guestName: nameOf(r.guestId),
});

const reportView = (r) => ({
  ...r,
  reporterName: nameOf(r.reporterId),
  reportedName: nameOf(r.reportedId),
  propertyName: db.properties.find((p) => p.id === r.propertyId)?.name,
});

const newest = (list) =>
  [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

// ---------- auth ----------

export const authService = {
  login: (email, password) =>
    api
      .post("/admin/auth/login", { email, password }, () => {
        const ok =
          email.toLowerCase() === db.MOCK_ADMIN_LOGIN.email &&
          password === db.MOCK_ADMIN_LOGIN.password;
        if (!ok) throw new ApiError("Invalid email or password", 401);
        return { token: "mock-token", admin: db.admins[0] };
      })
      .then(async (r) => {
        // Handle mock format ({ token, admin }) vs real backend ({ body: { token } })
        const token = r.token || r.body?.token;
        tokenStore.set(token);
        
        if (r.admin) return r;
        
        // For real backend, fetch the 'me' profile to return admin
        const adminData = await authService.me();
        return { token, admin: adminData };
      }),
  forgotPassword: (email) =>
    api.post("/admin/auth/forgotPassword", { email }, () => undefined),
  me: () =>
    api.get("/admin/auth/me", () => {
      if (!tokenStore.get()) throw new ApiError("Unauthorized", 401);
      return db.admins[0];
    }).then((r) => {
      // Real backend might wrap it in `body` or `data` based on helper.success
      return r.body || r.data || r;
    }),
  logout: () => tokenStore.clear(),
};

// ---------- dashboard ----------

export const dashboardService = {
  stats: () =>
    api.get("/admin/dashboard_data", () => {
      const paid = db.bookings.filter((b) => b.paymentStatus === "paid");
      const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date("2026-09-01T00:00:00Z");
        d.setUTCMonth(d.getUTCMonth() - (11 - i));
        return d;
      });
      const trend = months.map((m) => {
        const key = m.toISOString().slice(0, 7);
        const inMonth = db.bookings.filter((b) => b.createdAt.startsWith(key));
        return {
          month: m.toLocaleString("en", { month: "short", timeZone: "UTC" }),
          bookings: inMonth.length,
          revenue: inMonth
            .filter((b) => b.paymentStatus === "paid")
            .reduce((s, b) => s + b.total, 0),
        };
      });
      const count = (key) =>
        Object.entries(
          db.bookings.reduce(
            (acc, b) => ({ ...acc, [key(b)]: (acc[key(b)] ?? 0) + 1 }),
            {},
          ),
        )
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      const prop = (b) => db.properties.find((p) => p.id === b.propertyId);
      return {
        guests: db.guests.length,
        hosts: db.hosts.length,
        liveProperties: db.properties.filter((p) => p.status === "live").length,
        pendingProperties: db.properties.filter((p) => p.status === "pending")
          .length,
        bookings: db.bookings.length,
        revenue: paid.reduce((s, b) => s + b.total, 0),
        commission: paid.reduce(
          (s, b) =>
            s +
            Math.round(b.subtotal * (db.appSettings.commissionPercent / 100)) +
            b.serviceFee,
          0,
        ),
        openReports: db.reports.filter((r) => r.status === "open").length,
        trend,
        byCategory: count(
          (b) => db.categories.find((c) => c.id === prop(b).categoryId).name,
        ),
        byCity: count(
          (b) => db.cities.find((c) => c.id === prop(b).cityId).name,
        ).slice(0, 5),
      };
    }).then((res) => {
      // If it has 'success' field, it's the real backend response
      if (res && res.success !== undefined) {
        const b = res.body || {};
        const d = b.data || {};
        return {
          guests: d.usersCount || 0,
          hosts: d.providersCount || 0,
          liveProperties: 0,
          pendingProperties: 0,
          bookings: d.bookingsCount || 0,
          revenue: d.totalRevenue || 0,
          commission: d.monthlyRevenue || 0,
          openReports: d.pendingWithdrawals || 0,
          trend: [], 
          byCategory: (b.topCategories || []).map(c => ({ name: c.name, value: c.count })),
          byCity: (b.topLocations || []).map(l => ({ name: l.name, value: l.count }))
        };
      }
      return res; // mock response
    }),
};

// ---------- guests ----------

export const guestService = {
  list: (q) =>
    api.get(
      "/admin/userList",
      () =>
        paginate(db.guests, q, {
          search: [(g) => g.name, (g) => g.email, (g) => g.phone],
        }),
      { ...q, role: "User" },
    ).then((res) => {
      if (res && res.success !== undefined) {
        const items = res.body?.user_list || [];
        return {
          items: items.map(u => ({
            ...u,
            joinedAt: u.createdAt,
            bookings: u.total_bookings || 0,
            dialCode: u.countryCode || '',
            signupMethod: u.socialType ? u.socialType.toLowerCase() : (u.phone ? 'phone' : 'email'),
            status: u.status ? u.status.toLowerCase() : 'active',
            totalSpent: u.total_spent || 0,
          })),
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
  get: (id) =>
    api.get(`/admin/guests/${id}`, () => ({
      guest: findOr404(db.guests, id),
      bookings: newest(db.bookings.filter((b) => b.guestId === id)).map(
        bookingView,
      ),
      reports: db.reports
        .filter((r) => r.reportedId === id || r.reporterId === id)
        .map(reportView),
    })),
  setStatus: (id, status) =>
    api.patch(`/admin/guests/${id}`, { status }, () =>
      patchIn(db.guests, id, { status }),
    ),
  remove: (id) =>
    api.del(`/admin/guests/${id}`, () => removeFrom(db.guests, id)),
};

// ---------- hosts ----------

export const hostService = {
  list: (q) =>
    api.get(
      "/admin/userList",
      () =>
        paginate(db.hosts, q, {
          search: [(h) => h.name, (h) => h.email, (h) => h.phone],
        }),
      { ...q, role: "Host" },
    ).then((res) => {
      if (res && res.success !== undefined) {
        const items = res.body?.user_list || [];
        return {
          items: items.map(u => ({
            ...u,
            joinedAt: u.createdAt,
            dialCode: u.countryCode || '',
            status: u.status ? u.status.toLowerCase() : 'active',
            properties: u.total_properties || 0,
          })),
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
  get: (id) =>
    api.get(`/admin/hosts/${id}`, () => ({
      host: findOr404(db.hosts, id),
      properties: db.properties
        .filter((p) => p.hostId === id)
        .map(propertyView),
      bookings: newest(db.bookings.filter((b) => b.hostId === id))
        .slice(0, 10)
        .map(bookingView),
      payouts: db.payouts.filter((p) => p.hostId === id),
    })),
  setStatus: (id, status) =>
    api.patch(`/admin/hosts/${id}`, { status }, () =>
      patchIn(
        db.hosts,
        id,
        status === "active" ? { status, verified: true } : { status },
      ),
    ),
};

// ---------- properties ----------

export const propertyService = {
  list: (q) =>
    api.get(
      "/admin/properties",
      () =>
        paginate(db.properties.map(propertyView), q, {
          search: [(p) => p.name, (p) => p.area, (p) => p.hostName],
        }),
      q,
    ),
  get: (id) =>
    api.get(`/admin/properties/${id}`, () => {
      const property = findOr404(db.properties, id);
      return {
        property: propertyView(property),
        host: findOr404(db.hosts, property.hostId),
        reviews: db.reviews.filter((r) => r.propertyId === id).map(reviewView),
        bookings: newest(db.bookings.filter((b) => b.propertyId === id))
          .slice(0, 8)
          .map(bookingView),
      };
    }),
  create: (input) =>
    api.post("/admin/properties", input, () => {
      const now = new Date().toISOString();
      const p = {
        ...input,
        id: newId("p"),
        rating: 0,
        reviewCount: 0,
        bookings: 0,
        views: 0,
        createdAt: now,
        updatedAt: now,
      };
      db.properties.unshift(p);
      return p;
    }),
  update: (id, input) =>
    api.patch(`/admin/properties/${id}`, input, () =>
      patchIn(db.properties, id, {
        ...input,
        updatedAt: new Date().toISOString(),
      }),
    ),
  approve: (id) =>
    propertyService.update(id, { status: "live", rejectionReason: undefined }),
  reject: (id, reason) =>
    propertyService.update(id, { status: "rejected", rejectionReason: reason }),
  remove: (id) =>
    api.del(`/admin/properties/${id}`, () => removeFrom(db.properties, id)),
};

// ---------- bookings ----------

export const bookingService = {
  list: (q) =>
    api.get(
      "/admin/bookings",
      () =>
        paginate(newest(db.bookings).map(bookingView), q, {
          search: [(b) => b.code, (b) => b.guestName, (b) => b.propertyName],
          filters: { month: (b, v) => b.checkIn.startsWith(v) },
        }),
      q,
    ),
  get: (id) =>
    api.get(`/admin/bookings/${id}`, () => {
      const booking = findOr404(db.bookings, id);
      const property = db.properties.find((p) => p.id === booking.propertyId);
      return {
        booking: bookingView(booking),
        guest: db.guests.find((g) => g.id === booking.guestId),
        host: db.hosts.find((h) => h.id === booking.hostId),
        property: property && propertyView(property),
      };
    }),
  setStatus: (id, status, reason) =>
    api.patch(`/admin/bookings/${id}`, { status, reason }, () =>
      patchIn(
        db.bookings,
        id,
        status === "cancelled"
          ? { status, cancelledReason: reason, paymentStatus: "refunded" }
          : status === "confirmed"
            ? { status, paymentStatus: "paid" }
            : { status },
      ),
    ),
};

// ---------- finance ----------

export const financeService = {
  transactions: (q) =>
    api.get(
      "/admin/transactions",
      () =>
        paginate(
          newest(db.transactions).map((t) => ({
            ...t,
            guestName: nameOf(t.guestId),
          })),
          q,
          { search: [(t) => t.bookingCode, (t) => t.guestName] },
        ),
      q,
    ),
  payouts: (q) =>
    api.get(
      "/admin/payouts",
      () =>
        paginate(
          [...db.payouts]
            .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
            .map((p) => ({ ...p, hostName: nameOf(p.hostId) })),
          q,
          { search: [(p) => p.hostName] },
        ),
      q,
    ),
  setPayoutStatus: (id, status) =>
    api.patch(`/admin/payouts/${id}`, { status }, () =>
      patchIn(db.payouts, id, {
        status,
        paidAt: status === "paid" ? new Date().toISOString() : undefined,
      }),
    ),
};

// ---------- master data (generic CRUD) ----------

const mapToFrontend = (path, item) => {
  if (!item) return item;
  if (path === "categories") {
    return { ...item, name: item.categoryName, active: item.status === 1 };
  }
  if (["propertyTypes", "amenities", "friendlyAnimals"].includes(path)) {
    return { ...item, name: item.title, active: item.status === "Active" };
  }
  return item;
};

const mapToBackend = (path, input) => {
  if (!input) return input;
  if (path === "categories") {
    return { ...input, categoryName: input.name, status: input.active ? 1 : 0 };
  }
  if (["propertyTypes", "amenities", "friendlyAnimals"].includes(path)) {
    return { ...input, title: input.name, status: input.active ? "Active" : "Inactive" };
  }
  return input;
};

function crud(path, list, prefix) {
  return {
    all: () => api.get(`/admin/${path}`, () => list).then(res => {
      if (res && res.success !== undefined) {
        const arr = Array.isArray(res.body) ? res.body : (res.body?.list || res.body?.data || []);
        return arr.map(item => mapToFrontend(path, item));
      }
      return res;
    }),
    create: (input) =>
      api.post(`/admin/${path}`, mapToBackend(path, input), () => {
        const item = { ...input, id: newId(prefix) };
        list.push(item);
        return item;
      }).then(res => {
        if (res && res.success !== undefined) return mapToFrontend(path, res.body || res);
        return res;
      }),
    update: (id, input) =>
      api.patch(`/admin/${path}/${id}`, mapToBackend(path, input), () => patchIn(list, id, input))
        .then(res => {
          if (res && res.success !== undefined) return mapToFrontend(path, res.body || res);
          return res;
        }),
    remove: (id) => api.del(`/admin/${path}/${id}`, () => removeFrom(list, id))
        .then(res => {
          if (res && res.success !== undefined) return mapToFrontend(path, res.body || res);
          return res;
        }),
  };
}

export const masterData = {
  categories: crud("categories", db.categories, "cat"),
  amenities: crud("amenities", db.amenities, "am"),
  cities: crud("cities", db.cities, "city"),
  animals: crud("friendlyAnimals", db.animals, "an"),
  policies: crud("cancellation-policies", db.cancellationPolicies, "cp"),
  countries: crud("countries", db.countries, "c"),
  propertyTypes: crud("propertyTypes", db.propertyTypes, "pt"),
};

// ---------- moderation ----------

export const reviewService = {
  list: (q) =>
    api.get(
      "/admin/reviews",
      () =>
        paginate(newest(db.reviews).map(reviewView), q, {
          search: [(r) => r.comment, (r) => r.propertyName, (r) => r.guestName],
          filters: { rating: (r, v) => r.rating === Number(v) },
        }),
      q,
    ),
  setStatus: (id, status) =>
    api.patch(`/admin/reviews/${id}`, { status }, () =>
      patchIn(db.reviews, id, { status }),
    ),
};

export const supportService = {
  threads: (q) =>
    api.get(
      "/admin/support/threads",
      () =>
        paginate(
          [...db.supportThreads]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((t) => ({ ...t, participantName: nameOf(t.participantId) })),
          q,
          {
            search: [(t) => t.subject, (t) => t.participantName],
          },
        ),
      q,
    ),
  reply: (id, text) =>
    api.post(`/admin/support/threads/${id}/messages`, { text }, () => {
      const t = findOr404(db.supportThreads, id);
      const at = new Date().toISOString();
      t.messages.push({ id: newId("m"), from: "support", text, at });
      return Object.assign(t, { updatedAt: at, unread: 0 });
    }),
  setStatus: (id, status) =>
    api.patch(`/admin/support/threads/${id}`, { status }, () =>
      patchIn(db.supportThreads, id, { status, unread: 0 }),
    ),
  reports: (q) =>
    api.get(
      "/admin/reports",
      () =>
        paginate(newest(db.reports).map(reportView), q, {
          search: [
            (r) => r.reason,
            (r) => r.reporterName,
            (r) => r.reportedName,
          ],
        }),
      q,
    ),
  resolveReport: (id, status, resolution) =>
    api.patch(`/admin/reports/${id}`, { status, resolution }, () =>
      patchIn(db.reports, id, { status, resolution }),
    ),
};

export const enquiryService = {
  list: (q) =>
    api.get(
      "/admin/enquiries",
      () =>
        paginate(newest(db.enquiries), q, {
          search: [(e) => e.name, (e) => e.email, (e) => e.message],
        }),
      q,
    ),
  reply: (id, reply) =>
    api.post(`/admin/enquiries/${id}/reply`, { reply }, () =>
      patchIn(db.enquiries, id, { reply, status: "replied" }),
    ),
  setStatus: (id, status) =>
    api.patch(`/admin/enquiries/${id}`, { status }, () =>
      patchIn(db.enquiries, id, { status }),
    ),
};

// ---------- notifications ----------

export const notificationService = {
  list: () =>
    api.get("/admin/notifications", () =>
      [...db.pushNotifications].sort((a, b) =>
        b.sentAt.localeCompare(a.sentAt),
      ),
    ),
  send: (input) =>
    api.post("/admin/notifications", input, () => {
      const recipients =
        input.audience === "guests"
          ? db.guests.length
          : input.audience === "hosts"
            ? db.hosts.length
            : input.audience === "city"
              ? Math.round(db.guests.length / 3)
              : db.guests.length + db.hosts.length;
      const n = {
        id: newId("n"),
        title: input.title,
        body: input.body,
        audience: input.audience,
        cityId: input.cityId,
        status: input.scheduleAt ? "scheduled" : "sent",
        sentAt: input.scheduleAt ?? new Date().toISOString(),
        recipients,
        opens: 0,
      };
      db.pushNotifications.unshift(n);
      return n;
    }),
  remove: (id) =>
    api.del(`/admin/notifications/${id}`, () =>
      removeFrom(db.pushNotifications, id),
    ),
};

// ---------- content ----------

export const cmsService = {
  list: () => api.get("/admin/cms", () => db.cmsPages),
  update: (id, input) =>
    api.put(`/admin/cms/${id}`, input, () =>
      patchIn(db.cmsPages, id, {
        ...input,
        updatedAt: new Date().toISOString(),
      }),
    ),
};

// ---------- settings ----------

export const settingsService = {
  get: () => api.get("/admin/settings", () => db.appSettings),
  update: (input) =>
    api.put("/admin/settings", input, () =>
      Object.assign(db.appSettings, input),
    ),
  admins: crud("admins", db.admins, "a"),
  deletionRequests: () =>
    api.get("/admin/deletion-requests", () =>
      newest(db.deletionRequests).map((d) => {
        const acct =
          db.guests.find((g) => g.id === d.accountId) ??
          db.hosts.find((h) => h.id === d.accountId);
        return {
          ...d,
          accountName: acct?.name ?? "Deleted account",
          email: acct?.email ?? "—",
        };
      }),
    ),
  resolveDeletion: (id, status) =>
    api.patch(`/admin/deletion-requests/${id}`, { status }, () =>
      patchIn(db.deletionRequests, id, { status }),
    ),
};
