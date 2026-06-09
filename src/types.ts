export interface CandidateNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export type CandidateStatus = "Applied" | "Screening" | "Interviewing" | "Offer" | "Rejected";

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  skills: string[];
  education: string;
  coverLetter: string;
  resumeText: string;
  resumeFileName: string;
  resumeFileBase64?: string;
  status: CandidateStatus;
  notes: CandidateNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Recruiter {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthState {
  token: string | null;
  recruiter: Recruiter | null;
  loading: boolean;
  error: string | null;
}
