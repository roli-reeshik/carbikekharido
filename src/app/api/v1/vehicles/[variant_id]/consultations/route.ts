import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db/pool";
import { getUserIdFromRequest } from "@/lib/auth/requestAuth";
import { ResultSetHeader, RowDataPacket } from "mysql2";

/**
 * POST /api/v1/vehicles/:variant_id/consultations
 * Body: { expertId: number, slotId: number, meetingType?: 'voice' | 'video' }
 *
 * Books a 1-on-1 expert consultation. Slot is atomically marked booked
 * to prevent double-booking under concurrent requests.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { variant_id: string } }
) {
  const variantId = Number(params.variant_id);
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

  const { expertId, slotId, meetingType = "voice" } = body as {
    expertId?: number;
    slotId?: number;
    meetingType?: string;
  };

  if (!expertId || !slotId || !["voice", "video"].includes(meetingType)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [slotRows] = await conn.query<RowDataPacket[]>(
      `SELECT id, expert_id, status FROM expert_consultation_slots
       WHERE id = ? AND expert_id = ? FOR UPDATE`,
      [slotId, expertId]
    );

    if (slotRows.length === 0 || slotRows[0].status !== "available") {
      await conn.rollback();
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
    }

    const [booking] = await conn.query<ResultSetHeader>(
      `INSERT INTO expert_consultation_bookings
         (expert_id, user_id, vehicle_id, slot_id, meeting_type, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [expertId, userId, variantId, slotId, meetingType]
    );

    await conn.query(
      "UPDATE expert_consultation_slots SET status = 'booked' WHERE id = ?",
      [slotId]
    );

    await conn.commit();
    return NextResponse.json({ success: true, bookingId: booking.insertId }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error("consultation booking failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  } finally {
    conn.release();
  }
}
