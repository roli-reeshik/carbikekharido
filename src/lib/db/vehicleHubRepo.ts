import { RowDataPacket } from "mysql2";
import { pool } from "./pool";
import { formatIndianPrice } from "@/lib/currency";
import { getActiveOffersForVehicle } from "@/lib/db/syncRepo";

const PLACEHOLDER_IMAGE = "/placeholder-vehicle.png";

export interface VehicleHubPayload {
  variantId: number;
  specs: {
    core: Record<string, string>;
    dimensions: Record<string, string>;
    safety: Record<string, string>;
    pricing: {
      exShowroomExact: string;
      exShowroomLabel: string;
      onRoadTotal: string | null;
      onRoadCity: string | null;
    };
    brand: string;
    model: string;
    variant: string;
    vehicleType: "car" | "bike";
    fuelType: string;
  };
  reviews: {
    averageRating: number | null;
    totalCount: number;
    verifiedCount: number;
    items: {
      id: number;
      rating: number;
      title: string;
      body: string;
      isVerifiedOwner: boolean;
      authorName: string;
      helpfulCount: number;
      createdAt: string;
    }[];
  };
  qa: {
    questions: {
      id: number;
      questionText: string;
      authorName: string;
      status: string;
      createdAt: string;
      answers: {
        id: number;
        answerText: string;
        isVerifiedOwner: boolean;
        isExpertResponse: boolean;
        authorName: string;
        createdAt: string;
      }[];
    }[];
    expertLog: {
      id: number;
      expertName: string;
      slaDeadline: string;
      respondedAt: string | null;
      responseText: string | null;
      status: string;
    }[];
  };
  experts: {
    items: {
      id: number;
      name: string;
      title: string;
      bio: string | null;
      specializations: string[];
      rating: number;
      consultationFeeInr: number;
      slaResponseHours: number;
      availableSlots: { id: number; slotStart: string; slotEnd: string }[];
    }[];
  };
  editorial: {
    articles: {
      id: number;
      title: string;
      slug: string;
      excerpt: string | null;
      thumbnailUrl: string | null;
      readTimeMinutes: number;
      publishedAt: string | null;
      authorName: string;
      seoMetaTitle: string | null;
      seoJsonLd: Record<string, unknown> | null;
    }[];
  };
  offers: {
    id: number;
    title: string;
    description: string | null;
    discountAmount: number | null;
    validTill: string;
  }[];
  images: string[];
}

/**
 * Aggregated vehicle hub — four concurrent query lanes (specs, reviews,
 * experts, editorial) merged into one response. Pagination for reviews is
 * applied server-side (page + limit) to keep the initial hub payload bounded.
 */
