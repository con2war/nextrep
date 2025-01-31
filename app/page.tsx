'use client'

import Link from "next/link"
import Image from "next/image"
import { Dumbbell, Plus, Search, User, BicepsFlexed, BarChart2 } from "lucide-react"
import { useUser } from '@auth0/nextjs-auth0/client'
import { useState, useEffect } from 'react'

interface UserStats {
  totalWorkouts: number
  currentStreak: number
  totalMinutes: number
  averageRating: string
}

export default function Home() {
  const { user, isLoading } = useUser()
  const [userStats, setUserStats] = useState<UserStats | null>(null)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/user/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setUserStats(data)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      }
    }

    if (user) {
      fetchUserStats()
    }
  }, [user])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-16">
          <Image
            src="/images/logo.png"
            alt="NextRep AI Logo"
            width={300}
            height={300}
            priority
            className="h-32 w-auto max-w-full"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mb-12">
          <Link
            href="/daily-workout"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <Dumbbell className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-medium mb-1">Daily Workout</h2>
                <p className="text-sm text-gray-400">Get your personalized workout</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
          </Link>

          <Link
            href="/custom-workout"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <Plus className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-medium mb-1">Create Workout</h2>
                <p className="text-sm text-gray-400">Design your own routine</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
          </Link>

          <Link
            href="/discover"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-medium mb-1">Discover</h2>
                <p className="text-sm text-gray-400">Browse community workouts</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
          </Link>
        </div>

        {/* Stats Section */}
        {isLoading ? (
          <div className="max-w-2xl mx-auto px-4">
            <div className="rounded-lg border border-blue-100 bg-white p-6 animate-pulse">
              <div className="h-6 bg-blue-50 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-8 bg-blue-50 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-blue-50 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="max-w-2xl mx-auto px-4">
            <div className="rounded-lg border border-blue-100 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-gray-900">Your Stats</h2>
                <Link href="/profile" className="text-blue-500 hover:text-blue-600 text-sm">
                  View Details →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-bold text-blue-500 mb-1">
                    {userStats?.totalWorkouts || 0}
                  </p>
                  <p className="text-sm text-gray-600">Workouts Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-500 mb-1">
                    {userStats?.currentStreak || 0}
                  </p>
                  <p className="text-sm text-gray-600">Day Streak</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-500 mb-1">
                    {userStats?.totalMinutes || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Minutes</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-500 mb-1">
                    {userStats?.averageRating || '0.0'}
                  </p>
                  <p className="text-sm text-gray-600">Avg. Rating</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4">
            <div className="rounded-lg border border-blue-100 bg-white p-6 text-center">
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Track Your Progress
              </h2>
              <p className="text-gray-600 mb-6">
                Sign in to track your workouts, maintain your streak, and see your fitness journey stats.
              </p>
              <a
                href="/api/auth/login"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign In to Get Started
              </a>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Need help? <a href="#" className="text-blue-500 hover:text-blue-400">Contact support</a></p>
        </div>
      </main>
    </div>
  )
}

