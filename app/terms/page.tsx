"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
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
                <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions for NextRep AI</h1>
                <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">1. Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By downloading, installing, or using NextRep AI ("the App"), you agree to be bound by these Terms and Conditions. 
                  If you disagree with any part of these terms, you do not have permission to access the App.
                </p>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">2. Account Registration</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">2.1. To use the App, you must create an account with accurate, complete, and current information.</p>
                  <p className="leading-relaxed">2.2. You are responsible for maintaining the confidentiality of your account credentials.</p>
                  <p className="leading-relaxed">2.3. You must be at least 18 years old to create an account.</p>
                  <p className="leading-relaxed">2.4. You agree to notify us immediately of any unauthorized use of your account.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">3. Health and Safety Disclaimer</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">3.1. The App provides workout and fitness guidance but is not a substitute for professional medical advice.</p>
                  <p className="leading-relaxed">3.2. Consult your physician before starting any exercise program.</p>
                  <p className="leading-relaxed">3.3. You acknowledge that exercising carries inherent risks.</p>
                  <p className="leading-relaxed">3.4. We are not liable for any injuries or health issues resulting from using the App.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">4. User Data and Privacy</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">4.1. We collect and process your data as described in our Privacy Policy.</p>
                  <p className="leading-relaxed">4.2. You retain ownership of your personal workout data.</p>
                  <p className="leading-relaxed">4.3. We use your data to provide and improve our services.</p>
                  <p className="leading-relaxed">4.4. Your data is stored securely using Firebase services.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">5. User Conduct</h2>
                <p className="leading-relaxed">You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the App for any illegal purpose</li>
                  <li>Share account credentials with others</li>
                  <li>Attempt to gain unauthorized access to the App</li>
                  <li>Upload harmful content or malware</li>
                  <li>Interfere with the App's functionality</li>
                </ul>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">6. Subscription and Payments</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">6.1. Some features may require a paid subscription.</p>
                  <p className="leading-relaxed">6.2. All payments are processed securely through authorized payment processors.</p>
                  <p className="leading-relaxed">6.3. Subscription fees are non-refundable unless required by law.</p>
                  <p className="leading-relaxed">6.4. We reserve the right to modify pricing with notice.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">7. Intellectual Property</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">7.1. The App, including its content and features, is owned by NextRep AI.</p>
                  <p className="leading-relaxed">7.2. You may not copy, modify, or distribute the App's content without permission.</p>
                  <p className="leading-relaxed">7.3. You retain ownership of your user-generated content.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">8. Limitation of Liability</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">8.1. The App is provided "as is" without warranties of any kind.</p>
                  <p className="leading-relaxed">8.2. We are not liable for any indirect, incidental, or consequential damages.</p>
                  <p className="leading-relaxed">8.3. Our total liability shall not exceed the amount paid for the App's services.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">9. Termination</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">9.1. We may terminate or suspend your account for violations of these terms.</p>
                  <p className="leading-relaxed">9.2. You may terminate your account at any time.</p>
                  <p className="leading-relaxed">9.3. Upon termination, your data will be handled as described in our Privacy Policy.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">10. Modifications to the Service</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">10.1. We reserve the right to modify or discontinue the App at any time.</p>
                  <p className="leading-relaxed">10.2. We may update these terms with notice through the App.</p>
                  <p className="leading-relaxed">10.3. Continued use after changes constitutes acceptance of new terms.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">11. Workout Content</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">11.1. Workout plans and exercises are generated based on user input.</p>
                  <p className="leading-relaxed">11.2. Results may vary based on individual effort and circumstances.</p>
                  <p className="leading-relaxed">11.3. We do not guarantee specific fitness outcomes.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">12. Technical Requirements</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">12.1. You are responsible for maintaining compatible devices.</p>
                  <p className="leading-relaxed">12.2. The App requires an internet connection for full functionality.</p>
                  <p className="leading-relaxed">12.3. We are not responsible for network or device-related issues.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">13. Support and Communication</h2>
                <div className="space-y-4">
                  <p className="leading-relaxed">13.1. We provide support through designated channels in the App.</p>
                  <p className="leading-relaxed">13.2. We may send important notifications regarding your account or the service.</p>
                  <p className="leading-relaxed">13.3. You can opt out of non-essential communications.</p>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">14. Governing Law</h2>
                <p className="leading-relaxed">These terms are governed by the laws of Ireland.</p>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">15. Contact Information</h2>
                <p className="leading-relaxed">For questions about these Terms, contact us at support@nextrepai.com</p>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">16. Severability</h2>
                <p className="leading-relaxed">If any provision of these terms is found to be unenforceable, the remaining provisions will remain in effect.</p>
              </section>

              <section className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">17. Entire Agreement</h2>
                <p className="leading-relaxed">These Terms constitute the entire agreement between you and NextRep AI regarding the App's use.</p>
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