export async function getVehicleHub(
  variantId: number,
  opts: { reviewPage?: number; reviewLimit?: number; cityId?: number } = {}
): Promise<VehicleHubPayload | null> {
  const reviewPage = Math.max(1, opts.reviewPage ?? 1);
  const reviewLimit = Math.min(20, Math.max(1, opts.reviewLimit ?? 10));
  const reviewOffset = (reviewPage - 1) * reviewLimit;

  const [vehicleRows] = await pool.query<RowDataPacket[]>(
    `SELECT v.id, v.vehicle_type, v.model_name, v.variant_name, v.fuel_type,
            v.ex_showroom_price, v.brand_id, b.name AS brand_name
     FROM vehicles v
     JOIN brands b ON b.id = v.brand_id
     WHERE v.id = ?`,
    [variantId]
  );

  if (vehicleRows.length === 0) return null;

  const vehicle = vehicleRows[0];

  const [specRows, imageRows, onRoadRows, reviewAggRows, reviewRows, questionRows, expertRows, slotRows, qaLogRows, articleRows] =
    await Promise.all([
      pool.query<RowDataPacket[]>(
        "SELECT spec_key, spec_value FROM vehicle_specs WHERE vehicle_id = ?",
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        "SELECT image_url FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order",
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT orp.on_road_total, c.name AS city_name
         FROM on_road_prices orp
         JOIN cities c ON c.id = orp.city_id
         WHERE orp.vehicle_id = ?
         ORDER BY orp.effective_from DESC
         LIMIT 1`,
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT AVG(rating) AS avg_rating, COUNT(*) AS total_count,
                SUM(is_verified_owner) AS verified_count
         FROM vehicle_reviews
         WHERE vehicle_id = ? AND status = 'published'`,
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT vr.id, vr.rating, vr.title, vr.body, vr.is_verified_owner,
                vr.helpful_count, vr.created_at, u.name AS author_name
         FROM vehicle_reviews vr
         JOIN users u ON u.id = vr.user_id
         WHERE vr.vehicle_id = ? AND vr.status = 'published'
         ORDER BY vr.is_verified_owner DESC, vr.created_at DESC
         LIMIT ? OFFSET ?`,
        [variantId, reviewLimit, reviewOffset]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT vq.id, vq.question_text, vq.status, vq.created_at, u.name AS author_name
         FROM vehicle_questions vq
         JOIN users u ON u.id = vq.user_id
         WHERE vq.vehicle_id = ?
         ORDER BY vq.created_at DESC
         LIMIT 15`,
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT e.id, e.name, e.title, e.bio, e.specializations,
                e.rating, e.consultation_fee_inr, e.sla_response_hours
         FROM experts e
         LEFT JOIN expert_brand_tags ebt ON ebt.expert_id = e.id
         WHERE e.is_active = TRUE
           AND (e.vehicle_types LIKE ? OR e.vehicle_types LIKE '%car,bike%')
           AND (ebt.brand_id IS NULL OR ebt.brand_id = ?)
         ORDER BY e.rating DESC
         LIMIT 6`,
        [`%${vehicle.vehicle_type}%`, vehicle.brand_id]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT ecs.id, ecs.expert_id, ecs.slot_start, ecs.slot_end
         FROM expert_consultation_slots ecs
         JOIN experts e ON e.id = ecs.expert_id
         WHERE ecs.status = 'available' AND ecs.slot_start > NOW()
         ORDER BY ecs.slot_start ASC
         LIMIT 40`,
        []
      ),
      pool.query<RowDataPacket[]>(
        `SELECT eql.id, e.name AS expert_name, eql.sla_deadline, eql.responded_at,
                eql.response_text, eql.status
         FROM expert_qa_log eql
         JOIN experts e ON e.id = eql.expert_id
         WHERE eql.vehicle_id = ?
         ORDER BY eql.sla_deadline DESC
         LIMIT 10`,
        [variantId]
      ),
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT a.id, a.title, a.slug, a.excerpt, a.thumbnail_url,
                a.read_time_minutes, a.published_at, a.seo_meta_title, a.seo_json_ld,
                au.name AS author_name
         FROM articles a
         JOIN authors au ON au.id = a.author_id
         JOIN article_entity_tags aet ON aet.article_id = a.id
         WHERE a.status = 'published'
           AND (
             aet.vehicle_id = ?
             OR (aet.brand_id = ? AND (aet.model_name IS NULL OR aet.model_name = ?))
             OR aet.model_name = ?
           )
         ORDER BY a.published_at DESC
         LIMIT 3`,
        [variantId, vehicle.brand_id, vehicle.model_name, vehicle.model_name]
      ),
    ]);

  const specsMap: Record<string, string> = {};
  for (const row of specRows[0]) specsMap[row.spec_key] = row.spec_value;

  const dimensionKeys = ["length_mm", "width_mm", "height_mm", "wheelbase_mm", "boot_space_litres", "ground_clearance_mm"];
  const safetyKeys = ["safety_rating", "airbags", "abs", "esc", "ncap_rating"];
  const coreKeys = ["transmission", "displacement_cc", "arai_mileage", "arai_mileage_unit", "seating_capacity", "fuel_type"];

  const pick = (keys: string[]) =>
    Object.fromEntries(keys.filter((k) => specsMap[k]).map((k) => [k, specsMap[k]]));

  const priceFmt = formatIndianPrice(Number(vehicle.ex_showroom_price));
  const onRoad = onRoadRows[0][0];
  const onRoadFmt = onRoad ? formatIndianPrice(Number(onRoad.on_road_total)) : null;

  const agg = reviewAggRows[0][0];
  const images = imageRows[0].length > 0 ? imageRows[0].map((r) => r.image_url) : [PLACEHOLDER_IMAGE];

  const questionIds = questionRows[0].map((q) => q.id);
  let answerRows: RowDataPacket[] = [];
  if (questionIds.length > 0) {
    const [ans] = await pool.query<RowDataPacket[]>(
      `SELECT va.id, va.question_id, va.answer_text, va.is_verified_owner,
              va.is_expert_response, va.created_at,
              COALESCE(u.name, e.name, 'Community') AS author_name
       FROM vehicle_answers va
       LEFT JOIN users u ON u.id = va.user_id
       LEFT JOIN experts e ON e.id = va.expert_id
       WHERE va.question_id IN (?)
       ORDER BY va.created_at ASC`,
      [questionIds]
    );
    answerRows = ans;
  }

  const answersByQuestion = new Map<number, typeof answerRows>();
  for (const a of answerRows) {
    const list = answersByQuestion.get(a.question_id) ?? [];
    list.push(a);
    answersByQuestion.set(a.question_id, list);
  }

  const slotsByExpert = new Map<number, { id: number; slotStart: string; slotEnd: string }[]>();
  for (const s of slotRows[0]) {
    const list = slotsByExpert.get(s.expert_id) ?? [];
    if (list.length < 8) {
      list.push({ id: s.id, slotStart: s.slot_start, slotEnd: s.slot_end });
    }
    slotsByExpert.set(s.expert_id, list);
  }

  let offerRows: RowDataPacket[] = [];
  try {
    offerRows = await getActiveOffersForVehicle(variantId);
  } catch {
    // vehicle_offers table may not exist until migration 003 is applied.
  }

  return {
    variantId,
    specs: {
      core: {
        fuel_type: vehicle.fuel_type,
        ...pick(coreKeys),
      },
      dimensions: pick(dimensionKeys),
      safety: pick(safetyKeys),
      pricing: {
        exShowroomExact: priceFmt.exact,
        exShowroomLabel: priceFmt.label,
        onRoadTotal: onRoadFmt?.exact ?? null,
        onRoadCity: onRoad?.city_name ?? null,
      },
      brand: vehicle.brand_name,
      model: vehicle.model_name,
      variant: vehicle.variant_name,
      vehicleType: vehicle.vehicle_type,
      fuelType: vehicle.fuel_type,
    },
    reviews: {
      averageRating: agg?.avg_rating ? Number(Number(agg.avg_rating).toFixed(1)) : null,
      totalCount: Number(agg?.total_count ?? 0),
      verifiedCount: Number(agg?.verified_count ?? 0),
      items: reviewRows[0].map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedOwner: Boolean(r.is_verified_owner),
        authorName: r.author_name ?? "Owner",
        helpfulCount: r.helpful_count,
        createdAt: r.created_at,
      })),
    },
    qa: {
      questions: questionRows[0].map((q) => ({
        id: q.id,
        questionText: q.question_text,
        authorName: q.author_name ?? "User",
        status: q.status,
        createdAt: q.created_at,
        answers: (answersByQuestion.get(q.id) ?? []).map((a) => ({
          id: a.id,
          answerText: a.answer_text,
          isVerifiedOwner: Boolean(a.is_verified_owner),
          isExpertResponse: Boolean(a.is_expert_response),
          authorName: a.author_name,
          createdAt: a.created_at,
        })),
      })),
      expertLog: qaLogRows[0].map((l) => ({
        id: l.id,
        expertName: l.expert_name,
        slaDeadline: l.sla_deadline,
        respondedAt: l.responded_at,
        responseText: l.response_text,
        status: l.status,
      })),
    },
    experts: {
      items: expertRows[0].map((e) => ({
        id: e.id,
        name: e.name,
        title: e.title,
        bio: e.bio,
        specializations: typeof e.specializations === "string" ? JSON.parse(e.specializations) : e.specializations,
        rating: Number(e.rating),
        consultationFeeInr: Number(e.consultation_fee_inr),
        slaResponseHours: e.sla_response_hours,
        availableSlots: slotsByExpert.get(e.id) ?? [],
      })),
    },
    editorial: {
      articles: articleRows[0].map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        thumbnailUrl: a.thumbnail_url,
        readTimeMinutes: a.read_time_minutes,
        publishedAt: a.published_at,
        authorName: a.author_name,
        seoMetaTitle: a.seo_meta_title,
        seoJsonLd: a.seo_json_ld,
      })),
    },
    offers: offerRows.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      discountAmount: o.discount_amount ? Number(o.discount_amount) : null,
      validTill: o.valid_till,
    })),
    images,
  };
}
