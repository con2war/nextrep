"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dumbbell } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Thanks for joining!",
        description: "We'll notify you when NextRep AI is ready.",
      })
      setEmail("")
      setIsLoading(false)
    }, 1000)
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Toaster />
      <main className="flex-1">
        {/* Hero Section with blue gradient background */}
        <section
          className="relative flex items-center justify-center py-20 md:py-32 bg-gradient-to-r from-blue-600 to-blue-400"
        >
          {/* Combined header and title for better styling */}
          <div className="relative z-10 container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center justify-center mb-8">
              <Image
                src="/logo.png"
                alt="NextRep AI Logo"
                width={200}
                height={60}
                className="object-contain mb-6"
              />
            </div>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-6xl">
                Your AI Workout Partner
              </h1>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-200">
                NextRep AI generates personalized workout plans tailored to your goals, equipment, and fitness level.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <form onSubmit={handleSubmit} className="mt-8 flex justify-center max-w-md mx-auto space-x-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 py-3 px-4 rounded-md border border-gray-300"
                />
                <Button type="submit" disabled={isLoading} className="py-3 px-6 rounded-md bg-blue-700 text-white">
                  {isLoading ? "Submitting..." : "Get Early Access"}
                </Button>
              </form>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <p className="mt-2 text-sm text-gray-200">
                Join our waitlist to be the first to experience NextRep AI.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="mt-8 flex justify-center space-x-4">
                <Image src="/app-store-badge.svg" alt="Download on the App Store" width={140} height={42} />
              </div>
            </motion.div>
          </div>
        </section>
        {/* Features Section */}
        <section className="py-16 md:py-24 bg-gray-100">
          <div className="container px-4 md:px-6">
            <div className="text-center">
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl font-bold tracking-tighter text-gray-800">Features</h2>
                <p className="mt-4 max-w-3xl mx-auto text-gray-600">
                  NextRep AI is designed to make your fitness journey easier and more effective.
                </p>
              </motion.div>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "AI Workout Generation",
                  description: "Get personalized workout plans based on your goals and available equipment.",
                  icon: <Dumbbell className="h-10 w-10 text-blue-600" />
                },
                {
                  title: "Custom Workout Builder",
                  description: "Create and save your own workouts with our intuitive workout builder.",
                  icon: <Dumbbell className="h-10 w-10 text-blue-600" />
                },
                {
                  title: "Progress Tracking",
                  description: "Track your progress and see your improvements over time.",
                  icon: <Dumbbell className="h-10 w-10 text-blue-600" />
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                  transition={{ duration: 0.8, delay: 0.2 * index }}
                >
                  <div className="flex flex-col items-center p-6 border rounded-lg hover:shadow-lg transition-shadow duration-300 bg-white">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600/10">
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-800">{feature.title}</h3>
                    <p className="mt-2 text-center text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="py-6 border-t bg-gray-200">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-gray-700">© {new Date().getFullYear()} NextRep AI. All rights reserved.</p>
          </div>
          <nav className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="text-sm text-gray-700 hover:underline">Terms</a>
            <a href="#" className="text-sm text-gray-700 hover:underline">Privacy</a>
            <a href="#" className="text-sm text-gray-700 hover:underline">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
