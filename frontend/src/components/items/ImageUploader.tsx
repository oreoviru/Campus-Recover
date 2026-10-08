/**
 * Campus Recover — Image Uploader Component
 *
 * Drag-and-drop file upload with live preview, size validation,
 * and direct integration with backend upload endpoint.
 */

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import itemsApi from "@/api/items";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onClear,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const response = await itemsApi.uploadImage(file);
        if (response.success && response.data) {
          onChange(response.data.url);
        } else {
          setError(response.message || "Failed to upload image.");
        }
      } catch (err: any) {
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          "Failed to upload image. Please try again.";
        setError(msg);
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === "file-too-large") {
          setError("File size exceeds 5MB limit.");
        } else {
          setError("Invalid file type. Only JPG, PNG, WEBP are accepted.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || uploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (onClear) onClear();
    setError(null);
  };

  const fullImageUrl = value
    ? value.startsWith("http")
      ? value
      : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api/v1", "") : "http://localhost:8000"}${value}`
    : null;

  return (
    <div className="w-full space-y-2">
      {/* Upload Box or Image Preview */}
      {value && fullImageUrl ? (
        <div className="relative group rounded-2xl overflow-hidden border border-surface-700 bg-surface-900/60 aspect-video max-h-72 w-full flex items-center justify-center">
          <img
            src={fullImageUrl}
            alt="Uploaded item preview"
            className="w-full h-full object-cover transition group-hover:scale-[1.02] duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
            <span className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Image Uploaded
            </span>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 rounded-xl bg-danger-500/80 hover:bg-danger-600 text-white backdrop-blur-sm transition shadow-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-primary-500 bg-primary-500/10 scale-[1.01]"
              : "border-surface-800 hover:border-surface-700 bg-surface-900/40 hover:bg-surface-900/70"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-850 flex items-center justify-center text-primary-400 shadow-inner group-hover:scale-110 transition-transform">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
              ) : isDragActive ? (
                <Upload className="w-6 h-6 text-primary-400 animate-bounce" />
              ) : (
                <ImageIcon className="w-6 h-6 text-surface-400" />
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                {uploading ? (
                  "Uploading image..."
                ) : isDragActive ? (
                  "Drop the image here"
                ) : (
                  <>
                    <span className="text-primary-400 underline underline-offset-2">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                PNG, JPG, or WEBP up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-danger-400 bg-danger-500/10 px-3 py-2 rounded-xl border border-danger-500/20 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
