import { NextRequest, NextResponse } from "next/server";

export interface ApiErrorBody {
  ok: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccessBody<T>, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    { ok: false, error: message, code, details } satisfies ApiErrorBody,
    { status }
  );
}

export function apiFromError(err: unknown, fallbackCode = "internal_error") {
  if (err instanceof ApiHttpError) {
    return apiError(err.code, err.message, err.status, err.details);
  }
  console.error("[vehicles-api]", err);
  return apiError(fallbackCode, "An unexpected error occurred", 500);
}

/** Typed HTTP error thrown from service layer. */
export class ApiHttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

export async function parseJsonBody<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiHttpError(400, "invalid_json", "Request body must be valid JSON");
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
