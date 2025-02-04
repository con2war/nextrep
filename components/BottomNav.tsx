"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Search, User } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 backdrop-blur-lg bg-opacity-80">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              pathname === "/" 
                ? "text-blue-500" 
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link 
            href="/daily-workout" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              pathname === "/daily-workout" 
                ? "text-blue-500" 
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Dumbbell size={20} />
            <span className="text-xs mt-1">Workout</span>
          </Link>

          <Link 
            href="/discover" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              pathname === "/discover" 
                ? "text-blue-500" 
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Search size={20} />
            <span className="text-xs mt-1">Discover</span>
          </Link>

          <Link 
            href="/profile" 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              pathname === "/profile" 
                ? "text-blue-500" 
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}

