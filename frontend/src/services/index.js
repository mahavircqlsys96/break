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
  updateProfile: (input) =>
    api.put("/admin/updateProfile", input, () => undefined),
  updatePassword: (oldPassword, newPassword) =>
    api.put("/admin/updatePassword", { oldPassword, newPassword }, () => undefined),
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
            image: (u.image && (u.image.startsWith('http://') || u.image.startsWith('https://'))) ? u.image : (u.image ? import.meta.env.VITE_IMAGE_BASE + (u.image.startsWith('/') ? u.image.substring(1) : u.image) : null),
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
    Promise.all([
      api.get(`/admin/viewUser/${id}/user`),
      api.get(`/admin/bookings`, null, { userId: id, limit: 10 }),
      api.get(`/admin/reports`, null, { userId: id, limit: 10 }),
    ]).then(([resUser, resBookings, resReports]) => {
      const u = resUser?.body || {};
      const bookings = resBookings?.body?.list || [];
      const reports = resReports?.body?.list || [];
      return {
        guest: {
          ...u,
          image: (u.image && (u.image.startsWith('http://') || u.image.startsWith('https://'))) ? u.image : (u.image ? import.meta.env.VITE_IMAGE_BASE + (u.image.startsWith('/') ? u.image.substring(1) : u.image) : null),
          name: u.name || '—',
          email: u.email || '—',
          joinedAt: u.createdAt,
          bookings: u.total_bookings || 0,
          dialCode: u.countryCode || '',
          phone: u.phone || '—',
          signupMethod: u.socialType ? u.socialType.toLowerCase() : (u.phone ? 'phone' : 'email'),
          status: u.status ? u.status.toLowerCase() : 'active',
          totalSpent: u.total_spent || 0,
          wishlists: 0,
          language: 'en',
          country: u.country || '—',
          gender: u.gender || 'Unknown',
          dob: u.dob || null,
          lastActiveAt: u.updatedAt || u.createdAt,
        },
        bookings: bookings.map(b => ({
          ...b,
          code: b.bookingNumber || b.id,
          guestName: b.user?.name || '—',
          propertyName: b.property?.name || b.property?.title || '—',
          propertyPhoto: b.property?.photos?.[0] || '',
          hostName: b.property?.host?.name || '—',
          total: b.total || b.amount || 0,
          status: b.status ? String(b.status).toLowerCase() : 'pending',
          paymentStatus: b.paymentStatus ? String(b.paymentStatus).toLowerCase() : 'pending',
          checkIn: b.bookingDates?.[0]?.checkIn || b.bookingDates?.[0]?.date || new Date().toISOString(),
          checkOut: b.bookingDates?.[0]?.checkOut || b.bookingDates?.[b.bookingDates?.length - 1]?.date || new Date().toISOString(),
        })),
        reports: reports.map(r => ({
          ...r,
          reporterName: r.reporter?.name || "—",
          reporterRole: r.reporter?.role || "user",
          reportedName: r.reportedUser?.name || "—",
          reportedRole: r.reportedUser?.role || "user",
          propertyName: "—",
          status: r.status || 'Pending'
        }))
      };
    }),
  setStatus: (id, status) =>
    api.put(`/admin/toggleUserStatus/${id}`, { status }, () =>
      patchIn(db.guests, id, { status }),
    ),
  remove: (id) =>
    api.del(`/admin/deleteUser/${id}`, () => removeFrom(db.guests, id)),
};

// ---------- hosts ----------

