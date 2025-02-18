"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";

interface Exercise {
  Title: string;
  Description_URL: string;
  Exercise_Image: string;
  Exercise_Image1: string;
  muscle_gp: string;
  Equipment: string;
  Rating: number;
}

export default function ExerciseLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [displayCount, setDisplayCount] = useState(8);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then((data) => setExercises(data))
      .catch((error) => console.error("Error fetching exercises:", error));
  }, []);

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.Title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMuscle =
      muscleFilter === "all" || exercise.muscle_gp === muscleFilter;
    const matchesEquipment =
      equipmentFilter === "all" || exercise.Equipment === equipmentFilter;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  // Get unique muscle groups and equipment for the filter dropdowns.
  const muscleGroups = Array.from(new Set(exercises.map((ex) => ex.muscle_gp)));
  const equipmentTypes = Array.from(new Set(exercises.map((ex) => ex.Equipment)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex justify-center flex-1">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="h-12 w-auto"
            />
          </div>
          <div className="w-6" /> {/* Placeholder for spacing */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Muscles</option>
              {muscleGroups.map((muscle) => (
                <option key={muscle} value={muscle}>
                  {muscle}
                </option>
              ))}
            </select>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Equipment</option>
              {equipmentTypes.map((equipment) => (
                <option key={equipment} value={equipment}>
                  {equipment}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.slice(0, displayCount).map((exercise, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 sm:h-40">
                {exercise.Exercise_Image && (
                  <Image
                    src={exercise.Exercise_Image}
                    alt={exercise.Title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to a default image
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/exercise-placeholder.png'; // Create this placeholder image
                    }}
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {exercise.Title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {exercise.muscle_gp}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    {exercise.Equipment}
                  </span>
                </div>
                <Link
                  href={exercise.Description_URL}
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                >
                  View Details
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {filteredExercises.length > displayCount && (
          <div className="text-center mt-8 pb-8">
            <button
              onClick={() => setDisplayCount((prev) => prev + 8)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
