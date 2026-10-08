import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, UserX, Eye, EyeOff } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatusBadge,
  Tabs,
  Toggle,
  useToast,
} from "@/components/ui";
import { authService, settingsService } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { ago, date, label } from "@/lib/format";

const ROLES = [
  {
    value: "super_admin",
    label: "Super admin",
    desc: "Full access including admins & settings",
  },
  {
    value: "operations",
    label: "Operations",
    desc: "Properties, bookings, hosts & guests",
  },
  {
    value: "support",
    label: "Support",
    desc: "Support inbox, reports & enquiries",
  },
  { value: "finance", label: "Finance", desc: "Payments, payouts & fees" },
];

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration, admin team and account requests."
      />
      <ProfileTab />
    </>
  );
}

function AppSettingsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.get,
  });
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  const save = useMutation({
    mutationFn: () => settingsService.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast("Settings saved");
    },
  });
  if (!form) return null;
  const toggleLang = (l) =>
    setForm({
      ...form,
      languages: form.languages.includes(l)
        ? form.languages.filter((x) => x !== l)
        : [...form.languages, l],
    });

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title="Support contact">
        <div className="space-y-4">
          <Field label="Support email">
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(e) =>
                setForm({ ...form, supportEmail: e.target.value })
              }
            />
          </Field>
          <Field label="Support phone">
            <Input
              value={form.supportPhone}
              onChange={(e) =>
                setForm({ ...form, supportPhone: e.target.value })
              }
            />
          </Field>
          <Field label="Currency">
            <Select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[{ value: "AED", label: "AED — UAE Dirham" }]}
            />
          </Field>
        </div>
      </Card>
      <Card title="App behaviour">
        <div className="divide-y divide-line/60">
          <label className="flex items-center justify-between gap-4 pb-4">
            <span>
              <span className="block text-[13px] font-semibold">
                Auto-approve new listings
              </span>
              <span className="text-xs text-ink-muted">
                Skip manual review for verified hosts
              </span>
            </span>
            <Toggle
              checked={form.autoApproveListings}
              onChange={(v) => setForm({ ...form, autoApproveListings: v })}
              label="Auto-approve listings"
            />
          </label>
          <label className="flex items-center justify-between gap-4 py-4">
            <span>
              <span className="block text-[13px] font-semibold">
                Maintenance mode
              </span>
              <span className="text-xs text-ink-muted">
                Apps show a maintenance screen
              </span>
            </span>
            <Toggle
              checked={form.maintenanceMode}
              onChange={(v) => setForm({ ...form, maintenanceMode: v })}
              label="Maintenance mode"
            />
          </label>
          <div className="pt-4">
            <p className="mb-2 text-[13px] font-semibold">App languages</p>
            <div className="flex gap-2">
              {["en", "ar"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLang(l)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${form.languages.includes(l) ? "bg-primary text-white" : "text-ink-muted ring-1 ring-line"}`}
                >
                  {l === "en" ? "English" : "العربية"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
      <div className="flex justify-end xl:col-span-2">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Save settings
        </Button>
      </div>
    </div>
  );
}

function AdminsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const { admin: me } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: settingsService.admins.all,
  });
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "operations" });
  const [removing, setRemoving] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const displayData = data?.slice((page - 1) * pageSize, page * pageSize);

  const done = (msg) => {
    qc.invalidateQueries({ queryKey: ["admins"] });
    toast(msg);
  };
  const create = useMutation({
    mutationFn: () =>
      settingsService.admins.create({ ...form, active: true, lastLoginAt: "" }),
    onSuccess: () => {
      done(`Invitation sent to ${form.email}`);
      setInvite(false);
      setForm({ name: "", email: "", role: "operations" });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, v }) => settingsService.admins.update(id, v),
    onSuccess: () => done("Admin updated"),
  });
  const remove = useMutation({
    mutationFn: (id) => settingsService.admins.remove(id),
    onSuccess: () => {
      done("Admin removed");
      setRemoving(null);
    },
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4">
        <p className="text-[13px] text-ink-muted">
          People with access to this panel.
        </p>
        <Button
          icon={<Plus className="size-4" />}
          onClick={() => setInvite(true)}
        >
          Invite admin
        </Button>
      </div>
      <DataTable
        rows={displayData}
        loading={isLoading}
        columns={[
          {
            key: "name",
            header: "Admin",
            render: (a) => (
              <div className="flex items-center gap-3">
                <Avatar name={a.name} />
                <div>
                  <p className="font-semibold">
                    {a.name}
                    {a.id === me?.id && (
                      <span className="ms-1.5 text-xs font-medium text-ink-muted">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">{a.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (a) =>
              a.id === me?.id ? (
                <Badge tone="accent">{label(a.role)}</Badge>
              ) : (
                <Select
                  className="h-9 w-40 rounded-full text-[13px]"
                  value={a.role}
                  onChange={(e) =>
                    update.mutate({ id: a.id, v: { role: e.target.value } })
                  }
                  options={ROLES.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                />
              ),
          },
          {
            key: "lastLoginAt",
            header: "Last login",
            render: (a) => (
              <span className="text-ink-muted">
                {a.lastLoginAt ? ago(a.lastLoginAt) : "Invitation pending"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (a) => (
              <StatusBadge status={a.active ? "active" : "inactive"} />
            ),
          },
          {
            key: "actions",
            header: "",
            className: "text-end",
            render: (a) =>
              a.id !== me?.id && (
                <div className="flex items-center justify-end gap-1">
                  <Toggle
                    checked={a.active}
                    onChange={(v) =>
                      update.mutate({ id: a.id, v: { active: v } })
                    }
                    label={`Enable ${a.name}`}
                  />
                  <IconButton
                    label="Remove admin"
                    onClick={() => setRemoving(a)}
                    className="hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ),
          },
        ]}
      />
      {data && data.length > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.length}
          onPage={setPage}
        />
      )}

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite admin"
        subtitle="They'll receive an email to set their password."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInvite(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim() || !/\S+@\S+\.\S+/.test(form.email)}
              loading={create.isPending}
              onClick={() => create.mutate()}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@break.ae"
            />
          </Field>
          <Field label="Role">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`rounded-2xl border p-3 text-start transition ${form.role === r.value ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60"}`}
                >
                  <p className="text-[13px] font-bold">{r.label}</p>
                  <p className="text-xs text-ink-muted">{r.desc}</p>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove admin?"
        message={`${removing?.name} will lose access immediately.`}
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={() => removing && remove.mutate(removing.id)}
      />
    </div>
  );
}

function DeletionTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["deletion-requests"],
    queryFn: settingsService.deletionRequests,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const displayData = data?.slice((page - 1) * pageSize, page * pageSize);

  const resolve = useMutation({
    mutationFn: ({ id, status }) => settingsService.resolveDeletion(id, status),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["deletion-requests"] });
      toast(
        d.status === "approved"
          ? "Account scheduled for deletion"
          : "Request rejected",
      );
    },
  });
  return (
    <div className="card overflow-hidden">
      <p className="p-4 text-[13px] text-ink-muted">
        Requests made via "Delete account" in the apps. Approved accounts are
        anonymised within 30 days.
      </p>
      <DataTable
        rows={displayData}
        loading={isLoading}
        empty={
          <EmptyState icon={<UserX className="size-8" />} title="No requests" />
        }
        columns={[
          {
            key: "account",
            header: "Account",
            render: (d) => (
              <div className="flex items-center gap-3">
                <Avatar name={d.accountName} />
                <div>
                  <p className="font-semibold">{d.accountName}</p>
                  <p className="text-xs text-ink-muted">{d.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Type",
            render: (d) => <Badge tone="accent">{label(d.role)}</Badge>,
          },
          {
            key: "reason",
            header: "Reason",
            render: (d) => <span className="text-ink-muted">{d.reason}</span>,
          },
          {
            key: "createdAt",
            header: "Requested",
            render: (d) => (
              <span className="whitespace-nowrap text-ink-muted">
                {date(d.createdAt)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (d) => <StatusBadge status={d.status} />,
          },
          {
            key: "actions",
            header: "",
            className: "text-end",
            render: (d) =>
              d.status === "pending" && (
                <div className="flex justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      resolve.mutate({ id: d.id, status: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      resolve.mutate({ id: d.id, status: "approved" })
                    }
                  >
                    Approve
                  </Button>
                </div>
              ),
          },
        ]}
      />
      {data && data.length > pageSize && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.length}
          onPage={setPage}
        />
      )}
    </div>
  );
}