export const hostService = {
  list: (q) =>
    api.get(
      "/admin/userList2",
      () =>
        paginate(db.hosts, q, {
          search: [(h) => h.name, (h) => h.email, (h) => h.phone],
        }),
      { ...q, role: "Host" },
    ).then((res) => {
      console.log("DEBUG_HOST_SERVICE", res);
      if (res && res.success !== undefined) {
        const items = res.body?.user_list || [];
        console.log("DEBUG_HOST_SERVICE_ITEMS", items.length, res.body);
        return {
          items: items.map(u => ({
            ...u,
            image: (u.image && (u.image.startsWith('http://') || u.image.startsWith('https://'))) ? u.image : (u.image ? import.meta.env.VITE_IMAGE_BASE + (u.image.startsWith('/') ? u.image.substring(1) : u.image) : null),
            joinedAt: u.createdAt,
            dialCode: u.countryCode || '',
            status: u.status ? u.status.toLowerCase() : 'active',
            properties: u.total_properties || 0,
            bookings: u.total_bookings || 0,
            earnings: u.total_earnings || 0,
            rating: u.rating || 0,
          })),
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
  get: (id) =>
    Promise.all([
      api.get(`/admin/viewUser/${id}/host`),
      api.get(`/admin/bookings`, null, { hostId: id, limit: 10 }),
    ]).then(([resUser, resBookings]) => {
      const u = resUser?.body || {};
      const bookings = resBookings?.body?.list || [];
      return {
        host: {
          ...u,
          image: (u.image && (u.image.startsWith('http://') || u.image.startsWith('https://'))) ? u.image : (u.image ? import.meta.env.VITE_IMAGE_BASE + (u.image.startsWith('/') ? u.image.substring(1) : u.image) : null),
          name: u.name || '—',
          email: u.email || '—',
          joinedAt: u.createdAt,
          dialCode: u.countryCode || '',
          phone: u.phone || '—',
          status: u.status ? u.status.toLowerCase() : 'active',
          properties: u.total_properties || 0,
          country: u.country || '—',
          gender: u.gender || 'Unknown',
          responseRate: 100,
          idDocument: 'Passport',
          bookings: u.total_bookings || 0,
          earnings: 0,
          rating: 5.0,
          verified: u.status === 'Active',
        },
        properties: [],
        bookings: bookings.map(b => ({
          ...b,
          code: b.bookingNumber || b.id,
          guestName: b.user?.name || '—',
          propertyName: b.property?.name || b.property?.title || '—',
          propertyPhoto: b.property?.photos?.[0] || '',
          hostName: b.property?.host?.name || '—',
          total: b.total || b.amount || 0,
          status: b.status ? String(b.status).toLowerCase() : 'pending',
          paymentStatus: b.paymentStatus ? String(b.paymentStatus).toLowerCase() : 'pending',
          checkIn: b.bookingDates?.[0]?.checkIn || b.bookingDates?.[0]?.date || new Date().toISOString(),
          checkOut: b.bookingDates?.[0]?.checkOut || b.bookingDates?.[b.bookingDates?.length - 1]?.date || new Date().toISOString(),
        })),
        payouts: [],
      };
    }),
  setStatus: (id, status) =>
    api.put(`/admin/toggleUserStatus/${id}`, { status }, () =>
      patchIn(
        db.hosts,
        id,
        status === "active" ? { status, verified: true } : { status },
      ),
    ),
  remove: (id) =>
    api.del(`/admin/deleteUser/${id}`, () => removeFrom(db.hosts, id)),
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
    ).then((res) => {
      if (res && res.success !== undefined) {
        const items = res.body?.properties || [];
        return {
          items: items.map(p => ({
            ...p,
            name: p.basicInfo || '—',
            area: p.location || '—',
            cityName: p.location || '—',
            hostName: p.host?.name || '—',
            categoryName: p.propertyType?.title || '—',
            pricePerNight: p.price || 0,
            rating: Number(p.avgRating) || 0,
            reviewCount: p.ratingCount || 0,
            views: p.views || 0,
            bookings: p.total_bookings || 0, // Need to ensure the backend provides this if available
            status: p.status ? String(p.status).toLowerCase() : 'pending',
            bedrooms: p.bedroom || 0,
            bathrooms: p.bathroom || 0,
            maxGuests: p.guest || 0,
            amenityIds: p.propertiesKeyAmenities ? p.propertiesKeyAmenities.map(a => String(a.amenitiesId)) : [],
            animalIds: p.propertiesAnimals ? p.propertiesAnimals.map(a => String(a.animalId)) : [],
            houseRules: p.houseRules || { checkIn: "15:00", checkOut: "11:00", smoking: false, parties: false, pets: false },
            cancellationPolicyId: p.cancellationPolicyId || null,
            petsAllowed: p.propertiesAnimals ? p.propertiesAnimals.length > 0 : false,
            photos: p.propertiesPhotos?.map(img => {
              const url = img.image;
              if (!url) return "";
              if (url.startsWith('http://') || url.startsWith('https://')) return url;
              return import.meta.env.VITE_IMAGE_BASE + (url.startsWith('/') ? url.substring(1) : url);
            }).filter(Boolean) || [],
          })),
          total: res.body?.pagination?.totalRecords || 0,
          page: res.body?.pagination?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
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
    }).then((res) => {
      if (res && res.success !== undefined) {
        const p = res.body || {};
        return {
          property: {
            ...p,
            name: p.basicInfo || '—',
            area: p.location || '—',
            cityName: p.location || '—',
            hostName: p.host?.name || '—',
            categoryName: p.propertyType?.title || '—',
            pricePerNight: p.price || 0,
            rating: p.avgRating || 0,
            reviewCount: p.ratingCount || 0,
            views: p.views || 0,
            bookings: p.total_bookings || 0,
            status: p.status ? String(p.status).toLowerCase() : 'pending',
            bedrooms: p.bedroom || 0,
            bathrooms: p.bathroom || 0,
            maxGuests: p.guest || 0,
            amenityIds: p.propertiesKeyAmenities ? p.propertiesKeyAmenities.map(a => String(a.amenitiesId)) : [],
            animalIds: p.propertiesAnimals ? p.propertiesAnimals.map(a => String(a.animalId)) : [],
            houseRules: p.houseRules || { checkIn: "15:00", checkOut: "11:00", smoking: false, parties: false, pets: false },
            cancellationPolicyId: p.cancellationPolicyId || null,
            petsAllowed: p.propertiesAnimals ? p.propertiesAnimals.length > 0 : false,
            photos: p.propertiesPhotos?.map(img => {
              const url = img.image;
              if (!url) return "";
              if (url.startsWith('http://') || url.startsWith('https://')) return url;
              return import.meta.env.VITE_IMAGE_BASE + (url.startsWith('/') ? url.substring(1) : url);
            }).filter(Boolean) || [],
          },
          host: p.host ? { ...p.host, rating: p.host.rating || 0, responseRate: p.host.responseRate || 0 } : { id: "unknown", name: "Unknown", rating: 0, responseRate: 0 },
          reviews: p.reviews || [],
          bookings: p.bookings || [],
        };
      }
      return res;
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
    ).then((res) => {
      if (res && res.success !== undefined) {
        const items = res.body?.list || [];
        return {
          items: items.map(b => ({
            ...b,
            code: b.bookingNumber || b.id,
            guestName: b.user?.name || '—',
            propertyName: b.property?.name || '—',
            propertyPhoto: b.property?.photos?.[0] || '',
            hostName: b.property?.host?.name || '—',
            total: b.total || b.amount || 0,
            status: b.status ? String(b.status).toLowerCase() : 'pending',
            paymentStatus: b.paymentStatus ? String(b.paymentStatus).toLowerCase() : 'pending',
            checkIn: b.bookingDates?.[0]?.checkIn || b.bookingDates?.[0]?.date || new Date().toISOString(),
            checkOut: b.bookingDates?.[0]?.checkOut || b.bookingDates?.[b.bookingDates?.length - 1]?.date || new Date().toISOString(),
          })),
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
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
    }).then((res) => {
      if (res && res.success !== undefined) {
        const b = res.body || {};
        return {
          booking: {
            ...b,
            code: b.bookingNumber || b.id,
            status: b.status ? String(b.status).toLowerCase() : 'pending',
            paymentStatus: b.paymentStatus ? b.paymentStatus.toLowerCase() : 'pending',
            transactionId: b.payment?.transactionId,
            paidAt: b.payment?.createdAt,
            cardLast4: b.payment?.cardLast4 || "0000",
            checkIn: b.bookingDates?.[0]?.checkIn || b.bookingDates?.[0]?.date || new Date().toISOString(),
            checkOut: b.bookingDates?.[0]?.checkOut || b.bookingDates?.[b.bookingDates?.length - 1]?.date || new Date().toISOString(),
          },
          guest: b.user,
          host: b.property?.host,
          property: b.property,
        };
      }
      return res;
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
    all: () => api.get(`/admin/${path}?limit=1000`, () => list).then(res => {
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
      api.put(`/admin/${path}/${id}`, mapToBackend(path, input), () => patchIn(list, id, input))
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
    ).then(res => {
      if (res && res.success !== undefined) {
        const items = res.body?.list || [];
        return {
          items: items.map(r => ({
            ...r,
            status: r.status || 'Pending',
            reporterName: r.reporter?.name || "—",
            reporterRole: r.reporter?.role || "user",
            reportedName: r.reportedUser?.name || "—",
            reportedRole: r.reportedUser?.role || "user",
            propertyName: "—" // no property relation directly on reportUser
          })),
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
  resolveReport: (id, status, resolution) =>
    api.put(`/admin/reports/${id}`, { status, adminNote: resolution }, () =>
      patchIn(db.reports, id, { status, resolution }),
    ),
};

export const enquiryService = {
  list: (q) =>
    api.get(
      "/admin/contactUsList",
      () =>
        paginate(newest(db.enquiries), q, {
          search: [(e) => e.name, (e) => e.email, (e) => e.message],
        }),
      q,
    ).then(res => {
      if (res && res.success !== undefined) {
        const items = res.body?.list || [];
        return {
          items,
          total: res.body?.total || 0,
          page: res.body?.currentPage || 1,
          pageSize: q?.pageSize || 10,
        };
      }
      return res;
    }),
  reply: (id, reply) =>
    api.put(`/admin/contactUs/${id}`, { reply, status: "replied" }, () =>
      patchIn(db.enquiries, id, { reply, status: "replied" }),
    ),
  setStatus: (id, status) =>
    api.put(`/admin/contactUs/${id}`, { status }, () =>
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
  list: () => api.get("/admin/cms", () => db.cmsPages).then(res => {
    if (res && res.success !== undefined) {
      return (res.body || res.data || []).map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleAr: p.titleAr || p.title,
        body: p.content,
        bodyAr: p.contentAr || p.content,
        updatedAt: p.updatedAt
      }));
    }
    return res;
  }),
  get: (slug) => api.get(`/admin/getCms/${slug}`, () => db.cmsPages.find(p => p.slug === slug)).then(res => {
    if (res && res.success !== undefined) {
      const p = res.body || res.data;
      if (!p) return null;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        titleAr: p.titleAr || p.title,
        body: p.content,
        bodyAr: p.contentAr || p.content,
        updatedAt: p.updatedAt
      };
    }
    return res;
  }),
  update: (id, input) => {
    const payload = { slug: input.slug, title: input.title, content: input.body };
    return api.put(`/admin/updateCms`, payload, () =>
      patchIn(db.cmsPages, id, {
        ...input,
        updatedAt: new Date().toISOString(),
      }),
    );
  }
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
