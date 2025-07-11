"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, TrendingUp, Image, BarChart2 } from "lucide-react";

export default function ForecastSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col shadow-lg">
      {/* Logo and Header */}
      <div className="flex items-center justify-center py-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <TrendingUp className="w-8 h-8 text-white" />
        <h2 className="text-2xl font-semibold ml-2">Auto Centrale</h2>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col p-4 space-y-4">
        {/* Forecast Page */}
        <Link
          href="/forecast"
          className={`flex items-center space-x-2 text-lg p-2 rounded-md transition-all ${
            pathname === "/forecast"
              ? "bg-purple-600"
              : "hover:bg-purple-600"
          }`}
        >
          <Car className="w-5 h-5" />
          <span>Forecast</span>
        </Link>

        {/* Chart Page */}
        <Link
          href="/app/chart/page.tsx"
          className={`flex items-center space-x-2 text-lg p-2 rounded-md transition-all ${
            pathname === "/chart"
              ? "bg-purple-600"
              : "hover:bg-purple-600"
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span>Charts</span>
        </Link>

        {/* Car Image Page */}
        <Link
          href="/car-image"
          className={`flex items-center space-x-2 text-lg p-2 rounded-md transition-all ${
            pathname === "/car-image"
              ? "bg-purple-600"
              : "hover:bg-purple-600"
          }`}
        >
          <Image className="w-5 h-5" />
          <span>Car Image</span>
        </Link>
      </div>
    </div>
  );
}

