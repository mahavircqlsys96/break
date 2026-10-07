const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_ADMIN_API_BASE;
const API_URL = rawApiUrl?.replace(/\/admin\/?$/, "")?.replace(/\/$/, "");
export const usingMock = !API_URL;
const TOKEN_KEY = "break_admin_token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function toQueryString(q) {
  if (!q) return "";
  const params = new URLSearchParams();
  const { filters, ...rest } = q;
  for (const [k, v] of Object.entries({ ...rest, ...filters })) {
    if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

async function http(method, path, body, query) {
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}${toQueryString(query)}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) tokenStore.clear();
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.message ?? res.statusText, res.status);
  }
  return res.status === 204 ? undefined : res.json();
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Calls the real backend when VITE_API_URL is set, otherwise the in-memory mock. */
async function call(real, mock) {
  if (!usingMock) return real();
  await delay();
  // Clone so UI code can never mutate the mock store by accident.
  return structuredClone(await mock());
}

export const api = {
  get: (path, mock, query) =>
    call(() => http("GET", path, undefined, query), mock),
  post: (path, body, mock) => call(() => http("POST", path, body), mock),
  patch: (path, body, mock) => call(() => http("PATCH", path, body), mock),
  put: (path, body, mock) => call(() => http("PUT", path, body), mock),
  del: (path, mock) => call(() => http("DELETE", path), mock),
};

// ---------- mock helpers ----------

/** Search, filter, sort and paginate an array the way the real API is expected to. */
export function paginate(source, q = {}, opts = {}) {
  let items = source;
  const term = q.search?.trim().toLowerCase();
  if (term && opts.search) {
    items = items.filter((it) =>
      opts.search.some((g) =>
        String(g(it) ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }
  for (const [key, value] of Object.entries(q.filters ?? {})) {
    if (!value || value === "all") continue;
    const fn = opts.filters?.[key] ?? ((it, v) => String(it[key]) === v);
    items = items.filter((it) => fn(it, value));
  }
  if (q.sortBy) {
    const dir = q.sortDir === "asc" ? 1 : -1;
    const key = q.sortBy;
    items = [...items].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      return av === bv ? 0 : av > bv ? dir : -dir;
    });
  }
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 10;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export function findOr404(list, id) {
  const item = list.find((x) => x.id === id);
  if (!item) throw new ApiError("Not found", 404);
  return item;
}

export function patchIn(list, id, patch) {
  return Object.assign(findOr404(list, id), patch);
}

export function removeFrom(list, id) {
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list.splice(i, 1);
}

export const newId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
