import { NextRequest, NextResponse } from "next/server";
import { getOrderSummary } from "@/lib/db/ordersRepo";
import { getUserIdForSession } from "@/lib/db/sessionsRepo";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userId = token ? await getUserIdForSession(token) : null;
  if (!userId) {
    return NextResponse.json({ success: false, error: "unauthenticated" }, { status: 401 });
  }

  const orderId = Number(params.id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ success: false, error: "invalid_order_id" }, { status: 400 });
  }

  const summary = await getOrderSummary(orderId);
  if (!summary || summary.buyer_user_id !== userId) {
    return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: summary });
}
