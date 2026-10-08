/**
 * Campus Recover — Public Landing Page
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  ShieldCheck,
  MapPin,
  Clock,
  ChevronDown,
  HelpCircle,
  PackagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the AI matching system work?",
      a: "When you report an item, our multi-modal matching engine computes a composite Recovery Score using semantic embeddings (text similarity), geospatial Haversine distance (location similarity), temporal decay curves (time similarity), and attribute overlap. When a score exceeds our confidence threshold, both parties are notified.",
    },
    {
      q: "Is my private information visible to other students?",
      a: "No. Your contact information, exact valuables details, and private verification questions are never visible publicly. Claims are handled through secure verification challenges so only the legitimate owner can prove ownership.",
    },
    {
      q: "Who can register on Campus Recover?",
      a: "Campus Recover is restricted to authorized university members. Only users with an approved institutional email address (@student.university.edu or @university.edu) can create accounts and interact with campus listings.",
    },
    {
      q: "What should I do if I find a valuable item like a laptop or wallet?",
      a: "Use 'Report Found Item'. You only need to describe general details without revealing private identifying marks or contents. You can set a private verification question (e.g. 'What is the lockscreen wallpaper?') that only the owner can answer before handover.",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Ambient Lighting Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary-600/15 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-900 border border-surface-800 text-xs font-semibold text-primary-400 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span>AI-Powered Campus Lost & Found Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Lost something on campus? <br />
            <span className="gradient-text">Let AI help you find it.</span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Campus Recover connects lost and found reports and intelligently identifies
            potential matches using AI, location, time, and visual similarity.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <Link to="/report-lost" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<HelpCircle className="w-5 h-5" />}
                className="w-full shadow-glow"
              >
                Report Lost Item
              </Button>
            </Link>
            <Link to="/report-found" className="w-full sm:w-auto">
              <Button
                variant="accent"
                size="lg"
                leftIcon={<PackagePlus className="w-5 h-5" />}
                className="w-full shadow-glow-accent"
              >
                Report Found Item
              </Button>
            </Link>
          </div>

          {/* Real-Time Match Simulation Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-surface-900/60 backdrop-blur-2xl border border-surface-800 rounded-3xl p-6 sm:p-8 shadow-glass text-left max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-surface-400">
                    High Confidence AI Discovery
                  </div>
                  <div className="text-lg font-bold text-white">Potential Match Identified</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-display font-extrabold text-accent-400">94%</span>
                <span className="text-xs text-surface-400 font-mono">RECOVERY<br />SCORE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-surface-950/70 border border-surface-850">
                <div className="text-xs font-mono text-primary-400 uppercase tracking-wider mb-1">
                  Lost Report #LR-4091
                </div>
                <div className="text-sm font-semibold text-white mb-1">Black AirPods Pro Case</div>
                <div className="text-xs text-surface-400">
                  "Lost near 2nd floor library study tables yesterday afternoon."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-950/70 border border-surface-850">
                <div className="text-xs font-mono text-accent-400 uppercase tracking-wider mb-1">
                  Found Report #FR-8812
                </div>
                <div className="text-sm font-semibold text-white mb-1">Black wireless earbud case</div>
                <div className="text-xs text-surface-400">
                  "Found on a quiet study chair in the campus library."
                </div>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <ScoreProgress label="Text Match" score="92%" />
              <ScoreProgress label="Location Match" score="98%" />
              <ScoreProgress label="Time Match" score="95%" />
              <ScoreProgress label="Vision Match" score="91%" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-surface-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3">
            Simple 4-Step Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            How Campus Recover Works
          </h2>
          <p className="text-surface-400 text-sm mt-3">
            Designed for frictionless reporting, rapid automated matching, and verified returns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StepCard
            step="01"
            title="Submit Report"
            description="Detail item attributes, upload reference photos, and pin campus building landmarks in under 2 minutes."
            icon={<HelpCircle className="w-6 h-6 text-primary-400" />}
          />
          <StepCard
            step="02"
            title="AI Vector Analysis"
            description="Our service calculates semantic text similarity, geographic proximity, and temporal decay correlations."
            icon={<Sparkles className="w-6 h-6 text-accent-400" />}
          />
          <StepCard
            step="03"
            title="Instant Alerts"
            description="Both the loser and finder receive automated match notifications when Recovery Score exceeds thresholds."
            icon={<Clock className="w-6 h-6 text-warning-400" />}
          />
          <StepCard
            step="04"
            title="Secure Claim"
            description="Answer private verification challenges to prove legitimate ownership before contact coordinates are unlocked."
            icon={<ShieldCheck className="w-6 h-6 text-accent-400" />}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-surface-900">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="accent" className="mb-3">
            Core Technologies
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Engineered for Campus Accuracy
          </h2>
          <p className="text-surface-400 text-sm mt-3">
            Going far beyond simple text keywords to eliminate missed items.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverGlow>
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mb-4">
                <Search className="w-6 h-6" />
              </div>
              <CardTitle>Semantic Text Matching</CardTitle>
              <CardDescription>
                Uses Sentence-Transformers to understand synonymy: "earphones" matches "AirPods", "flask" matches "bottle".
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverGlow>
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <CardTitle>Geospatial Radius Scoring</CardTitle>
              <CardDescription>
                Calculates precise Haversine distance between loss and found coordinates with tiered campus proximity scoring.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card hoverGlow>
            <CardHeader>
              <div className="w-12 h-12 rounded-2xl bg-warning-500/10 border border-warning-500/20 flex items-center justify-center text-warning-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle>Zero-Fraud Verification</CardTitle>
              <CardDescription>
                Finders attach private challenge questions. Claimants submit answers hashed with bcrypt to prevent fraudulent claims.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* University Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-surface-900">
        <div className="bg-surface-900/40 backdrop-blur-xl border border-surface-800 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-2">91%</div>
              <div className="text-xs uppercase font-mono tracking-wider text-surface-400">Match Accuracy</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-display font-extrabold text-accent-400 mb-2">&lt; 4 hrs</div>
              <div className="text-xs uppercase font-mono tracking-wider text-surface-400">Avg. Recovery Time</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-display font-extrabold text-primary-400 mb-2">100%</div>
              <div className="text-xs uppercase font-mono tracking-wider text-surface-400">Institutional Email Verified</div>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-display font-extrabold text-white mb-2">0%</div>
              <div className="text-xs uppercase font-mono tracking-wider text-surface-400">Private Data Leakage</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-surface-900">
        <div className="text-center mb-12">
          <Badge variant="surface" className="mb-3">
            Questions & Answers
          </Badge>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-surface-900/60 border border-surface-800 rounded-2xl overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-white font-medium text-sm sm:text-base focus-ring"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-surface-400 transition-transform ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-surface-400 leading-relaxed border-t border-surface-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-surface-900 text-center">
        <div className="bg-gradient-to-br from-primary-950 via-surface-900 to-surface-950 border border-primary-500/30 rounded-3xl p-8 sm:p-16 shadow-glass relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight mb-4">
            Start Recovering Campus Belongings Today
          </h2>
          <p className="text-surface-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Log in with your institutional credentials and get notified the moment a match is detected.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-glow">
                Create Campus Account
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Public Registry
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

function ScoreProgress({ label, score }: { label: string; score: string }) {
  return (
    <div className="bg-surface-950/40 p-3 rounded-xl border border-surface-850">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-surface-400">{label}</span>
        <span className="font-mono font-semibold text-accent-400">{score}</span>
      </div>
      <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-500 rounded-full"
          style={{ width: score }}
        />
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface-900/40 border border-surface-800 rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-mono text-xs text-surface-500 font-bold">{step}</span>
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-surface-400 leading-relaxed">{description}</p>
    </div>
  );
}
