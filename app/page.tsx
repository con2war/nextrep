'use client'

import Link from "next/link"
import Image from "next/image"
import { Dumbbell, Plus, Search, User, BicepsFlexed, BarChart2, Activity, Clock, Flame } from "lucide-react"
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

          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 cursor-not-allowed opacity-60">
            <div className="flex items-center gap-4">
              <Search className="w-6 h-6 text-gray-400" />
              <div>
                <h2 className="text-lg font-medium mb-1">Discover</h2>
                <p className="text-sm text-gray-400">Coming soon</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </div>
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

        {/* Enhanced Stats Header Section */}
        {user && userStats && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome back!
                </h2>
                <p className="text-gray-600 mt-1">
                  Here's your stats, at a glance
                </p>
              </div>
              <Link 
                href="/profile" 
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                View More
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Streak Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-6 shadow-lg">
              <div className="flex flex-col items-center text-white">
                <div className="bg-white/20 rounded-full p-4 mb-4">
                  <Flame className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-medium opacity-90 mb-1">Current Streak</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold">{userStats?.currentStreak ?? 0}</span>
                  <span className="text-2xl opacity-90">days</span>
                </div>
                {(userStats?.currentStreak ?? 0) > 0 && (
                  <p className="mt-2 text-sm opacity-75">
                    Keep up the great work! 💪
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Workouts Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 rounded-full p-3">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-4xl font-bold text-blue-600">
                    {userStats.totalWorkouts}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Total Workouts</h3>
                <div className="mt-2 h-2 bg-blue-100 rounded-full">
                  <div 
                    className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((userStats.totalWorkouts / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Total Minutes Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-4xl font-bold text-green-600">
                    {Math.round(userStats.totalMinutes)}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Total Minutes</h3>
                <div className="mt-2 h-2 bg-green-100 rounded-full">
                  <div 
                    className="h-2 bg-green-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((userStats.totalMinutes / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mt-6 text-center">
              {userStats.currentStreak === 0 ? (
                <Link 
                  href="/daily-workout"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Start your streak today
                  <span aria-hidden="true">→</span>
                </Link>
              ) : userStats.currentStreak < 3 ? (
                <p className="text-gray-600">
                  You're building momentum! Keep going!
                </p>
              ) : (
                <p className="text-gray-600">
                  You're on fire! {userStats.currentStreak} days and counting!
                </p>
              )}
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

