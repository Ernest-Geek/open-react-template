// pages/car-image.tsx

import { useState } from "react";

export default function CarImage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCarImage = async () => {
    setError(null);
    setImageUrl(null);

    if (!make || !model || !year) {
      setError("Please provide 'Make', 'Model', and 'Year'.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/car-image?make=${make}&model=${model}&year=${year}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to fetch image");
      } else {
        const imageBlob = await response.blob();
        const imageObjectURL = URL.createObjectURL(imageBlob);
        setImageUrl(imageObjectURL);
      }
    } catch (error) {
      setError("Error fetching the image. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Get Car Image</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter Car Make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="p-3 bg-gray-700 text-white rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Enter Car Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="p-3 bg-gray-700 text-white rounded-lg w-full"
          />
          <input
            type="text"
            placeholder="Enter Car Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="p-3 bg-gray-700 text-white rounded-lg w-full"
          />
          <button
            onClick={fetchCarImage}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl"
          >
            Get Car Image
          </button>
        </div>

        {/* Display Image */}
        {imageUrl && <img src={imageUrl} alt="Car Image" className="mt-6" />}
        
        {/* Error Handling */}
        {error && <p className="text-red-600 mt-6">{error}</p>}
      </div>
    </div>
  );
}
