"use client";

import { useEffect, useMemo, useState } from "react";

type Invite = {
  id: string;
  token: string;
  email: string | null;
  createdByUserId: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type ApiError = {
  error?: string;
  requestId?: string;
};

export function InviteManager() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function loadInvites() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invites", { method: "GET" });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        setError(data.error ?? "Unable to load invites.");
        return;
      }

      const data = (await response.json()) as { invites: Invite[] };
      setInvites(data.invites ?? []);
    } catch {
      setError("Network error while loading invites.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInvites();
  }, []);

  async function handleCreateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback("");
    setError("");

    const parsedDays = Number(expiresInDays);
    const payload = {
      email: email.trim() || undefined,
      expiresInDays: Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 14,
    };

    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        setError(data.error ?? "Unable to create invite.");
        return;
      }

      const data = (await response.json()) as { invite?: Invite };
      if (data.invite) {
        setInvites((previous) => [data.invite as Invite, ...previous]);
        setFeedback(`Invite created: ${data.invite.token}`);
        setEmail("");
      }
    } catch {
      setError("Network error while creating invite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fallbackModeNotice = useMemo(() => {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        If <code>INVITE_CODES</code> is set, those env codes still work as bootstrap fallback.
      </p>
    );
  }, []);

  return (
    <section className="grid gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-xl font-semibold tracking-tight">Create invite</h2>
        <p className="mt-1 text-sm text-slate-600">Generate a one-time invite code for new members.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-6" onSubmit={handleCreateInvite}>
          <div className="sm:col-span-4">
            <label className="text-sm font-medium text-slate-700" htmlFor="invite-email">
              Target email (optional)
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="expires-in-days">
              Expire (days)
            </label>
            <input
              id="expires-in-days"
              name="expiresInDays"
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(event) => setExpiresInDays(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
            />
          </div>
          <div className="sm:col-span-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create invite"}
            </button>
          </div>
        </form>
        {feedback ? <p className="mt-3 text-sm text-emerald-700">{feedback}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </div>

      {fallbackModeNotice}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Recent invites</h2>
          <button
            type="button"
            onClick={() => void loadInvites()}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-slate-600">Loading invites...</p>
        ) : invites.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No invites yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-4 font-medium">Token</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Expires</th>
                  <th className="py-2 pr-4 font-medium">Used</th>
                  <th className="py-2 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-4 font-mono text-xs">{invite.token}</td>
                    <td className="py-2 pr-4">{invite.email ?? "-"}</td>
                    <td className="py-2 pr-4">{formatDate(invite.expiresAt)}</td>
                    <td className="py-2 pr-4">{invite.usedAt ? formatDate(invite.usedAt) : "No"}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        onClick={() => void navigator.clipboard.writeText(invite.token)}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}
