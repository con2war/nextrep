"use client";
 
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
 
export default function PrivacyPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };
 
  return (
    <div className="flex min-h-screen flex-col bg-background">
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
            Privacy Policy
          </motion.h1>
        </div>
      </section>
 
      <main className="flex-1">
        <div className="container px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-3xl mx-auto prose prose-lg prose-blue">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Privacy Policy for NextRep AI</h1>
                <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">1. Introduction</h2>
                <p className="leading-relaxed">
                  At NextRep AI, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                  disclose, and safeguard your information when you use our mobile application and related services.
                </p>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">2. Information We Collect</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">2.1 Personal Information</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Name and contact information</li>
                      <li>Email address</li>
                      <li>Account credentials</li>
                      <li>Profile information</li>
                      <li>Payment information</li>
                    </ul>
                  </div>
 
                  <div className="space-y-4">
                    <h3 className="text-xl font-medium">2.2 Usage Data</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Workout history and preferences</li>
                      <li>Device information</li>
                      <li>App usage statistics</li>
                      <li>Performance metrics</li>
                    </ul>
                  </div>
                </div>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">3. How We Use Your Information</h2>
                <p className="leading-relaxed">We use the collected information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process your transactions</li>
                  <li>Send you important updates</li>
                  <li>Improve our app and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">4. Data Storage and Security</h2>
                <p className="leading-relaxed">
                  We use Firebase services to store and secure your data. We implement appropriate technical 
                  and organizational measures to protect your personal information against unauthorized access, 
                  alteration, disclosure, or destruction.
                </p>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">5. Data Sharing and Disclosure</h2>
                <p className="leading-relaxed">We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service providers and partners</li>
                  <li>Legal authorities when required</li>
                  <li>Other users (only with your consent)</li>
                </ul>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">6. Your Rights and Choices</h2>
                <p className="leading-relaxed">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data</li>
                </ul>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">7. Children's Privacy</h2>
                <p className="leading-relaxed">
                  Our services are not intended for children under 13. We do not knowingly collect personal 
                  information from children under 13. If you become aware that a child has provided us with 
                  personal information, please contact us.
                </p>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">8. Changes to This Policy</h2>
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by 
                  posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>
 
              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">9. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  Email: privacy@nextrepai.com
                </p>
              </section>
            </motion.div>
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
            <Link href="/support" className="text-sm text-muted-foreground hover:underline">Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
} 