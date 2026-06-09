import React, { useState, useRef } from "react";
import { 
  Briefcase, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Award, 
  UploadCloud, 
  CheckCircle2, 
  ArrowLeft, 
  Plus, 
  X, 
  Send 
} from "lucide-react";
import { animate, motion } from "motion/react";

interface CandidatePortalProps {
  onBack: () => void;
}

const PRESET_OPENINGS = [
  "Frontend Engineer",
  "Full Stack Developer",
  "Product Manager",
  "Data Analyst",
  "UX Designer"
];

const PRESET_SKILLS: Record<string, string[]> = {
  "Frontend Engineer": ["React", "TypeScript", "Tailwind CSS", "Redux", "Websockets", "Next.js", "Framer Motion"],
  "Full Stack Developer": ["Node.js", "React", "Express", "PostgreSQL", "MongoDB", "TypeScript", "Docker"],
  "Product Manager": ["Product Strategy", "Agile Roadmap", "SQL", "A/B Testing", "Mixpanel", "User Persona", "Scrum"],
  "Data Analyst": ["Python", "SQL", "Tableau", "Pandas", "Scikit-Learn", "Excel", "Data Visualization"],
  "UX Designer": ["Figma", "User Research", "Wireframing", "Prototyping", "A11y", "Adobe XD", "Framer"]
};

