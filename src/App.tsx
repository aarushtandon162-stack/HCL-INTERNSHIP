import React, { useState, useEffect } from "react";
import { 
  Users, 
  Briefcase, 
  Lock, 
  ChevronRight, 
  FileText,
  UserCheck,
  Compass,
  ArrowRight
} from "lucide-react";
import CandidatePortal from "./components/CandidatePortal";
import RecruiterLogin from "./components/RecruiterLogin";
import RecruiterWorkspace from "./components/RecruiterWorkspace";

type AppView = "welcome" | "candidate" | "recruiter_login" | "recruiter_workspace";

const OPEN_POSITIONS = [
  { title: "Frontend Engineer", openings: 2, dept: "Engineering", type: "Full-time" },
  { title: "Full Stack Developer", openings: 3, dept: "Engineering", type: "Full-time" },
  { title: "Product Manager", openings: 1, dept: "Product & Growth", type: "Full-time" },
  { title: "Data Analyst", openings: 1, dept: "Data Science", type: "Full-time" },
  { title: "UX Designer", openings: 2, dept: "UX Design & Research", type: "Contract / FT" }
];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("welcome");
  const [token, setToken] = useState<string | null>(null);
  const [recruiter, setRecruiter] = useState<any | null>(null);

  // Read recruiter session from localStorage on app bootstrap
  useEffect(() => {
    const savedToken = localStorage.getItem("recruitment_session_token");
    const savedRecruiter = localStorage.getItem("recruitment_session_recruiter");
    if (savedToken && savedRecruiter) {
      setToken(savedToken);
      setRecruiter(JSON.parse(savedRecruiter));
      setCurrentView("recruiter_workspace");
    }
  }, []);

  // Handle successful login routing
  const handleLoginSuccess = (userToken: string, userRecruiter: any) => {
    setToken(userToken);
    setRecruiter(userRecruiter);
    localStorage.setItem("recruitment_session_token", userToken);
    localStorage.setItem("recruitment_session_recruiter", JSON.stringify(userRecruiter));
    setCurrentView("recruiter_workspace");
  };

  // Handle logout
  const handleLogout = () => {
    setToken(null);
    setRecruiter(null);
    localStorage.removeItem("recruitment_session_token");
    localStorage.removeItem("recruitment_session_recruiter");
    setCurrentView("welcome");
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text flex flex-col font-sans" id="recruitment-system-app">
      
      {/* Dynamic Navbar */}
      <nav className="sticky top-0 z-55 bg-natural-sidebar border-b border-natural-border shadow-xs" id="app-global-navbar">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div 
            onClick={() => {
              if (token) {
                setCurrentView("recruiter_workspace");
              } else {
                setCurrentView("welcome");
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none animate-fade-in"
          >
            <div className="w-9 h-9 rounded-xl bg-natural-primary flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
              H
            </div>
            <div className="flex items-baseline">
              <span className="font-serif font-semibold text-natural-dark tracking-tight text-sm md:text-base ml-2">Harvest ATS</span>
              <span className="text-[9px] bg-[#e8e4db] text-natural-primary font-bold px-1.5 py-0.5 rounded-md ml-2 uppercase font-mono tracking-wider">Natural Simplicity</span>
            </div>
          </div>

          {/* Nav Links / Quick Commands */}
          <div className="flex items-center gap-4">
            {currentView === "welcome" && (
              <button
                onClick={() => setCurrentView("recruiter_login")}
                className="px-4 py-2 border border-natural-border bg-white hover:border-natural-primary text-natural-primary hover:text-natural-primary-hover font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Staff Console
              </button>
            )}
            
            {token && currentView !== "recruiter_workspace" && (
              <button
                onClick={() => setCurrentView("recruiter_workspace")}
                className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover text-white font-medium text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Go to Workspace
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Main Screen Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8" id="view-router-outlet">
        
        {/* Welcome Dashboard */}
        {currentView === "welcome" && (
          <div className="space-y-12 animate-fade-in" id="welcome-landing-screen">
            
            {/* Visual Hero Block */}
            <div className="max-w-3xl mx-auto text-center space-y-4 py-6">
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-natural-dark leading-tight">
                Premium modern recruitment <br />
                <span className="text-natural-primary italic font-medium">management with natural simplicity.</span>
              </h1>
              <p className="text-[#a09e99] font-sans text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Connect stellar candidates with high-growth roles seamlessly. Features professional application portfolios and collaborative evaluation workspace desks for recruiters.
              </p>
            </div>

            {/* Split Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Card 1: Candidate Portal Action */}
              <div 
                onClick={() => setCurrentView("candidate")}
                className="group relative bg-white rounded-[2rem] border border-natural-border p-8 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-natural-sidebar text-natural-primary flex items-center justify-center border border-natural-border group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-semibold text-natural-dark">Candidate Portal</h2>
                    <p className="text-gray-550 text-xs mt-2 leading-relaxed">
                      Looking for your next challenge? Fill out our stylized candidate questionnaire, map your technical skills, attach your CV dossier, and start your recruitment journey.
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-natural-border-light flex items-center justify-between text-natural-primary font-semibold text-sm group-hover:text-natural-primary-hover">
                  <span>Start candidate application</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Card 2: Recruiter Login Action */}
              <div 
                onClick={() => {
                  if (token) {
                    setCurrentView("recruiter_workspace");
                  } else {
                    setCurrentView("recruiter_login");
                  }
                }}
                className="group relative bg-white rounded-[2rem] border border-natural-border p-8 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-natural-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-semibold text-natural-dark">Evaluator Workspace</h2>
                    <p className="text-gray-550 text-xs mt-2 leading-relaxed">
                      Analyze candidate submissions, adjust status checkpoints, review candidate resumes, and securely export data logs with custom organic reports.
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-natural-border-light flex items-center justify-between text-natural-primary font-semibold text-sm group-hover:text-natural-primary-hover">
                  <span>Open secure staff dashboard</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

            </div>

            {/* List of open opportunities marquee */}
            <div className="max-w-4xl mx-auto space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-natural-secondary flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> High-Priority Active Openings
                </h3>
                <span className="text-[10px] bg-natural-accent-light text-natural-accent font-bold px-2 py-0.5 rounded-full border border-natural-border">Active hiring</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                {OPEN_POSITIONS.map((pos, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      setCurrentView("candidate");
                    }}
                    className="bg-white rounded-2xl p-4 border border-natural-border hover:border-natural-primary transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-serif font-bold text-natural-dark leading-snug">{pos.title}</h4>
                      <p className="text-[9px] text-[#7a7a7a] font-semibold mt-1 uppercase tracking-wider">{pos.dept}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px]">
                      <span className="text-[#7a7a7a] font-semibold font-mono">{pos.openings} open role{pos.openings > 1 && 's'}</span>
                      <span className="text-natural-secondary font-medium">{pos.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Candidate Portal View */}
        {currentView === "candidate" && (
          <CandidatePortal onBack={() => setCurrentView("welcome")} />
        )}

        {/* Recruiter Login View */}
        {currentView === "recruiter_login" && (
          <RecruiterLogin 
            onBack={() => setCurrentView("welcome")} 
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* Recruiter Workspace Dashboard view */}
        {currentView === "recruiter_workspace" && token && recruiter && (
          <RecruiterWorkspace 
            token={token} 
            recruiter={recruiter} 
            onLogout={handleLogout} 
          />
        )}

      </main>

      {/* Styled Footer */}
      <footer className="bg-natural-sidebar border-t border-natural-border py-6 text-center text-xs text-natural-secondary font-mono mt-12" id="app-global-footer">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            © 2026 Harvest ATS Inc. Built in Natural Simplicity tones.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-natural-primary cursor-help">Workspace Secure</span>
            <span>•</span>
            <span className="hover:text-natural-primary cursor-help">JSON DB Engine</span>
            <span>•</span>
            <span className="hover:text-natural-primary cursor-help">React Fullstack</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
