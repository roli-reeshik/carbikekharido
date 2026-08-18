import { pool } from "./pool";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export type OrderType = "new_vehicle_booking" | "used_vehicle_purchase";
export type OrderStatus =
  | "created"
  | "payment_pending"
  | "paid"
  | "confirmed"
  | "delivered"
  | "cancelled"
  | "refunded";

interface CreateOrderInput {
  buyerUserId: number;
  orderType: OrderType;
  vehicleId?: number; // required for new_vehicle_booking
  listingId?: number; // required for used_vehicle_purchase
  dealerId?: number;
  cityId: number;
  quotedOnRoadPrice: number;
  tradeInCredit?: number;
}

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `CBD-${datePart}-${randomPart}`;
}

/**
 * One order-creation function for both new-vehicle bookings and
 * used-vehicle purchases — the `orderType` discriminator, not two
 * separate functions/tables, per the schema's design notes.
 */
export async function createOrder(input: CreateOrderInput): Promise<{ id: number; orderNumber: string }> {
  if (input.orderType === "new_vehicle_booking" && !input.vehicleId) {
    throw new Error("vehicleId is required for new_vehicle_booking orders");
  }
  if (input.orderType === "used_vehicle_purchase" && !input.listingId) {
    throw new Error("listingId is required for used_vehicle_purchase orders");
  }

  const orderNumber = generateOrderNumber();
  const tradeInCredit = input.tradeInCredit ?? 0;
  const amountPayable = input.quotedOnRoadPrice - tradeInCredit;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO orders
       (order_number, buyer_user_id, order_type, vehicle_id, listing_id, dealer_id,
        city_id, quoted_on_road_price, trade_in_credit, amount_payable, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
    [
      orderNumber,
      input.buyerUserId,
      input.orderType,
      input.vehicleId ?? null,
      input.listingId ?? null,
      input.dealerId ?? null,
      input.cityId,
      input.quotedOnRoadPrice,
      tradeInCredit,
      amountPayable,
    ]
  );

  await pool.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
     VALUES (?, NULL, 'created', 'buyer', 'Order placed')`,
    [result.insertId]
  );

  return { id: result.insertId, orderNumber };
}

export async function updateOrderStatus(
  orderId: number,
  toStatus: OrderStatus,
  changedBy: "system" | "buyer" | "dealer" | "admin",
  note?: string
): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT status FROM orders WHERE id = ?", [orderId]);
  const fromStatus = rows[0]?.status ?? null;

  await pool.query("UPDATE orders SET status = ? WHERE id = ?", [toStatus, orderId]);
  await pool.query(
    `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
     VALUES (?, ?, ?, ?, ?)`,
    [orderId, fromStatus, toStatus, changedBy, note ?? null]
  );
}

export async function recordTransaction(params: {
  orderId: number;
  type: "booking_amount" | "full_payment" | "emi_down_payment" | "escrow_hold" | "escrow_release" | "refund";
  amount: number;
  gateway?: string;
  gatewayReference?: string;
  status?: "initiated" | "success" | "failed" | "reversed";
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO transactions (order_id, transaction_type, amount, gateway, gateway_reference, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      params.orderId,
      params.type,
      params.amount,
      params.gateway ?? null,
      params.gatewayReference ?? null,
      params.status ?? "initiated",
    ]
  );
  return result.insertId;
}

export async function getOrderSummary(orderId: number) {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM v_order_summary WHERE id = ?", [orderId]);
  return rows[0] ?? null;
}

export async function listOrdersForUser(userId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM v_order_summary WHERE buyer_user_id = ? ORDER BY id DESC",
    [userId]
  );
  return rows;
}
