import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { authService } from "@/services";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await authService.forgotPassword(email).finally(() => setLoading(false));
    setSent(true);
  };

  return (
    <AuthShell>
      <Link
        to="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> Back to login
      </Link>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-accent-soft text-primary">
            <MailCheck className="size-7" />
          </span>
          <h1 className="font-display text-[28px] font-semibold">
            Check your inbox
          </h1>
          <p className="mt-2 text-[13px] text-ink-muted">
            If <b className="text-ink">{email}</b> belongs to an admin, we've
            sent a reset link.
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-[32px] font-semibold">
            Reset password
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-muted">
            Enter your admin email and we'll send a reset link.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email address">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@break.ae"
              />
            </Field>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
            >
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
