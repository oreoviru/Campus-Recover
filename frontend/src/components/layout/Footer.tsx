import React from "react";
import { Link } from "react-router-dom";
import { Radar, Shield, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-950 border-t border-surface-850 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                <Radar className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold text-white">
                Campus <span className="text-accent-400">Recover</span>
              </span>
            </Link>
            <p className="text-xs text-surface-400 leading-relaxed mb-4">
              Decentralized AI-powered item recovery infrastructure connecting university students, staff, and security desks.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-surface-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span>Campus Recovery Node Active</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-300 mb-4 font-mono">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-surface-400">
              <li>
                <Link to="/report-lost" className="hover:text-white transition">
                  Report Lost Property
                </Link>
              </li>
              <li>
                <Link to="/report-found" className="hover:text-white transition">
                  Report Found Property
                </Link>
              </li>
              <li>
                <Link to="/browse" className="hover:text-white transition">
                  Campus Registry Search
                </Link>
              </li>
              <li>
                <Link to="/matches" className="hover:text-white transition">
                  AI Match Algorithm
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Security */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-300 mb-4 font-mono">
              Trust & Privacy
            </h4>
            <ul className="space-y-2 text-xs text-surface-400">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-accent-400" />
                <span>Zero-Knowledge Verification</span>
              </li>
              <li>
                <span className="text-surface-500">Bcrypt-Hashed Answers</span>
              </li>
              <li>
                <span className="text-surface-500">Authorized Domain Only</span>
              </li>
              <li>
                <span className="text-surface-500">Role-Based Access Control</span>
              </li>
            </ul>
          </div>

          {/* Institutional Compliance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-300 mb-4 font-mono">
              Institutional
            </h4>
            <p className="text-xs text-surface-400 leading-relaxed mb-3">
              Administered in collaboration with University Campus Security & Student Union Facilities.
            </p>
            <div className="p-3 rounded-xl bg-surface-900 border border-surface-800 text-[11px] text-surface-400">
              Emergency lost valuables? Visit the Central Security Desk on Ground Floor.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
          <div>
            © {new Date().getFullYear()} Campus Recover. Designed for Higher Education.
          </div>
          <div className="flex items-center gap-1">
            <span>Powered by neural matching and semantic AI</span>
            <Heart className="w-3 h-3 text-danger-400 inline mx-1 fill-danger-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};
