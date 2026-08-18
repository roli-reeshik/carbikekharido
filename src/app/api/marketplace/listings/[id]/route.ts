import { NextRequest, NextResponse } from "next/server";
import { apiFromError } from "@/lib/vehicles/api/responses";
import { getVehiclePublic } from "@/lib/vehicles/api/service";

export const runtime = "nodejs";

/** Legacy proxy — prefer GET /api/vehicles/[id]. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listing = await getVehiclePublic(params.id, false);
    return NextResponse.json({ listing });
  } catch (err) {
    const res = apiFromError(err);
    return res;
  }
}