function ProfileTab() {
  const { admin, login, refresh } = useAuth(); // assume we could refresh, but usually admin context holds data.
  const toast = useToast();
  const [profile, setProfile] = useState({ name: admin?.name || "", email: admin?.email || "" });
  const [file, setFile] = useState(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  if (!admin) return null;
  const valid = pw.current && pw.next.length >= 8 && pw.next === pw.confirm;

  // Calculate display avatar
  let avatarSrc = null;
  if (file) {
    avatarSrc = URL.createObjectURL(file);
  } else if (admin.image) {
    const rawPic = admin.image;
    avatarSrc = import.meta.env.VITE_IMAGE_BASE + (rawPic.startsWith('/') ? rawPic.substring(1) : rawPic);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('profilePicInput').click()}>
            {avatarSrc ? (
              <img src={avatarSrc} alt={admin.name} className="size-16 rounded-full object-cover bg-gray-200" />
            ) : (
              <Avatar name={admin.name} size={64} />
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change</span>
            </div>
            <input
              type="file"
              id="profilePicInput"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />
          </div>
          <div>
            <Badge tone="accent" className="mt-1.5">
              {label(admin.role)}
            </Badge>
            <p className="text-xs text-gray-500 mt-1 cursor-pointer hover:underline" onClick={() => document.getElementById('profilePicInput').click()}>
              Click to change photo
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </Field>
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                try {
                  const fd = new FormData();
                  fd.append("name", profile.name);
                  fd.append("email", profile.email);
                  if (file) {
                    fd.append("profile_picture", file);
                  }
                  await authService.updateProfile(fd);
                  await refresh();
                  toast("Profile updated successfully!");
                } catch (e) {
                  toast("Failed to update profile");
                }
              }}
            >
              Update profile
            </Button>
          </div>
        </div>
      </Card>
      <Card title="Change password">
        <div className="space-y-4">
          <Field label="Current password">
            <div className="relative">
              <Input
                type={showPw.current ? "text" : "password"}
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
              >
                {showPw.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field label="New password" hint="At least 8 characters">
            <div className="relative">
              <Input
                type={showPw.next ? "text" : "password"}
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPw({ ...showPw, next: !showPw.next })}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
              >
                {showPw.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <Field
            label="Confirm new password"
            error={
              pw.confirm && pw.confirm !== pw.next
                ? "Passwords don't match"
                : undefined
            }
          >
            <div className="relative">
              <Input
                type={showPw.confirm ? "text" : "password"}
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-gray-600"
              >
                {showPw.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div className="flex justify-end">
            <Button
              disabled={!valid}
              onClick={async () => {
                try {
                  await authService.updatePassword(pw.current, pw.next);
                  toast("Password updated");
                  setPw({ current: "", next: "", confirm: "" });
                } catch (e) {
                  toast("Failed to update password");
                }
              }}
            >
              Update password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
