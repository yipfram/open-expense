export type UiErrorCode = "validation" | "authentication" | "conflict" | "database" | "unknown";

export type UiError = {
  code: UiErrorCode;
  message: string;
  requestId: string;
};

export function uiErrorToStatusCode(error: UiError): number {
  switch (error.code) {
    case "validation":
      return 400;
    case "authentication":
      return 401;
    case "conflict":
      return 409;
    case "database":
      return 503;
    default:
      return 500;
  }
}

type UnknownRecord = Record<string, unknown>;

export function toUiError(error: unknown, fallbackMessage: string): UiError {
  const requestId = makeRequestId();
  const normalized = normalizeError(error);
  const code = classifyError(normalized);
  const specificMessage = getSpecificUiMessage(normalized);
  const message = specificMessage ?? messageForCode(code, fallbackMessage);

  return {
    code,
    message,
    requestId,
  };
}

export function logServerError(context: string, error: unknown, requestId: string) {
  const normalized = normalizeError(error);
  console.error(`[${requestId}] ${context}`, {
    message: normalized.message,
    code: normalized.code,
    status: normalized.status,
    details: normalized.details,
    stack: normalized.stack,
    raw: error,
  });
}

type NormalizedError = {
  message: string;
  code?: string;
  status?: number;
  details: string[];
  stack?: string;
};

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const withCode = error as Error & {
      code?: string;
      status?: number;
      statusCode?: number;
      cause?: unknown;
    };
    const details = collectErrorDetails(error);
    return {
      message: withCode.message ?? "Unknown error",
      code: withCode.code,
      status: withCode.status ?? withCode.statusCode,
      details,
      stack: withCode.stack,
    };
  }

  if (isRecord(error)) {
    const details = collectErrorDetails(error);
    const status = toNumber(error.status) ?? toNumber(error.statusCode);
    return {
      message: String(error.message ?? "Unknown error"),
      code: typeof error.code === "string" ? error.code : undefined,
      status,
      details,
    };
  }

  return {
    message: String(error),
    details: [],
  };
}

function classifyError(error: NormalizedError): UiErrorCode {
  const source = `${error.code ?? ""} ${error.message} ${error.details.join(" ")}`.toLowerCase();

  if (error.status === 400 || error.status === 422 || source.includes("invalid_")) {
    return "validation";
  }

  if (error.code === "23505" || source.includes("unique constraint")) {
    return "conflict";
  }

  if (
    source.includes("econnrefused") ||
    source.includes("database") ||
    source.includes("connection terminated") ||
    source.includes("timeout")
  ) {
    return "database";
  }

  if (
    source.includes("invalid credential") ||
    source.includes("invalid email or password") ||
    source.includes("unauthorized")
  ) {
    return "authentication";
  }

  return "unknown";
}

function messageForCode(code: UiErrorCode, fallbackMessage: string) {
  switch (code) {
    case "conflict":
      return "This account already exists.";
    case "database":
      return "Service is temporarily unavailable. Please retry in a moment.";
    case "authentication":
      return "Invalid credentials.";
    case "validation":
      return fallbackMessage;
    default:
      return fallbackMessage;
  }
}

function getSpecificUiMessage(error: NormalizedError): string | undefined {
  const source = `${error.code ?? ""} ${error.message} ${error.details.join(" ")}`.toLowerCase();

  if (
    source.includes("user_already_exists_use_another_email") ||
    source.includes("already exists") ||
    source.includes("duplicate key") ||
    source.includes("email already")
  ) {
    return "This email is already registered. Try signing in instead.";
  }

  if (source.includes("password_too_short")) {
    return "Password is too short.";
  }

  if (source.includes("password_too_long")) {
    return "Password is too long.";
  }

  if (source.includes("invalid_email")) {
    return "Please enter a valid email address.";
  }

  if (source.includes("invalid_password")) {
    return "Password is invalid.";
  }

  if (source.includes("failed_to_create_user")) {
    return "Could not create the user record. Check server logs with the reference ID.";
  }

  return undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function collectErrorDetails(error: unknown): string[] {
  if (!isRecord(error)) {
    return [];
  }

  const candidates = [
    error.code,
    error.message,
    error.status,
    error.statusCode,
    getNested(error, "body.code"),
    getNested(error, "body.message"),
    getNested(error, "body.error"),
    getNested(error, "body.error_description"),
    getNested(error, "data.code"),
    getNested(error, "data.message"),
    getNested(error, "cause.code"),
    getNested(error, "cause.message"),
  ];

  const details = candidates
    .map((value) => (typeof value === "string" || typeof value === "number" ? String(value).trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(details));
}

function getNested(value: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = value;

  for (const key of keys) {
    if (!isRecord(current) || !(key in current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function makeRequestId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
