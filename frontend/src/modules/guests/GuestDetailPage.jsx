import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarCheck,
  Coins,
  Heart,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DetailList,
  PageHeader,
  PageLoader,
  StatCard,
  StatusBadge,
  useToast,
} from "@/components/ui";
import { guestService } from "@/services";
import { aed, date, label } from "@/lib/format";
import { BackLink } from "../BackLink";
import { BookingsTable } from "../BookingsTable";
import { ReportsList } from "../support/ReportsList";
import { SIGNUP_OPTIONS } from "./GuestsPage";

export function GuestDetailPage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["guests", id],
    queryFn: () => guestService.get(id),
  });

  const status = useMutation({
    mutationFn: (s) => guestService.setStatus(id, s),
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast(g.status === "blocked" ? "Guest blocked" : "Guest unblocked");
      setConfirm(null);
    },
  });
  const remove = useMutation({
    mutationFn: () => guestService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["guests"] });
      toast("Guest account deleted");
      navigate("/guests");
    },
  });

  if (isLoading || !data) return <PageLoader />;
  const g = data.guest;
  const blocked = g.status === "blocked";

  return (
    <>


      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex flex-col items-center pb-4 text-center">
            <Avatar name={g.name} src={g.image} size={84} />
            <p className="mt-3 text-lg font-bold">{g.name}</p>
            <p className="text-[13px] text-ink-muted">{g.email}</p>
            <div className="mt-3 flex gap-2">
              <StatusBadge status={g.status} />
              <Badge tone="accent">
                {g.language === "ar" ? "Arabic" : "English"}
              </Badge>
            </div>
          </div>
          <DetailList
            items={[
              { label: "Phone", value: `${g.dialCode} ${g.phone}` },
              { label: "Country", value: g.country },
              { label: "Gender", value: label(g.gender) },
              { label: "Date of birth", value: date(g.dob) },
              {
                label: "Signed up with",
                value: SIGNUP_OPTIONS.find((o) => o.value === g.signupMethod)
                  ?.label,
              },
              { label: "Last active", value: date(g.lastActiveAt) },
            ]}
          />
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Bookings"
              value={g.bookings}
              icon={<CalendarCheck className="size-5" />}
            />
            <StatCard
              label="Total spent"
              value={aed(g.totalSpent)}
              icon={<Coins className="size-5" />}
              tone="success"
            />
            <StatCard
              label="Wishlists"
              value={g.wishlists}
              icon={<Heart className="size-5" />}
              tone="warning"
            />
          </div>
          <Card title="Bookings" padded={false}>
            <div className="mt-3">
              <BookingsTable rows={data.bookings} hide={["guest"]} />
            </div>
          </Card>
          {data.reports.length > 0 && (
            <Card title="Reports involving this guest">
              <ReportsList reports={data.reports} />
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "block"}
        onClose={() => setConfirm(null)}
        title="Block guest?"
        loading={status.isPending}
        message="They will be signed out and won't be able to book or message hosts."
        confirmLabel="Block"
        onConfirm={() => status.mutate("blocked")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        title="Delete account?"
        loading={remove.isPending}
        message="This permanently deletes the guest account. Booking history is kept for accounting."
        confirmLabel="Delete"
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
