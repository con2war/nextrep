"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { toast as hotToast } from 'react-hot-toast';
import { Toaster } from "react-hot-toast";

export default function SupportPage() {
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  const handleRequestFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequesting(true);

    try {
      const response = await fetch("/api/request-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName,
          email: reqEmail,
          requestDetails: reqDetails,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      hotToast.success('Thank you! We will respond to your request soon.');
      setReqName("");
      setReqEmail("");
      setReqDetails("");
    } catch (error) {
      hotToast.error('Something went wrong. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Toaster />
      <section className="relative flex items-center justify-center py-20 md:py-32 bg-gradient-to-r from-blue-600 to-blue-400">
        <div className="relative z-10 container px-4 md:px-6 text-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="NextRep AI Logo"
                width={200}
                height={60}
                className="object-contain mb-6"
              />
            </Link>
          </div>
          <motion.h1
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold tracking-tighter text-white sm:text-6xl"
          >
            Support Center
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 max-w-2xl mx-auto text-lg text-gray-200"
          >
            We're here to help! Send us your feedback or request detailed support.
          </motion.p>
        </div>
      </section>

      <main className="flex-1">
        <div className="container px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-2xl mx-auto">
            <motion.section
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center p-6 border rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
                  <Dumbbell className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter text-foreground">Request Support</h2>
                <p className="mt-2 text-muted-foreground text-center">Need help? We're here for you</p>
                <form onSubmit={handleRequestFeedback} className="w-full space-y-4 mt-6">
                  <div className="space-y-2">
                    <label htmlFor="req-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Name
                    </label>
                    <Input
                      id="req-name"
                      type="text"
                      placeholder="Your name"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Email
                    </label>
                    <Input
                      id="req-email"
                      type="email"
                      placeholder="Your email"
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-details" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Request Details
                    </label>
                    <textarea
                      id="req-details"
                      placeholder="Describe what you need help with"
                      value={reqDetails}
                      onChange={(e) => setReqDetails(e.target.value)}
                      required
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={4}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full"
                  >
                    {isRequesting ? "Sending Request..." : "Request Support"}
                  </Button>
                </form>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t bg-muted">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} NextRep AI. All rights reserved.</p>
          </div>
          <nav className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">Terms</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">Privacy</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:underline">Home</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
