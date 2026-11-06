import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  fetchBookingContext,
  isDateWithinHorizon,
  slotsForDate,
} from "@/server/booking";
import { allowRequest } from "@/server/rate-limit";

const querySchema = z.object({
  slug: z.string().trim().min(1).max(64),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    slug: request.nextUrl.searchParams.get("slug") ?? "",
    serviceId: request.nextUrl.searchParams.get("serviceId") ?? "",
    date: request.nextUrl.searchParams.get("date") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid availability request." },
      { status: 400 },
    );
  }

  if (!(await allowRequest("slots", 120, 10 * 60))) {
    return NextResponse.json(
      { error: "Too many requests. Wait a moment and try again." },
      { status: 429 },
    );
  }

  const context = await fetchBookingContext(
    parsed.data.slug,
    parsed.data.serviceId,
  );

  if (!context) {
    return NextResponse.json(
      { error: "This booking page is unavailable." },
      { status: 404 },
    );
  }

  if (!isDateWithinHorizon(parsed.data.date, context.business.timezone)) {
    return NextResponse.json(
      { error: "Choose a date within the booking window." },
      { status: 400 },
    );
  }

  const slots = slotsForDate(context, parsed.data.date);

  return NextResponse.json(
    { slots, timezone: context.business.timezone },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
