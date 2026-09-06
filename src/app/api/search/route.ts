import { NextRequest, NextResponse } from "next/server";
import { BUSINESS_TYPES, getLocationVariations } from "@/lib/businessTypes";

const SERPAPI_KEY = process.env.SERPAPI_KEY;

interface PlaceResult {
  name: string;
  phone: string;
  address: string;
  website: string;
}

async function searchSerpAPIPage(query: string, start: number = 0): Promise<PlaceResult[]> {
  const results: PlaceResult[] = [];
  const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&start=${start}&num=20`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return results;

    const data = await res.json();
    if (data.local_results) {
      for (const place of data.local_results) {
        results.push({
          name: place.title || "N/A",
          phone: place.phone || "N/A",
          address: place.address || "N/A",
          website: place.website || "N/A",
        });
      }
    }
  } catch (err) {
    // skip
  }

  return results;
}

async function searchAllPages(query: string): Promise<PlaceResult[]> {
  const allResults: PlaceResult[] = [];
  let start = 0;
  const maxPages = 10;

  for (let page = 0; page < maxPages; page++) {
    const results = await searchSerpAPIPage(query, start);
    if (results.length === 0) break;
    allResults.push(...results);
    start += 20;
    await new Promise((r) => setTimeout(r, 1200));
  }

  return allResults;
}

async function searchMaximized(
  type: string,
  location: string
): Promise<PlaceResult[]> {
  const seen = new Set<string>();
  const allResults: PlaceResult[] = [];

  const variations = BUSINESS_TYPES[type.toLowerCase()] || [type];
  const locationVars = getLocationVariations(location);
  const searchLocations = [...new Set(locationVars)];

  console.log(`Total: ${variations.length} variations x ${searchLocations.length} locations`);

  for (const loc of searchLocations) {
    for (const variation of variations) {
      const query = `${variation} in ${loc}`;
      console.log(`Searching: "${query}"`);

      const pageResults = await searchAllPages(query);

      let newCount = 0;
      for (const place of pageResults) {
        const key = place.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          allResults.push(place);
          newCount++;
        }
      }

      console.log(`  +${newCount} new (total unique: ${allResults.length})`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return allResults;
}

export async function POST(request: NextRequest) {
  try {
    const { location, type } = await request.json();

    if (!location || !type) {
      return NextResponse.json(
        { error: "Location and type are required" },
        { status: 400 }
      );
    }

    if (!SERPAPI_KEY) {
      return NextResponse.json(
        { error: "SerpAPI key is not configured" },
        { status: 500 }
      );
    }

    console.log(`Searching: ${type} in ${location}`);

    const results = await searchMaximized(type, location);

    return NextResponse.json({
      success: true,
      location: location,
      type: type,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
