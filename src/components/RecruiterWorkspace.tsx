import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Briefcase, 
  Award, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Download, 
  PlusCircle, 
  LogOut, 
  User, 
  GraduationCap, 
  Clock, 
  Phone, 
  Mail, 
  SlidersHorizontal,
  FileSpreadsheet,
  Trash2,
  Bookmark,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import { Candidate, CandidateStatus, Recruiter, CandidateNote } from "../types";

interface RecruiterWorkspaceProps {
  token: string;
  recruiter: Recruiter;
  onLogout: () => void;
}

export default function RecruiterWorkspace({ token, recruiter, onLogout }: RecruiterWorkspaceProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Active search, filters, and sorting parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [experienceFilter, setExperienceFilter] = useState("All"); // All, Less than 3, 3 to 6, More than 6
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc, date_asc, exp_desc, exp_asc, name_asc

  // Detailed view sheet state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load candidate roster from Express fullstack API
  const loadCandidates = async () => {
    try {
      setLoading(true);
      setErrorStatus(null);
      const response = await fetch("/api/candidates", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error("Failed to load candidate directory. Access might have expired.");
      }
      const data = await response.json();
      setCandidates(data);
      
      // If a candidate is currently opened, reload their specific content as well
      if (selectedCandidate) {
        const updated = data.find((c: Candidate) => c.id === selectedCandidate.id);
        if (updated) {
          setSelectedCandidate(updated);
        }
      }
    } catch (err: any) {
      setErrorStatus(err.message || "Network error loading database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [token]);

  // Handle status update of a candidate
  const handleUpdateStatus = async (candId: string, nextStatus: CandidateStatus) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/candidates/${candId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        throw new Error("Unable to change candidate status.");
      }

      const updatedCandidate = await response.json();
      
      // Update local candidates list
      setCandidates(prev => prev.map(c => c.id === candId ? updatedCandidate : c));
      setSelectedCandidate(updatedCandidate);
    } catch (err: any) {
      alert(err.message || "Failed to update candidate state.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle appending of notes
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !newNoteText.trim() || submittingNote) return;

    setSubmittingNote(true);
    try {
      const response = await fetch(`/api/candidates/${selectedCandidate.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: newNoteText })
      });

      if (!response.ok) {
        throw new Error("Failed to post note comment.");
      }

      const updatedCandidate = await response.json();
      setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updatedCandidate : c));
      setSelectedCandidate(updatedCandidate);
      setNewNoteText("");
    } catch (err: any) {
      alert(err.message || "failed to save recruiter comment.");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Compile statistics based on candidate state counts
  const totalCount = candidates.length;
  const countByStatus = {
    Applied: candidates.filter(c => c.status === "Applied").length,
    Screening: candidates.filter(c => c.status === "Screening").length,
    Interviewing: candidates.filter(c => c.status === "Interviewing").length,
    Offer: candidates.filter(c => c.status === "Offer").length,
    Rejected: candidates.filter(c => c.status === "Rejected").length
  };

  // Filter candidates list on active recruiter selections
  const filteredCandidates = candidates.filter(c => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.fullName.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.position.toLowerCase().includes(query) ||
      c.skills.some(s => s.toLowerCase().includes(query));

    // 2. Position Filter
    const matchesPosition = positionFilter === "All" || c.position === positionFilter;

    // 3. Status Filter
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;

    // 4. Experience Years Filter
    let matchesExperience = true;
    if (experienceFilter === "Entry") {
      matchesExperience = c.experience >= 0 && c.experience <= 2;
    } else if (experienceFilter === "Mid") {
      matchesExperience = c.experience >= 3 && c.experience <= 5;
    } else if (experienceFilter === "Senior") {
      matchesExperience = c.experience >= 6;
    }

    return matchesSearch && matchesPosition && matchesStatus && matchesExperience;
  }).sort((a, b) => {
    // Handling sorting layers
    if (sortBy === "date_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "exp_desc") {
      return b.experience - a.experience;
    }
    if (sortBy === "exp_asc") {
      return a.experience - b.experience;
    }
    if (sortBy === "name_asc") {
      return a.fullName.localeCompare(b.fullName);
    }
    return 0;
  });

  // Export full Candidate Portal to offline-capable CSV sheet download
  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      alert("No matching records to export.");
      return;
    }

    // CSV Headers
    const headers = ["ID", "Full Name", "Email", "Phone", "Target Position", "Experience (Years)", "Status", "Education", "Created At"];
    
    // Map data rows
    const rows = filteredCandidates.map(c => [
      c.id,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.email,
      c.phone || "N/A",
      `"${c.position.replace(/"/g, '""')}"`,
      c.experience,
      c.status,
      `"${c.education.replace(/"/g, '""')}"`,
      new Date(c.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Dynamic naming
    const fileSuffix = `${positionFilter.replace(/\s+/g, '_')}_${statusFilter}`;
    link.setAttribute("download", `Recruiter_Roster_${fileSuffix}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper styles for status chips
  const getStatusColorClass = (status: CandidateStatus) => {
    switch (status) {
      case "Applied":
        return "bg-[#f0eee9] text-[#5e5a52] border-natural-border";
      case "Screening":
        return "bg-[#eef3f0] text-natural-primary border-[#d5ded8]";
      case "Interviewing":
        return "bg-[#fdf9f2] text-[#916b3d] border-[#ebdbf5]";
      case "Offer":
        return "bg-[#e8f0e8] text-[#4a584a] border-[#cbd9cb]";
      case "Rejected":
        return "bg-[#fcf5f5] text-[#b04f4f] border-[#ebd1d1]";
      default:
        return "bg-[#fcfaf7] text-[#696763] border-natural-border";
    }
  };

  return (
    <div id="recruiter-workspace-root" className="space-y-6">
      
      {/* 1. Workspace Header Section */}
      <div className="bg-white rounded-[2rem] border border-natural-border shadow-xs p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-natural-primary text-white flex items-center justify-center font-serif font-bold text-lg">
            {recruiter.fullName ? recruiter.fullName.split(" ").map(n => n[0]).join("") : "S"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-natural-dark">Welcome, {recruiter.fullName}</h1>
              <span className="px-2.5 py-0.5 bg-[#e8f0e8] text-natural-primary rounded-md text-[10px] font-bold uppercase tracking-wider">{recruiter.role}</span>
            </div>
            <p className="text-natural-secondary text-xs mt-0.5">Recruiter Hub • Digital evaluation panel & tracking pipeline</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadCandidates}
            className="px-4 py-2 bg-white hover:bg-natural-sidebar text-natural-primary font-bold text-xs rounded-xl border border-natural-border transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" /> Reload List
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>

      {/* 2. Statistical Counter Summary Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
        
        {/* Total Candidates */}
        <div className="bg-white rounded-2xl p-4 border border-natural-border shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#f0eee9] border border-natural-border flex items-center justify-center text-[#5e5a52] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Candidate Pool</div>
            <div className="text-2xl font-bold text-natural-dark mt-0.5">{totalCount}</div>
          </div>
        </div>

        {/* Applied Card */}
        <div onClick={() => setStatusFilter("Applied")} className={`cursor-pointer bg-white rounded-2xl p-4 border shadow-xs flex items-center gap-4 transition hover:-translate-y-0.5 ${statusFilter === "Applied" ? "border-natural-primary ring-2 ring-natural-primary/50 bg-[#eef3f0]" : "border-natural-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#5e5a52] shrink-0 border border-natural-border-light">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Applied</div>
            <div className="text-2xl font-bold text-natural-dark mt-0.5">{countByStatus.Applied}</div>
          </div>
        </div>

        {/* Screening Card */}
        <div onClick={() => setStatusFilter("Screening")} className={`cursor-pointer bg-white rounded-2xl p-4 border shadow-xs flex items-center gap-4 transition hover:-translate-y-0.5 ${statusFilter === "Screening" ? "border-natural-primary ring-2 ring-natural-primary/50 bg-[#eef3f0]" : "border-natural-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#eef3f0] flex items-center justify-center text-natural-primary shrink-0 border border-[#cbd9cb]">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Screening</div>
            <div className="text-2xl font-bold text-natural-dark mt-0.5">{countByStatus.Screening}</div>
          </div>
        </div>

        {/* Interviewing Card */}
        <div onClick={() => setStatusFilter("Interviewing")} className={`cursor-pointer bg-white rounded-2xl p-4 border shadow-xs flex items-center gap-4 transition hover:-translate-y-0.5 ${statusFilter === "Interviewing" ? "border-natural-primary ring-2 ring-natural-primary/50 bg-[#eef3f0]" : "border-natural-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#fdf2df] flex items-center justify-center text-[#916b3d] shrink-0 border border-[#edd5a4]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Interview</div>
            <div className="text-2xl font-bold text-[#916b3d] mt-0.5">{countByStatus.Interviewing}</div>
          </div>
        </div>

        {/* Offer Extended Card */}
        <div onClick={() => setStatusFilter("Offer")} className={`cursor-pointer bg-white rounded-2xl p-4 border shadow-xs flex items-center gap-4 transition hover:-translate-y-0.5 ${statusFilter === "Offer" ? "border-natural-primary ring-2 ring-natural-primary/50 bg-[#eef3f0]" : "border-natural-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#e8f0e8] flex items-center justify-center text-natural-primary shrink-0 border border-[#cbd9cb]">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Offer Sent</div>
            <div className="text-2xl font-bold text-natural-primary mt-0.5">{countByStatus.Offer}</div>
          </div>
        </div>

        {/* Rejected Card */}
        <div onClick={() => setStatusFilter("Rejected")} className={`cursor-pointer bg-white rounded-2xl p-4 border shadow-xs flex items-center gap-4 transition hover:-translate-y-0.5 ${statusFilter === "Rejected" ? "border-natural-primary ring-2 ring-natural-primary/50 bg-[#eef3f0]" : "border-natural-border"}`}>
          <div className="w-10 h-10 rounded-xl bg-[#fcf5f5] flex items-center justify-center text-[#b04f4f] shrink-0 border border-[#ebd1d1]">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Rejected</div>
            <div className="text-2xl font-bold text-[#b04f4f] mt-0.5">{countByStatus.Rejected}</div>
          </div>
        </div>

      </div>

      {/* 3. Candidates roster list & main split content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Filtering Controls and Applicants Table (takes 8 cols if details open, else 12) */}
        <div className={`space-y-4 ${selectedCandidate ? "lg:col-span-6" : "lg:col-span-12"}`}>
          
          {/* Filters Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-natural-border p-4 space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
                <input
                  type="text"
                  placeholder="Query name, e-mail, opening, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-natural-sidebar/40 hover:bg-natural-sidebar/20 border border-natural-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary focus:bg-white transition text-natural-dark"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPositionFilter("All");
                    setStatusFilter("All");
                    setExperienceFilter("All");
                    setSortBy("date_desc");
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-natural-sidebar text-natural-primary font-bold text-xs rounded-xl border border-natural-border shadow-xs transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-natural-primary hover:bg-natural-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            {/* Grid Selectors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {/* Position Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary mb-1">Job Opening</label>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full bg-white border border-natural-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary text-natural-dark font-medium"
                >
                  <option value="All">All Jobs</option>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="UX Designer">UX Designer</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary mb-1">Workflow Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-natural-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary text-natural-dark font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer Sent</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary mb-1">Experience Years</label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full bg-white border border-natural-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary text-natural-dark font-medium"
                >
                  <option value="All">All Experience</option>
                  <option value="Entry">Entry Range (0-2 yrs)</option>
                  <option value="Mid">Mid Range (3-5 yrs)</option>
                  <option value="Senior">Senior Range (6+ yrs)</option>
                </select>
              </div>

              {/* Sort selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary mb-1">Sort Orders</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-natural-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary text-natural-dark font-medium"
                >
                  <option value="date_desc">Newest Applied</option>
                  <option value="date_asc">Oldest Applied</option>
                  <option value="exp_desc">Exp: High to Low</option>
                  <option value="exp_asc">Exp: Low to High</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>          {/* Roster Table Content */}
          <div className="bg-white rounded-2xl border border-natural-border shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-natural-secondary text-sm">
                <svg className="animate-spin h-6 w-6 text-natural-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing Candidate Records...
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-16 text-center text-natural-secondary text-sm leading-relaxed">
                There are no candidates matching your active dashboard selections. Try widening your search queries or clearing filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-natural-sidebar border-b border-natural-border text-[10px] text-natural-secondary uppercase tracking-wider font-bold">
                      <th className="py-4 px-5">Applicant DETAILS</th>
                      <th className="py-4 px-4 hidden md:table-cell">Job Position</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-natural-border-light text-sm">
                    {filteredCandidates.map(cand => (
                      <tr
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand)}
                        className={`hover:bg-natural-sidebar/40 cursor-pointer transition-colors ${selectedCandidate?.id === cand.id ? "bg-[#e8f0e8]/30 font-bold" : ""}`}
                      >
                        <td className="py-4 px-5">
                           <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-natural-sidebar text-natural-primary font-bold text-xs flex items-center justify-center shrink-0 border border-natural-border">
                              {cand.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                            </div>
                            <div>
                              <div className="text-natural-dark font-bold font-serif text-sm">{cand.fullName}</div>
                              <div className="text-natural-secondary text-xs flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-natural-primary">{cand.experience} yrs exp</span>
                                <span>•</span>
                                <span className="max-w-[150px] md:max-w-xs truncate">{cand.skills.slice(0, 3).join(", ")}{cand.skills.length > 3 && ` +${cand.skills.length - 3}`}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div className="text-natural-dark font-semibold text-xs flex items-center gap-1.5 align-middle">
                            <Briefcase className="w-3.5 h-3.5 text-natural-secondary inline" />
                            {cand.position}
                          </div>
                          <div className="text-[10px] text-natural-secondary font-sans mt-0.5 font-medium">{cand.education ? cand.education.split(",")[0] : "Education undisclosed"}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColorClass(cand.status)}`}>
                            {cand.status === "Offer" ? "Offer Sent" : cand.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="p-1 px-3 bg-white border border-natural-border hover:bg-natural-sidebar text-natural-primary rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap"
                          >
                            Dossier →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3 bg-natural-sidebar border-t border-natural-border text-[10px] text-natural-secondary font-mono text-center">
              Active candidates listing: {filteredCandidates.length} of {totalCount} total applicants
            </div>
          </div>
        </div>

        {/* Right Column: Deep Profile Details view Panel (takes 6 cols, appears when selectedCandidate present) */}
        {selectedCandidate && (
          <div id="applicant-dossier-panel" className="lg:col-span-6 space-y-4 animate-fade-in">
            
            {/* Header: Candidate Identification Card */}
            <div className="bg-white rounded-2xl border border-natural-border shadow-xs p-6 relative overflow-hidden">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="absolute right-4 top-4 text-natural-secondary hover:text-natural-primary bg-natural-sidebar p-1.5 rounded-lg border border-natural-border cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="text-[10px] font-mono text-natural-secondary uppercase tracking-widest mb-1.5 font-bold">Verified Dossier</div>
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-natural-primary text-white font-serif font-black text-xl flex items-center justify-center shrink-0 shadow-xs mt-1">
                  {selectedCandidate.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-natural-dark leading-tight">{selectedCandidate.fullName}</h3>
                  <div className="text-xs font-semibold text-natural-primary mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-natural-secondary" />
                    <span>{selectedCandidate.position}</span>
                    <span>•</span>
                    <span className="text-natural-secondary font-medium">{selectedCandidate.experience} Years experience</span>
                  </div>
                  <div className="text-xs text-natural-secondary font-sans mt-0.5">Applied {new Date(selectedCandidate.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-natural-border-light">
                <a
                  href={`/api/candidates/${selectedCandidate.id}/resume/download`}
                  className="px-4 py-2.5 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl text-center text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
                <a
                  href={`mailto:${selectedCandidate.email}`}
                  className="px-4 py-2.5 bg-white border border-natural-border hover:bg-natural-sidebar text-natural-primary rounded-xl text-center text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Applicant
                </a>
              </div>
            </div>

            {/* Workflow status stepper */}
            <div className="bg-white rounded-2xl border border-natural-border shadow-xs p-5 space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary">Application Pipeline Status</label>
              
              <div className="grid grid-cols-5 gap-1.5 pt-1.5">
                {(["Applied", "Screening", "Interviewing", "Offer", "Rejected"] as CandidateStatus[]).map((statusValue) => {
                  const isActive = selectedCandidate.status === statusValue;
                  const label = statusValue === "Offer" ? "Offer Sent" : statusValue;
                  
                  // Stylings
                  let baseStyle = "px-2 py-3 rounded-xl border text-center text-[10px] font-bold select-none cursor-pointer transition-all ";
                  if (isActive) {
                    if (statusValue === "Rejected") baseStyle += "bg-[#b04f4f] border-[#b04f4f] text-white shadow-xs";
                    else if (statusValue === "Offer") baseStyle += "bg-natural-primary border-natural-primary text-white shadow-xs";
                    else if (statusValue === "Interviewing") baseStyle += "bg-[#916b3d] border-[#916b3d] text-white shadow-xs";
                    else if (statusValue === "Screening") baseStyle += "bg-[#5d6d5d] border-[#5d6d5d] text-white shadow-xs";
                    else baseStyle += "bg-[#647164] border-[#647164] text-white shadow-xs";
                  } else {
                    baseStyle += "bg-natural-sidebar hover:bg-[#e8e4db] border-transparent text-natural-primary";
                  }

                  return (
                    <button
                      key={statusValue}
                      type="button"
                      disabled={updatingStatus || isActive}
                      onClick={() => handleUpdateStatus(selectedCandidate.id, statusValue)}
                      className={baseStyle}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-natural-secondary leading-relaxed italic text-center font-sans pt-1">
                Advance candidates down the funnel by clicking status targets. System logging is triggered automatically.
              </p>
            </div>

            {/* Tabs details panel */}
            <div className="bg-white rounded-2xl border border-natural-border shadow-xs p-6 space-y-5">
              
              {/* Personal details info list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-natural-border-light text-sm">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Email Address</div>
                  <div className="text-natural-dark font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-natural-secondary" /> {selectedCandidate.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Phone contact</div>
                  <div className="text-natural-dark font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-natural-secondary" /> {selectedCandidate.phone || "Not specified"}
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-[10px] font-bold text-natural-secondary uppercase tracking-wider">Education Credentials</div>
                  <div className="text-natural-dark font-bold font-serif flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-4 h-4 text-natural-primary" /> {selectedCandidate.education || "No education history filed"}
                  </div>
                </div>
              </div>

              {/* Technical skills tags */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary">Associated Skills & Tech Stack</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-natural-sidebar text-natural-primary font-bold text-xs rounded-lg border border-natural-border">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cover letter panel */}
              {selectedCandidate.coverLetter && (
                <div className="space-y-2 pt-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary">Cover Letter Introduction</label>
                  <p className="bg-[#fcfaf7] border border-natural-border rounded-xl p-4 text-xs font-sans text-natural-dark leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                    {selectedCandidate.coverLetter}
                  </p>
                </div>
              )}

              {/* Resume plain text submission */}
              {selectedCandidate.resumeText && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary">Dossier Resume Text</label>
                    <span className="text-[10px] text-natural-secondary font-mono">Structured Text View</span>
                  </div>
                  <pre className="bg-natural-dark text-[#eef3f0] font-mono text-[10px] p-4 rounded-xl leading-relaxed max-h-64 overflow-y-auto overflow-x-auto whitespace-pre-wrap">
                    {selectedCandidate.resumeText}
                  </pre>
                </div>
              )}
            </div>

            {/* Recruiter active timeline commentary notes */}
            <div className="bg-white rounded-2xl border border-natural-border shadow-xs p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-natural-secondary">Evaluation Notes & Audit Logs</h4>
              
              {/* Note creator form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record your remarks, interview evaluation, or task rating..."
                  rows={2}
                  className="w-full bg-natural-sidebar/40 hover:bg-natural-sidebar/20 focus:bg-white border border-natural-border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark font-sans"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-natural-primary hover:bg-natural-primary-hover disabled:bg-gray-300 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    Add Evaluation Note
                  </button>
                </div>
              </form>

              {/* Notes timeline list */}
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {selectedCandidate.notes.length === 0 ? (
                  <div className="text-center text-xs text-natural-secondary p-4 italic font-sans">
                    No notations recorded yet. Use the pane above to register candidate reviews.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCandidate.notes.map((note: CandidateNote) => {
                      const isSystem = note.author === "System Audit Log";
                      return (
                        <div key={note.id} className={`p-3 rounded-xl border relative ${isSystem ? "bg-[#fdf9f2] border-[#ebdbf5] text-[#916b3d]" : "bg-white border-natural-border"}`}>
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className={`font-serif font-bold ${isSystem ? "text-[#916b3d]" : "text-natural-dark"}`}>
                              {note.author}
                            </span>
                            <span className="text-natural-secondary font-sans">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <p className={`text-xs font-sans leading-relaxed ${isSystem ? "text-[#916b3d] italic" : "text-natural-dark"}`} style={{ wordBreak: 'break-word' }}>
                            {note.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
