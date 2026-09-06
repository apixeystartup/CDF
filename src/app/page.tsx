"use client";

import { useState, useEffect } from "react";

interface PlaceData {
  name: string;
  phone: string;
  address: string;
  website: string;
}

interface LocationData {
  states: string[];
  cities: Record<string, string[]>;
  districts: Record<string, string[]>;
  types: string[];
}

export default function Home() {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [useCustomType, setUseCustomType] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceData[]>([]);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => setLocationData(data))
      .catch(() => {});
  }, []);

  const cities = selectedState && locationData?.districts
    ? locationData.districts[selectedState] || []
    : [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLocation = useCustomLocation
      ? customLocation
      : selectedCity || selectedState;

    const finalType = useCustomType ? customType : type;

    if (!finalLocation.trim() || !finalType.trim()) {
      setError("Please select location and business type");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: finalLocation,
          type: finalType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data.data);
      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) return;

    const finalLocation = useCustomLocation
      ? customLocation
      : selectedCity || selectedState;
    const finalType = useCustomType ? customType : type;

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: results,
          location: finalLocation,
          type: finalType,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${finalType}_${finalLocation.replace(/,\s*/g, "_")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Failed to download Excel file");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Client Data Fetcher
          </h1>
          <p className="text-blue-300 text-lg">
            Search businesses by location and type, export to Excel
          </p>
          {totalCount > 0 && (
            <p className="text-green-400 text-sm mt-1">
              Last search: {totalCount} businesses found
            </p>
          )}
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                State (India)
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity("");
                  setUseCustomLocation(false);
                }}
                disabled={useCustomLocation}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="" className="bg-slate-800">Select State...</option>
                {locationData?.states.map((s) => (
                  <option key={s} value={s} className="bg-slate-800">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                City / District
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setUseCustomLocation(false);
                }}
                disabled={useCustomLocation || !selectedState}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="" className="bg-slate-800">Select City...</option>
                {cities.map((c) => (
                  <option key={c} value={c} className="bg-slate-800">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Business Type
              </label>
              {useCustomType ? (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Enter custom type..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" className="bg-slate-800">Select type...</option>
                  {locationData?.types.map((t) => (
                    <option key={t} value={t} className="bg-slate-800">
                      {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 text-blue-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomLocation}
                onChange={(e) => setUseCustomLocation(e.target.checked)}
                className="rounded"
              />
              Custom location
            </label>
            <label className="flex items-center gap-2 text-blue-300 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomType}
                onChange={(e) => setUseCustomType(e.target.checked)}
                className="rounded"
              />
              Custom type
            </label>
          </div>

          {useCustomLocation && (
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Enter custom location (e.g., Visakhapatnam, Andhra Pradesh)"
              className="w-full mt-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </form>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-200">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Results for &quot;{(useCustomType ? customType : type).replace(/_/g, " ")}&quot;
                </h2>
                <p className="text-blue-300 text-sm mt-1">
                  Found {totalCount} businesses
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-800/90">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase">S.No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-300 uppercase">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((place, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {place.name === "N/A" ? <span className="text-gray-500">None</span> : place.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {place.phone === "N/A" ? <span className="text-gray-500">None</span> : place.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {place.address === "N/A" ? <span className="text-gray-500">None</span> : place.address}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {place.website === "N/A" ? (
                          <span className="text-gray-500">None</span>
                        ) : (
                          <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline truncate block max-w-xs">
                            {place.website}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-blue-400/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-400 text-lg">Select a state, city, and business type to search</p>
          </div>
        )}
      </div>
    </div>
  );
}