export default function CandidatePortal({ onBack }: CandidatePortalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: PRESET_OPENINGS[0],
    experience: 2,
    education: "",
    coverLetter: "",
    resumeText: ""
  });

  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeFileBase64, setResumeFileBase64] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill skills based on preselected position
  const applyPresetSkills = (pos: string) => {
    const presets = PRESET_SKILLS[pos] || [];
    setSkillsList(presets);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "position") {
      applyPresetSkills(value);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkill.trim() && !skillsList.includes(customSkill.trim())) {
      setSkillsList([...skillsList, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter(s => s !== skill));
  };

  // Convert uploaded resume to base64
  const processFile = (file: File) => {
    if (!file) return;
    setResumeFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setResumeFileBase64(result);
      
      // If it is a text-based file, write text content as resume text
      if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const textReader = new FileReader();
        textReader.onload = () => {
          setFormData(prev => ({ ...prev, resumeText: textReader.result as string }));
        };
        textReader.readAsText(file);
      } else {
        // Fallback placeholder text if non-readable text format
        setFormData(prev => ({ 
          ...prev, 
          resumeText: `# RESUME DOCUMENT ATTACHED: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nFormat: ${file.type || 'Binary'}\nUploaded on Candidate Portal.` 
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    // Basic Validation
    if (!formData.fullName.trim()) {
      setErrorStatus("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorStatus("Please specify your email address.");
      return;
    }
    if (skillsList.length === 0) {
      setErrorStatus("Please select or add at least one technical skill.");
      return;
    }
    if (!formData.resumeText.trim() && !resumeFileBase64) {
      setErrorStatus("Please supply your resume details, either by typing resume text or uploading a file.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          skills: skillsList,
          resumeFileName: resumeFileName || "web_entered_resume.txt",
          resumeFileBase64
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Submission failed. Please try again later.");
      }

      setSubmittedId(resData.candidateId || "NEW");
    } catch (err: any) {
      setErrorStatus(err.message || "An unexpected error occurred during state sync.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed initial values for skills on load
  React.useEffect(() => {
    applyPresetSkills(formData.position);
  }, []);

  if (submittedId) {
    return (
      <div id="application-success-window" className="max-w-xl mx-auto my-12 bg-white rounded-[2rem] border border-natural-border shadow-xs p-8 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e8f0e8] text-natural-primary mb-6 border border-natural-border">
          <CheckCircle2 className="w-8 h-8 font-semibold" />
        </div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-natural-dark mb-3">Application Received</h2>
        <p className="text-[#7a7a7a] mb-6 text-sm leading-relaxed">
          Thank you for applying, <span className="font-semibold text-natural-dark">{formData.fullName}</span>! Your digital dossier has been logged into our hiring pipeline database. Our evaluation panel will review your credentials for the <span className="font-semibold text-natural-dark">{formData.position}</span> opening.
        </p>
        <div className="bg-natural-sidebar rounded-2xl p-5 mb-8 text-left border border-natural-border">
          <div className="text-[10px] font-mono text-natural-secondary uppercase tracking-widest mb-3">Receipt Info</div>
          <div className="flex justify-between text-xs py-1.5 border-b border-natural-border-light">
            <span className="text-natural-secondary">Applicant ID:</span>
            <span className="font-mono text-natural-dark font-bold">{submittedId}</span>
          </div>
          <div className="flex justify-between text-xs py-1.5 border-b border-natural-border-light">
            <span className="text-natural-secondary">Job Role:</span>
            <span className="text-natural-dark font-medium">{formData.position}</span>
          </div>
          <div className="flex justify-between text-xs py-1.5">
            <span className="text-natural-secondary">Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f0e8] text-natural-primary uppercase">Applied</span>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onMouseDown={onBack}
            className="px-5 py-2.5 bg-natural-primary hover:bg-natural-primary-hover text-white rounded-xl transition-all text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go back to hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="candidate-portal-form" className="max-w-3xl mx-auto my-8 bg-white rounded-[2rem] border border-natural-border shadow-xs overflow-hidden animate-fade-in">
      <div className="bg-natural-primary px-8 py-7 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-white">Apply for Vacancies</h2>
          <p className="text-[#f0eee9] text-xs mt-1.5 font-sans">Submit your professional dossier for instant panel evaluation</p>
        </div>
        <button
          onClick={onBack}
          className="text-natural-primary hover:text-natural-primary-hover bg-white hover:bg-natural-sidebar px-4 py-2 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-[#e8e4db]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {errorStatus && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm flex items-center gap-2 font-semibold">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping shrink-0"></span>
            {errorStatus}
          </div>
        )}

        {/* Section 1: Target Role */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Target Position</label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
            <select
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition font-medium text-natural-dark"
            >
              {PRESET_OPENINGS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Personal Dossier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="Elizabeth Bennet"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="email"
                name="email"
                required
                placeholder="elizabeth@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="tel"
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Professional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Academic Education</label>
            <div className="relative">
              <GraduationCap className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-secondary" />
              <input
                type="text"
                name="education"
                placeholder="B.S. in Computer Science, Harvard University"
                value={formData.education}
                onChange={handleInputChange}
                className="w-full bg-white border border-natural-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-natural-secondary">Related Experience</label>
              <span className="text-xs font-sans font-bold text-natural-primary bg-[#e8f0e8] px-2.5 py-0.5 rounded-full">{formData.experience} Years</span>
            </div>
            <div className="flex items-center gap-3 pt-3">
              <Award className="w-4 h-4 text-natural-secondary shrink-0" />
              <input
                type="range"
                name="experience"
                min="0"
                max="15"
                step="1"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full accent-natural-primary cursor-pointer h-1.5 bg-natural-sidebar rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Skills Inventory */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary">Skills & Tech Stack Inventory</label>
            <span className="text-xs text-[#a09e99] font-sans">Minimum 1 tag required</span>
          </div>

          {/* Preset trigger suggestions */}
          <div className="flex flex-wrap gap-1.5 p-3 bg-natural-sidebar rounded-xl border border-natural-border">
            {skillsList.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-natural-primary font-bold text-xs rounded-full border border-natural-border shadow-xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {skillsList.length === 0 && (
              <span className="text-xs text-natural-secondary italic">No skills selected yet. Select a position above or add one below.</span>
            )}
          </div>

          {/* Custom skill adder */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add additional skills (e.g. Docker, GraphQL, Figma)"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 bg-white border border-natural-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-4 py-2 bg-white hover:bg-natural-sidebar text-natural-primary text-xs font-bold rounded-xl border border-natural-border shadow-xs transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Tag
            </button>
          </div>
        </div>

        {/* Section 5: Cover Letter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Short Cover Letter</label>
          <textarea
            name="coverLetter"
            rows={4}
            maxLength={1000}
            placeholder="Tell us about yourself and why you're interested in applying..."
            value={formData.coverLetter}
            onChange={handleInputChange}
            className="w-full bg-white border border-natural-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary transition text-natural-dark leading-relaxed font-sans"
          />
        </div>

        {/* Section 6: Resume Upload */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary">CV / Resume Submission</label>
          
          {/* Uploader drag area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              isDragging ? "border-natural-primary bg-natural-sidebar text-natural-dark" : "border-natural-border bg-white hover:bg-natural-sidebar/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.md"
              className="hidden"
            />
            
            <UploadCloud className="w-10 h-10 text-natural-secondary mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-natural-dark">Drag & drop your resume file, or click to browse</h4>
            <p className="text-xs text-natural-secondary mt-1 font-sans">Supports PDF, DOCX, TXT, MD up to 10MB</p>

            {resumeFileName && (
              <div onClick={(e) => e.stopPropagation()} className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#e8f0e8] text-natural-primary text-xs font-bold rounded-lg border border-natural-border-light">
                <CheckCircle2 className="w-3.5 h-3.5 font-semibold text-natural-primary" />
                <span>File attached: <strong>{resumeFileName}</strong></span>
                <button
                  type="button"
                  onClick={() => { setResumeFileName(""); setResumeFileBase64(""); }}
                  className="text-natural-primary/75 hover:text-natural-primary ml-1 hover:bg-[#d8e8d8] p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-natural-secondary mb-2">Or paste resume details directly</label>
            <textarea
              name="resumeText"
              rows={6}
              placeholder="# YOUR NAME&#10;&#15;Professional Experience, Education details, certifications and past projects..."
              value={formData.resumeText}
              onChange={handleInputChange}
              className="w-full bg-white border border-natural-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-natural-primary focus:border-natural-primary font-mono text-natural-dark leading-relaxed"
            />
          </div>
        </div>

        {/* Submit action */}
        <div className="pt-4 border-t border-natural-border-light flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-white border border-natural-border text-natural-primary hover:bg-natural-sidebar rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-natural-primary hover:bg-natural-primary-hover disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
