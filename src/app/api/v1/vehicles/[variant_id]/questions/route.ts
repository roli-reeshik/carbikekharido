import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";
import { getUserIdFromRequest } from "@/lib/auth/requestAuth";
import { ResultSetHeader, RowDataPacket } from "mysql2";

/**
 * POST /api/v1/vehicles/:variant_id/questions
 * Body: { questionText: string }
 *
 * Security: requires a verified session (OTP-authenticated user).
 * Reviews submission is similarly gated — only logged-in users may post;
 * verified-owner badge is assigned server-side after order/registration match.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { variant_id: string } }
) {
  const variantId = Number(params.variant_id);
  if (!Number.isFinite(variantId) || variantId <= 0) {
    return NextResponse.json({ error: "invalid_variant_id" }, { status: 400 });
  }

  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const questionText = (body as { questionText?: string }).questionText?.trim();
  if (!questionText || questionText.length < 10 || questionText.length > 1000) {
    return NextResponse.json(
      { error: "invalid_question", message: "Question must be 10–1000 characters." },
      { status: 400 }
    );
  }

  const [vehicleRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM vehicles WHERE id = ?",
    [variantId]
  );
  if (vehicleRows.length === 0) {
    return NextResponse.json({ error: "variant_not_found" }, { status: 404 });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO vehicle_questions (vehicle_id, user_id, question_text, status)
     VALUES (?, ?, ?, 'open')`,
    [variantId, userId, questionText]
  );

  return NextResponse.json({ success: true, questionId: result.insertId }, { status: 201 });
}
