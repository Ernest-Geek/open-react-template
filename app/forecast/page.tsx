"use client";
import { useState, useEffect } from "react";
import { Car, TrendingUp, AlertCircle, Calendar, DollarSign, Search, User } from "lucide-react";
import ForecastSidebar from "@/components/ForecastSidebar";

interface ForecastData {
  [month: string]: string;
}

export default function Forecast() {
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for dropdown options
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  // Fetch the dropdown data when the component is first rendered
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/forecast/dropdown_data");
        const data = await response.json();
        console.log('Dropdown Data:', data);
        setManufacturers(data.manufacturers);
        setModels(data.models);
        setYears(data.years);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch models when a manufacturer is selected
  useEffect(() => {
    if (manufacturer) {
      const fetchModels = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/forecast/dropdown_data?manufacturer=${manufacturer}`
          );
          const data = await response.json();
          setModels(data.models);
        } catch (error) {
          console.error("Error fetching models:", error);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [manufacturer]);

  // Fetch years when a model is selected
  useEffect(() => {
    if (model) {
      const fetchYears = async () => {
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/forecast/dropdown_data?manufacturer=${manufacturer}&model=${model}`
          );
          const data = await response.json();
          setYears(data.years);
        } catch (error) {
          console.error("Error fetching years:", error);
        }
      };
      fetchYears();
    } else {
      setYears([]);
    }
  }, [model, manufacturer]);

  // Handle form submission and fetching forecast data
  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForecast(null);
    setIsLoading(true);

    const apiUrl = `http://127.0.0.1:5000/forecast/forecast?manufacturer=${manufacturer}&model=${model}&year=${year}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorDetails = await response.text(); // Get the raw error response
        console.error("Error fetching forecast data:", errorDetails);
        throw new Error("Failed to fetch forecast data");
      }

      const data = await response.json();

      if (data.error) {
        // Check if the error is related to insufficient data and display a more user-friendly message
        if (data.error.includes("Not enough data")) {
          setError(`Sorry, there isn't enough data available for the selected combination (${manufacturer} ${model} ${year}). Please try a different combination.`);
        } else {
          // Handle other types of errors (e.g., server errors, invalid parameters)
          setError(data.error);
        }
      } else {
        setForecast(data.forecast);
      }
    } catch (error) {
      setError((error as Error).message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <ForecastSidebar />

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        {/* Header - Centered */}
        <div className="relative z-10 pt-16 pb-8 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-full shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Car Price Forecast
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Get accurate price predictions for your favorite vehicles using advanced market analysis
            </p>
          </div>
        </div>

        {/* Main Content - Positioned below header */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 mt-16">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
            <form onSubmit={handleForecast} className="space-y-8">
              {/* Input Fields Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Manufacturer Dropdown */}
                <div className="group">
                  <label htmlFor="manufacturer" className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Car className="w-4 h-4 mr-2" />
                    Manufacturer
                  </label>
                  <select
                    id="manufacturer"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 group-hover:border-white/20"
                  >
                    <option value="" disabled>Select Manufacturer</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer} value={manufacturer}>
                        {manufacturer}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Dropdown */}
                <div className="group">
                  <label htmlFor="model" className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Search className="w-4 h-4 mr-2" />
                    Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 group-hover:border-white/20"
                  >
                    <option value="" disabled>Select Model</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div className="group">
                  <label htmlFor="year" className="flex items-center text-sm font-semibold text-gray-200 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    Year
                  </label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 group-hover:border-white/20"
                  >
                    <option value="" disabled>Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300"
                >
                  {isLoading ? "Loading..." : "Get Forecast"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Display Forecast Result */}
        {forecast && (
          <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 mt-16">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
              <h3 className="text-2xl font-semibold text-white mb-6">Price Forecast</h3>
              <ul className="space-y-4">
                {Object.entries(forecast).map(([month, price]) => (
                  <li key={month} className="text-white text-lg">
                    {month}: ${price}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Display Error Message */}
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
