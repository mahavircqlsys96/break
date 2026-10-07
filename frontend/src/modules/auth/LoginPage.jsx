import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import { usingMock } from "@/services/api";
import { MOCK_ADMIN_LOGIN } from "@/mocks/seed";
import { AuthShell } from "./AuthShell";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  if (admin) return <Navigate to="/" replace />;

  const onSubmit = async (v) => {
    setError("");
    try {
      await login(v.email, v.password);
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <AuthShell>
      <h1 className="font-display text-[32px] font-semibold">Welcome back</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        Sign in to the Break admin panel.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-4"
        noValidate
      >
        <Field label="Email address" error={errors.email?.message}>
          <Input
            leading={<Mail className="size-4" />}
            type="email"
            autoComplete="username"
            placeholder="admin@break.ae"
            {...register("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Input
              leading={<Lock className="size-4" />}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pe-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute inset-y-0 end-3 flex items-center text-ink-muted hover:text-primary"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-accent hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          Log in
        </Button>
      </form>

      {usingMock && (
        <p className="mt-8 rounded-2xl bg-accent-soft px-4 py-3 text-xs leading-relaxed text-primary">
          Demo mode — sign in with <b>{MOCK_ADMIN_LOGIN.email}</b> /{" "}
          <b>{MOCK_ADMIN_LOGIN.password}</b>
        </p>
      )}
    </AuthShell>
  );
}
