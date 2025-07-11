"use client";

import { useState, useEffect } from "react";
import {
  Car,
  Search,
  Calendar,
  Globe,
  BarChart2,
} from "lucide-react";
import ForecastSidebar from "@/components/ForecastSidebar";

export default function ChartPage() {
  const [region, setRegion] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const [regions, setRegions] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Example: Fetch dropdown options
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/forecast/dropdown_data");
        const data = await response.json();
        setRegions(data.regions || []); // Make sure your backend sends regions too!
        setManufacturers(data.manufacturers);
        setModels(data.models);
        setYears(data.years);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch models based on manufacturer
  useEffect(() => {
    if (manufacturer) {
      const fetchModels = async () => {
        const response = await fetch(
          `http://127.0.0.1:5000/forecast/dropdown_data?manufacturer=${manufacturer}`
        );
        const data = await response.json();
        setModels(data.models);
      };
      fetchModels();
    }
  }, [manufacturer]);

  const handleChartFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setChartUrl(null);
    setIsLoading(true);

    const queryParams = new URLSearchParams();
    if (region) queryParams.append("region", region);
    if (manufacturer) queryParams.append("manufacturer", manufacturer);
    if (model) queryParams.append("model", model);
    if (year) queryParams.append("year", year);

    const apiUrl = `http://127.0.0.1:5000/price-over-time?${queryParams.toString()}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setChartUrl(url);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <ForecastSidebar />

      {/* Main */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
        {/* Decorative */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 pt-16 pb-8 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-full shadow-lg">
                <BarChart2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Price Over Time Chart
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Visualize price trends for selected vehicles over time.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 mt-16">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
            <form onSubmit={handleChartFetch} className="space-y-8">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Region */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Globe className="w-4 h-4 mr-2" /> Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value="" disabled>Select Region</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Manufacturer */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Car className="w-4 h-4 mr-2" /> Manufacturer
                  </label>
                  <select
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value="" disabled>Select Manufacturer</option>
                    {manufacturers.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Search className="w-4 h-4 mr-2" /> Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value="" disabled>Select Model</option>
                    {models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className="group">
                  <label className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Calendar className="w-4 h-4 mr-2" /> Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    <option value="" disabled>Select Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300"
                >
                  {isLoading ? "Loading..." : "Generate Chart"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Chart */}
        {chartUrl && (
          <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 mt-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex justify-center">
              <img src={chartUrl} alt="Price Over Time Chart" className="rounded-xl" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 mt-16">
            <div className="bg-red-600 text-white text-center p-4 rounded-xl">
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
