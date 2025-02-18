"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowLeft, Youtube } from "lucide-react";

interface Exercise {
  Title: string;
  "Short YouTube Demonstration": string;
  "Difficulty Level": string;
  "Target Muscle Group": string;
  "Prime Mover Muscle": string;
}

export default function ExerciseLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [displayCount, setDisplayCount] = useState(8);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched exercises:', data.slice(0, 2)); // Log first two exercises
        setExercises(data);
      })
      .catch(error => console.error('Error fetching exercises:', error));
  }, []);

  const filteredExercises = exercises.filter(exercise => {
    console.log('Filtering exercise:', exercise); // Debug log
    const matchesSearch = exercise.Title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = muscleFilter === "all" || exercise["Target Muscle Group"] === muscleFilter;
    const matchesDifficulty = difficultyFilter === "all" || exercise["Difficulty Level"] === difficultyFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty;
  });


  const muscleGroups = Array.from(new Set(exercises.map(ex => ex["Target Muscle Group"])));
  const difficultyLevels = Array.from(new Set(exercises.map(ex => ex["Difficulty Level"])));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="flex-1 flex justify-center">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={120}
                height={40}
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="flex-1 border rounded-lg px-4 py-3 bg-white"
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
            >
              <option value="all">All Muscle Groups</option>
              {muscleGroups.map(muscle => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>

            <select
              className="flex-1 border rounded-lg px-4 py-3 bg-white"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="all">All Difficulty Levels</option>
              {difficultyLevels.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.slice(0, displayCount).map((exercise, index) => {
            console.log('Rendering exercise:', exercise); // Debug log
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
              >
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {exercise.Title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {exercise["Target Muscle Group"]}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                      {exercise["Prime Mover Muscle"]}
                    </span>
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      {exercise["Difficulty Level"]}
                    </span>
                  </div>
                  
                  {exercise["Short YouTube Demonstration"] && (
                    <div className="mt-auto">
                      <Link
                        href={exercise["Short YouTube Demonstration"]}
                        target="_blank"
                        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                      >
                        <Youtube className="w-4 h-4 mr-2" />
                        Watch Demo
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {filteredExercises.length > displayCount && (
          <div className="text-center mt-8 pb-8">
            <button
              onClick={() => setDisplayCount((prev) => prev + 8)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
} 