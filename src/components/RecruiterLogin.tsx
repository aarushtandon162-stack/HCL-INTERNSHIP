import React, { useState } from "react";
import { Lock, Mail, ArrowLeft, LogIn } from "lucide-react";
import { AuthState } from "../types";

interface RecruiterLoginProps {
  onBack: () => void;
  onLoginSuccess: (token: string, recruiter: any) => void;
}

export default function RecruiterLogin({ onBack, onLoginSuccess }: RecruiterLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please fill out both email and password fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Login verification failed.");
      }

      // Success
      onLoginSuccess(resData.token, resData.recruiter);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("recruiter@company.com");
    setPassword("Password123");
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-[2rem] border border-natural-border shadow-xs overflow-hidden animate-fade-in">
      <div className="bg-natural-primary px-8 py-8 text-white text-center">
        <h2 className="text-2xl font-serif font-bold tracking-tight text-white">Staff Dashboard</h2>
        <p className="text-[#f0eee9] text-xs mt-1.5 font-sans">Authorized credential verification doorway</p>
      </div>

      <div className="p-8">
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold leading-relaxed flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            {errorMessage}
          </div>
        )}

        {/* Demo Credentials Helper Card */}
        <div className="mb-6 bg-natural-sidebar border border-natural-border rounded-xl p-4 text-center">
          <p className="text-xs text-natural-secondary font-semibold font-sans">
            Staff testing credentials:
          </p>
          <div className="my-2 bg-white px-3 py-2 rounded-lg border border-natural-border inline-block text-left text-xs font-mono">
            <div><span className="text-natural-secondary">Email:</span> recruiter@company.com</div>
            <div><span className="text-natural-secondary">Pass:</span> Password123</div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="block mx-auto text-xs font-semibold text-natural-primary hover:text-natural-primary-hover decoration-dotted underline transition-colors cursor-pointer mt-1"
          >
            Auto-fill Credentials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-1.5">Recruiter Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="email"
                placeholder="recruiter@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-natural-primary hover:bg-natural-primary-hover disabled:bg-gray-300 text-white font-medium text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authorizing...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In securely
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 bg-white hover:bg-natural-sidebar text-natural-primary hover:text-[#4a584a] font-medium text-sm rounded-xl border border-natural-border transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Go back to hub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
