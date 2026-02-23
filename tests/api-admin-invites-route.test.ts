import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const headersMock = vi.fn();
const getUserRoles = vi.fn();
const listInvites = vi.fn();
const createInvite = vi.fn();
const canSignUp = vi.fn();
const consumeInviteCode = vi.fn();
const toUiError = vi.fn();
const uiErrorToStatusCode = vi.fn();
const logServerError = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/src/lib/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("@/src/lib/roles", () => ({
  getUserRoles,
}));

vi.mock("@/src/lib/invites", () => ({
  listInvites,
  createInvite,
  canSignUp,
  consumeInviteCode,
}));

vi.mock("@/src/lib/errors", () => ({
  toUiError,
  uiErrorToStatusCode,
  logServerError,
}));

describe("/api/admin/invites", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    getSession.mockResolvedValueOnce(null);
    const { GET } = await import("../app/api/admin/invites/route");

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("GET returns 403 for non-admin users", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["member"]);
    const { GET } = await import("../app/api/admin/invites/route");

    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("POST returns 201 for admins", async () => {
    getSession.mockResolvedValueOnce({ user: { id: "u1" } });
    getUserRoles.mockResolvedValueOnce(["admin"]);
    createInvite.mockResolvedValueOnce({
      id: "i1",
      token: "inv_token",
      email: "user@example.com",
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    const { POST } = await import("../app/api/admin/invites/route");
    const response = await POST(
      new Request("http://localhost/api/admin/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", expiresInDays: 14 }),
      }),
    );

    expect(response.status).toBe(201);
  });
});
