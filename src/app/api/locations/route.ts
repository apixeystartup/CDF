import { NextResponse } from "next/server";
import { INDIAN_STATES, INDIAN_CITIES, BUSINESS_TYPES } from "@/lib/businessTypes";

export async function GET() {
  return NextResponse.json({
    states: Object.keys(INDIAN_STATES),
    cities: INDIAN_CITIES,
    districts: INDIAN_STATES,
    types: Object.keys(BUSINESS_TYPES),
  });
}
