/**
 * Campus Recover — Multi-Step Item Report Form
 *
 * Handles reporting both LOST and FOUND items through an intuitive
 * 5-step guided wizard with validation, image upload, campus location
 * selection, and review before submission.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sliders,
  MapPin,
  Camera,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Lock,
  Building2,
  HelpCircle,
  PackageCheck,
  AlertCircle,
  Tag,
  Compass,
} from "lucide-react";

import { itemsApi } from "@/api/items";
import {
  ItemType,
  ItemCategory,
  CreateItemRequest,
  CampusLocation,
} from "@/types";
import { ImageUploader } from "./ImageUploader";
import { LocationPicker } from "@/components/map/LocationPicker";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface MultiStepReportFormProps {
  initialType: ItemType;
}

const CATEGORY_OPTIONS = [
  { value: ItemCategory.ELECTRONICS, label: "Electronics & Tech (Laptops, Phones, Chargers)" },
  { value: ItemCategory.CLOTHING, label: "Clothing & Apparel (Jackets, Hats, Scarves)" },
  { value: ItemCategory.ACCESSORIES, label: "Accessories & Jewelry (Watches, Glasses, Rings)" },
  { value: ItemCategory.DOCUMENTS, label: "Documents & Cards (IDs, Passports, Wallets)" },
  { value: ItemCategory.KEYS, label: "Keys & Access Cards (Dorm, Car, Keychains)" },
  { value: ItemCategory.BAGS, label: "Bags & Luggage (Backpacks, Totes, Purses)" },
  { value: ItemCategory.BOOKS, label: "Books & Notebooks (Textbooks, Planners)" },
  { value: ItemCategory.SPORTS, label: "Sports & Fitness Equipment (Gym bags, Bottles)" },
  { value: ItemCategory.OTHER, label: "Other Miscellaneous Items" },
];

const STEPS = [
  { id: 1, title: "Basic Info", icon: FileText, desc: "Category & title" },
  { id: 2, title: "Attributes", icon: Sliders, desc: "Color, brand & marks" },
  { id: 3, title: "Location & Time", icon: MapPin, desc: "Where & when" },
  { id: 4, title: "Photo & Security", icon: Camera, desc: "Image & verification" },
  { id: 5, title: "Review", icon: CheckCircle, desc: "Verify & submit" },
];

export const MultiStepReportForm: React.FC<MultiStepReportFormProps> = ({
  initialType,
}) => {
  const navigate = useNavigate();
  const isFound = initialType === ItemType.FOUND;

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Form State
  const [formData, setFormData] = useState<CreateItemRequest>({
    type: initialType,
    title: "",
    description: "",
    category: ItemCategory.ELECTRONICS,
    subcategory: "",
    color: "",
    brand: "",
    serial_number: "",
    distinguishing_marks: "",
    location_name: "",
    campus_location_id: "",
    date_time: new Date().toISOString().slice(0, 16), // format for datetime-local
    image_url: "",
    verification_question: "",
    verification_answer: "",
  });

  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch campus locations
  useEffect(() => {
    async function loadLocations() {
      try {
        setLoadingLocations(true);
        const res = await itemsApi.getCampusLocations();
        if (res.success && res.data) {
          setLocations(res.data);
          if (res.data.length > 0 && !formData.campus_location_id) {
            setFormData((prev) => ({
              ...prev,
              campus_location_id: res.data[0].id,
              latitude: res.data[0].latitude,
              longitude: res.data[0].longitude,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load locations", err);
      } finally {
        setLoadingLocations(false);
      }
    }
    loadLocations();
  }, []);

  const handleChange = (
    field: keyof CreateItemRequest,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = "Item title is required.";
      } else if (formData.title.trim().length < 4) {
        newErrors.title = "Title should be at least 4 characters.";
      }

      if (!formData.description.trim()) {
        newErrors.description = "Please provide a detailed description.";
      } else if (formData.description.trim().length < 10) {
        newErrors.description = "Description should be at least 10 characters.";
      }

      if (!formData.category) {
        newErrors.category = "Please select a category.";
      }
    }

    if (step === 3) {
      if (!formData.date_time) {
        newErrors.date_time = "Date and time is required.";
      }
      if (!formData.location_name?.trim() && !formData.campus_location_id) {
        newErrors.location_name = "Please specify a location name or select a campus building.";
      }
    }

    if (step === 4) {
      if (isFound) {
        if (formData.verification_question?.trim() && !formData.verification_answer?.trim()) {
          newErrors.verification_answer = "Please provide an answer for your verification question.";
        }
        if (!formData.verification_question?.trim() && formData.verification_answer?.trim()) {
          newErrors.verification_question = "Please provide a question if you enter an answer.";
        }
      }
    }

    if (step === 5) {
      if (!confirmedAccurate) {
        newErrors.confirmed = "Please confirm that the submitted details are accurate.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Format payload
      const payload: CreateItemRequest = {
        ...formData,
        date_time: new Date(formData.date_time).toISOString(),
        campus_location_id: formData.campus_location_id || undefined,
        verification_question: isFound && formData.verification_question?.trim()
          ? formData.verification_question.trim()
          : undefined,
        verification_answer: isFound && formData.verification_answer?.trim()
          ? formData.verification_answer.trim()
          : undefined,
      };

      const res = await itemsApi.createItem(payload);
      if (res.success && res.data) {
        navigate(`/items/${res.data.id}`);
      } else {
        setSubmitError(res.message || "Failed to submit item report.");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        "An unexpected error occurred while submitting your report.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLocation = locations.find(
    (loc) => loc.id === formData.campus_location_id
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wizard Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-surface-900 via-surface-900/90 to-surface-950 border border-surface-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant={isFound ? "accent" : "warning"} size="md">
                {isFound ? "Found Item Report" : "Lost Item Report"}
              </Badge>
              <span className="text-xs text-surface-400 font-mono">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {isFound ? "Report a Found Campus Item" : "Report a Lost Personal Item"}
            </h1>
            <p className="text-sm text-surface-300 max-w-xl">
              {isFound
                ? "Help reunite this item with its verified owner. Securely log distinguishing characteristics and custody location."
                : "Register what you've lost. Our automated campus network will cross-reference reports and alert you immediately."}
            </p>
          </div>

          <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-800/80 border border-surface-700/60 text-primary-400 shrink-0 shadow-inner">
            {isFound ? <PackageCheck className="w-7 h-7 text-emerald-400" /> : <HelpCircle className="w-7 h-7 text-amber-400" />}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-8 pt-6 border-t border-surface-800/70">
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isPassed = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (isPassed) setCurrentStep(step.id);
                  }}
                  disabled={!isPassed && !isCurrent}
                  className={`flex flex-col items-center text-center group transition ${
                    isPassed ? "cursor-pointer" : isCurrent ? "cursor-default" : "cursor-not-allowed opacity-40"
                  }`}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-all mb-2 ${
                      isCurrent
                        ? "bg-primary-500 text-white shadow-glow scale-105"
                        : isPassed
                        ? "bg-primary-500/20 text-primary-300 border border-primary-500/40"
                        : "bg-surface-800 text-surface-400 border border-surface-700"
                    }`}
                  >
                    {isPassed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-medium truncate max-w-full ${
                      isCurrent ? "text-white font-semibold" : isPassed ? "text-surface-300" : "text-surface-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <Card className="p-6 sm:p-8 bg-surface-900/70 backdrop-blur-md border-surface-800 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-surface-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-400" />
                    Item Category & Core Overview
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    Select the broad category and write a clear, descriptive title.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Category <span className="text-danger-400">*</span>
                    </label>
                    <Select
                      value={formData.category}
                      onChange={(e) =>
                        handleChange("category", e.target.value as ItemCategory)
                      }
                      options={CATEGORY_OPTIONS}
                      error={errors.category}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Subcategory / Specific Type
                    </label>
                    <Input
                      placeholder="e.g. Laptop, ID Card, Hydro Flask, Wallet"
                      value={formData.subcategory || ""}
                      onChange={(e) => handleChange("subcategory", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">
                    Item Title <span className="text-danger-400">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Space Gray 14-inch MacBook Pro with Stickers"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    error={errors.title}
                  />
                  <p className="text-[11px] text-surface-400">
                    Include noticeable model, color, or style characteristics in the title.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">
                    Detailed Description <span className="text-danger-400">*</span>
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Describe where you last had it, notable contents, stickers, condition, case type, or specific circumstances..."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    error={errors.description}
                  />
                  <p className="text-[11px] text-surface-400">
                    Minimum 10 characters. More details improve matching accuracy significantly.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Physical Attributes */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-surface-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary-400" />
                    Physical Attributes & Identifiers
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    Help distinguish your item from similar makes and models.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Primary Color
                    </label>
                    <Input
                      placeholder="e.g. Midnight Blue, Matte Black, Silver"
                      value={formData.color || ""}
                      onChange={(e) => handleChange("color", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Brand / Manufacturer
                    </label>
                    <Input
                      placeholder="e.g. Apple, Sony, Herschel, Nike"
                      value={formData.brand || ""}
                      onChange={(e) => handleChange("brand", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Serial Number / Student ID / IMEI (Optional)
                    </label>
                    <Input
                      placeholder="e.g. C02XG1234, S10948291"
                      value={formData.serial_number || ""}
                      onChange={(e) => handleChange("serial_number", e.target.value)}
                    />
                    <p className="text-[11px] text-surface-400">
                      Exact identifiers allow immediate automated 100% verification.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Distinguishing Marks & Unique Features
                    </label>
                    <Input
                      placeholder="e.g. Small scratch on right corner, NASA keychain"
                      value={formData.distinguishing_marks || ""}
                      onChange={(e) =>
                        handleChange("distinguishing_marks", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Location & Time */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-surface-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-400" />
                    Campus Location & Date / Time
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    Specify where and approximately when the item was lost or found.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Campus Building / Facility
                    </label>
                    <Select
                      value={formData.campus_location_id || ""}
                      onChange={(e) => {
                        const bldgId = e.target.value;
                        handleChange("campus_location_id", bldgId);
                        const foundBldg = locations.find((l) => l.id === bldgId);
                        if (foundBldg) {
                          handleChange("latitude", foundBldg.latitude);
                          handleChange("longitude", foundBldg.longitude);
                        }
                      }}
                      options={[
                        { value: "", label: "Select campus location (or choose Other)" },
                        ...locations.map((loc) => ({
                          value: loc.id,
                          label: `${loc.name} (${loc.building || "Campus"})`,
                        })),
                      ]}
                      disabled={loadingLocations}
                    />
                    {selectedLocation && (
                      <p className="text-xs text-primary-400/90 flex items-center gap-1.5 mt-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedLocation.description || selectedLocation.floor || "Campus Hub"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-200">
                      Specific Room / Landmark / Spot
                    </label>
                    <Input
                      placeholder="e.g. Near main gate, parking lot, lawn bench, room 204..."
                      value={formData.location_name || ""}
                      onChange={(e) => handleChange("location_name", e.target.value)}
                      error={errors.location_name}
                    />
                  </div>
                </div>

                {/* Interactive Leaflet Location Picker */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-surface-200 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-primary-400" />
                      Pinpoint Location on Campus Map (Optional)
                    </label>
                    <span className="text-[11px] text-surface-400">
                      Click the map to drop coordinates
                    </span>
                  </div>
                  <LocationPicker
                    initialLat={formData.latitude}
                    initialLon={formData.longitude}
                    campusLocations={locations}
                    onSelectCoordinates={(lat, lon, nearestLoc) => {
                      handleChange("latitude", lat);
                      handleChange("longitude", lon);
                      if (nearestLoc) {
                        handleChange("campus_location_id", nearestLoc.id);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">
                    Date & Time {isFound ? "Found" : "Lost"} <span className="text-danger-400">*</span>
                  </label>
                  <div className="relative max-w-sm">
                    <Input
                      type="datetime-local"
                      value={formData.date_time}
                      onChange={(e) => handleChange("date_time", e.target.value)}
                      error={errors.date_time}
                      className="pr-10"
                    />
                  </div>
                  <p className="text-[11px] text-surface-400">
                    Give your best estimate of when the event occurred.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Photo & Security */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-surface-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary-400" />
                    Photo Attachment & Security Controls
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    Upload an image of the item or its purchase receipt/reference photo.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">
                    Item Photo (Recommended)
                  </label>
                  <ImageUploader
                    value={formData.image_url}
                    onChange={(url) => handleChange("image_url", url)}
                    onClear={() => handleChange("image_url", "")}
                  />
                </div>

                {/* For FOUND items: Private Verification Question */}
                {isFound && (
                  <div className="p-5 rounded-2xl bg-surface-950/80 border border-primary-500/20 space-y-4">
                    <div className="flex items-center gap-2.5 text-accent-300">
                      <Lock className="w-5 h-5 text-accent-400" />
                      <h3 className="text-sm font-semibold">
                        Private Ownership Verification Question (Optional)
                      </h3>
                    </div>
                    <p className="text-xs text-surface-400 leading-relaxed">
                      To prevent fraudulent claims, set a question that only the true owner would know. The answer is hashed and never displayed publicly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-surface-300">
                          Verification Question
                        </label>
                        <Input
                          placeholder="e.g. What sticker is on the laptop lid?"
                          value={formData.verification_question || ""}
                          onChange={(e) =>
                            handleChange("verification_question", e.target.value)
                          }
                          error={errors.verification_question}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-surface-300">
                          Expected Answer
                        </label>
                        <Input
                          placeholder="e.g. Green NASA logo"
                          value={formData.verification_answer || ""}
                          onChange={(e) =>
                            handleChange("verification_answer", e.target.value)
                          }
                          error={errors.verification_answer}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-surface-800 pb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Review Summary Before Submission
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    Please review all details before registering this report to the university database.
                  </p>
                </div>

                {submitError && (
                  <div className="p-4 rounded-2xl bg-danger-500/10 border border-danger-500/25 flex items-center gap-3 text-danger-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-danger-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-surface-950/70 border border-surface-800">
                  {/* Left Column: Image or Thumbnail */}
                  <div className="flex flex-col items-center justify-center">
                    {formData.image_url ? (
                      <img
                        src={
                          formData.image_url.startsWith("http")
                            ? formData.image_url
                            : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:8000"}${formData.image_url}`
                        }
                        alt="Preview"
                        className="w-full h-44 object-cover rounded-xl border border-surface-700 shadow-md"
                      />
                    ) : (
                      <div className="w-full h-44 rounded-xl border border-dashed border-surface-800 bg-surface-900 flex flex-col items-center justify-center text-surface-500">
                        <Tag className="w-8 h-8 mb-2" />
                        <span className="text-xs">No image attached</span>
                      </div>
                    )}
                  </div>

                  {/* Middle & Right Columns: Metadata */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={isFound ? "accent" : "warning"}>
                        {formData.type}
                      </Badge>
                      <Badge variant="primary">
                        {formData.category}
                      </Badge>
                      {formData.subcategory && (
                        <span className="text-xs text-surface-400">
                          • {formData.subcategory}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {formData.title}
                      </h3>
                      <p className="text-sm text-surface-300 mt-1 whitespace-pre-wrap">
                        {formData.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-surface-850">
                      <div>
                        <span className="text-surface-400">Brand / Color:</span>
                        <p className="text-surface-200 font-medium">
                          {[formData.brand, formData.color].filter(Boolean).join(" • ") || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <span className="text-surface-400">Location:</span>
                        <p className="text-surface-200 font-medium">
                          {formData.location_name || selectedLocation?.name || "Campus grounds"}
                        </p>
                        {formData.latitude && formData.longitude && (
                          <span className="text-[10px] text-primary-400 font-mono block mt-0.5">
                            GPS Pin: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-surface-400">Date & Time:</span>
                        <p className="text-surface-200 font-medium">
                          {new Date(formData.date_time).toLocaleString()}
                        </p>
                      </div>

                      {formData.serial_number && (
                        <div>
                          <span className="text-surface-400">Serial Number:</span>
                          <p className="text-surface-200 font-mono">
                            {formData.serial_number}
                          </p>
                        </div>
                      )}
                    </div>

                    {isFound && formData.verification_question && (
                      <div className="p-2.5 rounded-xl bg-surface-900 border border-surface-800 text-xs">
                        <span className="text-accent-400 font-medium flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Verification Question Set:
                        </span>
                        <p className="text-surface-300 mt-0.5">
                          "{formData.verification_question}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="p-4 rounded-xl bg-surface-900/60 border border-surface-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedAccurate}
                      onChange={(e) => {
                        setConfirmedAccurate(e.target.checked);
                        if (errors.confirmed) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.confirmed;
                            return next;
                          });
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded text-primary-600 bg-surface-800 border-surface-700 focus:ring-primary-500"
                    />
                    <span className="text-xs text-surface-300 leading-relaxed">
                      I confirm that the details provided are accurate. I understand that submitting false or misleading reports is a violation of university conduct policies.
                    </span>
                  </label>
                  {errors.confirmed && (
                    <p className="text-xs text-danger-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.confirmed}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-surface-800">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < STEPS.length ? (
                <Button type="button" variant="primary" onClick={handleNext}>
                  Next Step
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="shadow-glow"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isFound ? "Publish Found Report" : "Submit Lost Report"}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default MultiStepReportForm;
