/**
 * Campus Recover — 5-Dimensional Match Score Breakdown Component (Phase 7)
 *
 * Displays the multi-modal recovery score breakdown across all 5 dimensions:
 * - Text Similarity: 30%
 * - Image Similarity: 30% (CLIP-compatible neural model)
 * - Location Proximity: 20%
 * - Time Proximity: 10%
 * - Physical Attributes: 10%
 *
 * Shows dynamic normalization indicators when images are unavailable,
 * individual dimension progress bars, and model explainability metrics.
 */

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  MapPin,
  Clock,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ScoreBreakdown, getConfidenceLevel, getConfidenceColor } from "@/types";

interface MatchScoreBreakdownProps {
  overallScore: number;
  breakdown?: ScoreBreakdown;
  textScore?: number;
  imageScore?: number | null;
  locationScore?: number;
  timeScore?: number;
  attributeScore?: number;
  className?: string;
  showDetailsToggle?: boolean;
}

export const MatchScoreBreakdown: React.FC<MatchScoreBreakdownProps> = ({
  overallScore,
  breakdown,
  textScore,
  imageScore,
  locationScore,
  timeScore,
  attributeScore,
  className = "",
  showDetailsToggle = true,
}) => {
  const [showRawDetails, setShowRawDetails] = useState(false);

  // Extract signals from breakdown object if present, or fallback to direct props
  const signals = breakdown?.signals;

  const tScore = signals?.text?.score ?? textScore ?? 0;
  const iScore = signals?.image?.score ?? imageScore ?? null;
  const lScore = signals?.location?.score ?? locationScore ?? 0;
  const tmScore = signals?.time?.score ?? timeScore ?? 0;
  const aScore = signals?.attributes?.score ?? attributeScore ?? 0;

  const isImageAvailable = iScore !== null && signals?.image?.status !== "UNAVAILABLE";
  const imageReason = signals?.image?.reason || "No photo attached on one or both item reports";
  const isNormalizedWithoutImage = breakdown?.normalized_without_image ?? !isImageAvailable;

  const confidence = breakdown?.confidence_level || getConfidenceLevel(overallScore);
  const confStyle = getConfidenceColor(overallScore);
  const overallPercent = Math.round(overallScore * 100);

  const dimensionCards = [
    {
      id: "text",
      title: "Semantic Text Similarity",
      baseWeight: 30,
      effectiveWeight: signals?.text?.effective_weight
        ? Math.round(signals.text.effective_weight * 100)
        : isNormalizedWithoutImage
        ? 43
        : 30,
      score: tScore,
      icon: FileText,
      color: "from-blue-500 to-indigo-600",
      barColor: "bg-blue-500",
      textColor: "text-blue-400",
      available: true,
      description: "SentenceTransformer all-MiniLM-L6-v2 contextual understanding",
      details: signals?.text?.details,
    },
    {
      id: "image",
      title: "Visual Image Similarity",
      baseWeight: 30,
      effectiveWeight: isImageAvailable
        ? signals?.image?.effective_weight
          ? Math.round(signals.image.effective_weight * 100)
          : 30
        : 0,
      score: iScore,
      icon: ImageIcon,
      color: "from-purple-500 to-pink-600",
      barColor: isImageAvailable ? "bg-purple-500" : "bg-surface-600",
      textColor: isImageAvailable ? "text-purple-400" : "text-surface-400",
      available: isImageAvailable,
      description: isImageAvailable
        ? `CLIP ViT-B/32 Neural Embedding (${signals?.image?.details?.engine?.toUpperCase() || "CLIP"})`
        : imageReason,
      details: signals?.image?.details,
    },
    {
      id: "location",
      title: "Campus Location Proximity",
      baseWeight: 20,
      effectiveWeight: signals?.location?.effective_weight
        ? Math.round(signals.location.effective_weight * 100)
        : isNormalizedWithoutImage
        ? 29
        : 20,
      score: lScore,
      icon: MapPin,
      color: "from-emerald-500 to-teal-600",
      barColor: "bg-emerald-500",
      textColor: "text-emerald-400",
      available: true,
      description: "Geospatial Haversine & campus landmark proximity",
      details: signals?.location?.details,
    },
    {
      id: "time",
      title: "Timeline Proximity",
      baseWeight: 10,
      effectiveWeight: signals?.time?.effective_weight
        ? Math.round(signals.time.effective_weight * 100)
        : isNormalizedWithoutImage
        ? 14
        : 10,
      score: tmScore,
      icon: Clock,
      color: "from-amber-500 to-orange-600",
      barColor: "bg-amber-500",
      textColor: "text-amber-400",
      available: true,
      description: "Temporal Gaussian decay based on report timestamps",
      details: signals?.time?.details,
    },
    {
      id: "attributes",
      title: "Physical Attributes",
      baseWeight: 10,
      effectiveWeight: signals?.attributes?.effective_weight
        ? Math.round(signals.attributes.effective_weight * 100)
        : isNormalizedWithoutImage
        ? 14
        : 10,
      score: aScore,
      icon: Layers,
      color: "from-cyan-500 to-blue-600",
      barColor: "bg-cyan-500",
      textColor: "text-cyan-400",
      available: true,
      description: "Category match, color, brand, and unique identifiers",
      details: signals?.attributes?.details,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner: Overall Score & Confidence */}
      <div className="bg-surface-850 border border-surface-700/60 rounded-xl p-5 shadow-lg relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-900 border border-surface-700 shadow-inner">
              <span className="text-2xl font-black font-display text-white">
                {overallPercent}
                <span className="text-xs font-mono text-primary-400">%</span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                <h4 className="text-base font-bold text-white tracking-wide">
                  Overall Recovery Score
                </h4>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${confStyle.bg} ${confStyle.text} ${confStyle.border}`}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {confidence}
                </span>
                {isNormalizedWithoutImage && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-800 text-surface-400 border border-surface-700">
                    Proportionally Normalized (No Photo)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-surface-400 sm:text-right space-y-0.5 border-t sm:border-t-0 border-surface-800 pt-3 sm:pt-0">
            <div className="font-mono text-white font-semibold">
              Weights: Text 30% • Image 30% • Loc 20% • Time 10% • Attr 10%
            </div>
            <div className="text-surface-400 text-[11px]">
              Multi-modal AI matching with CLIP vision validation
            </div>
          </div>
        </div>
      </div>

      {/* 5-Dimensional Signal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {dimensionCards.map((dim) => {
          const Icon = dim.icon;
          const scorePercent = dim.available && dim.score !== null ? Math.round(dim.score * 100) : 0;

          return (
            <div
              key={dim.id}
              className={`p-4 rounded-xl border transition-all ${
                dim.available
                  ? "bg-surface-850/80 border-surface-700/60 hover:border-surface-600"
                  : "bg-surface-900/60 border-surface-800/80 opacity-80"
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      dim.available ? "bg-surface-800 text-white" : "bg-surface-800/60 text-surface-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white tracking-wide">
                      {dim.title}
                    </div>
                    <div className="text-[11px] text-surface-400 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-surface-300">
                        Weight: {dim.effectiveWeight}%
                      </span>
                      {dim.effectiveWeight !== dim.baseWeight && (
                        <span className="text-[10px] text-primary-400">
                          (base {dim.baseWeight}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {dim.available ? (
                    <span className="text-base font-black font-display text-white">
                      {scorePercent}
                      <span className="text-xs font-normal text-surface-400 font-mono">%</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <AlertCircle className="w-2.5 h-2.5 mr-1" />
                      Unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-900 rounded-full h-2 overflow-hidden mb-2 border border-surface-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dim.available ? dim.barColor : "bg-surface-700"
                  }`}
                  style={{ width: `${dim.available ? scorePercent : 0}%` }}
                />
              </div>

              {/* Description & metadata */}
              <p className="text-[11px] text-surface-400 leading-relaxed truncate">
                {dim.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Optional Raw Explainability Drawer */}
      {showDetailsToggle && (
        <div className="border border-surface-800 rounded-xl overflow-hidden bg-surface-900/40">
          <button
            type="button"
            onClick={() => setShowRawDetails(!showRawDetails)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-medium text-surface-300 hover:text-white transition"
          >
            <span className="flex items-center space-x-2">
              <Info className="w-3.5 h-3.5 text-primary-400" />
              <span>Inspection: Technical Signal & Weights Breakdown</span>
            </span>
            {showRawDetails ? (
              <ChevronUp className="w-4 h-4 text-surface-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-surface-400" />
            )}
          </button>

          {showRawDetails && (
            <div className="p-4 border-t border-surface-800 bg-surface-950 font-mono text-xs text-surface-300 overflow-x-auto max-h-72">
              <pre className="text-[11px] text-emerald-400/90 whitespace-pre-wrap">
                {JSON.stringify(
                  breakdown || {
                    overall_score: overallScore,
                    confidence_level: confidence,
                    weights: {
                      text: "30%",
                      image: "30%",
                      location: "20%",
                      time: "10%",
                      attributes: "10%",
                    },
                    signals: {
                      text: { score: tScore },
                      image: { score: iScore, status: isImageAvailable ? "AVAILABLE" : "UNAVAILABLE" },
                      location: { score: lScore },
                      time: { score: tmScore },
                      attributes: { score: aScore },
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
