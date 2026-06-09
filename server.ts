import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers with limits for PDF/text base64 uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  const DATA_DIR = path.join(process.cwd(), "data");
  const RECRUITERS_FILE = path.join(DATA_DIR, "recruiters.json");
  const CANDIDATES_FILE = path.join(DATA_DIR, "candidates.json");

  // Helper functions to read files safely
  async function readRecruiters() {
    try {
      const data = await fs.readFile(RECRUITERS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading recruiters file", e);
      return [];
    }
  }

  async function readCandidates() {
    try {
      const data = await fs.readFile(CANDIDATES_FILE, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading candidates file, returning fallback list", e);
      return [];
    }
  }

  async function writeCandidates(candidates: any[]) {
    try {
      await fs.writeFile(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing candidates file", e);
      throw new Error("Failed to write to database");
    }
  }

  // Token verify middleware
  async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    
    // In our simplified system, we check token format: "rec_token_[recruiterEmail]"
    if (token && token.startsWith("rec_token_")) {
      const email = token.replace("rec_token_", "");
      const recruiters = await readRecruiters();
      const recruiter = recruiters.find((r: any) => r.email === email);
      if (recruiter) {
        (req as any).recruiter = recruiter;
        return next();
      }
    }
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Recruiter Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const recruiters = await readRecruiters();
    const recruiter = recruiters.find(
      (r: any) => r.email.toLowerCase() === email.toLowerCase() && r.password === password
    );

    if (!recruiter) {
      return res.status(401).json({ error: "Invalid credentials. Please use 'recruiter@company.com' & 'Password123'" });
    }

    // Generate a simple, secure looking session token
    const token = `rec_token_${recruiter.email}`;

    // Return profile without sensitive password
    const { password: _, ...cleanProfile } = recruiter;

    res.json({
      success: true,
      token,
      recruiter: cleanProfile
    });
  });

  // Get active session profile (rehydrate auth state)
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const { password: _, ...cleanProfile } = (req as any).recruiter;
    res.json({ recruiter: cleanProfile });
  });

  // PUBLIC ENDPOINT: Submit candidate application
  app.post("/api/candidates", async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        position,
        experience,
        skills,
        education,
        coverLetter,
        resumeText,
        resumeFileName,
        resumeFileBase64
      } = req.body;

      if (!fullName || !email || !position) {
        return res.status(400).json({ error: "Name, email, and target position are required fields." });
      }

      // Read current candidates list
      const candidates = await readCandidates();

      // Check if email already applied for the same position to avoid spamming
      const existing = candidates.find(
        (c: any) => c.email.toLowerCase() === email.toLowerCase() && c.position.toLowerCase() === position.toLowerCase()
      );
      if (existing) {
        return res.status(409).json({ error: `An application from ${email} for '${position}' already exists.` });
      }

      // Build safe and formatted candidate object
      let parsedSkills: string[] = [];
      if (Array.isArray(skills)) {
        parsedSkills = skills;
      } else if (typeof skills === "string") {
        parsedSkills = skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      const newCand = {
        id: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: (phone || "").trim(),
        position: position.trim(),
        experience: Number(experience) || 0,
        skills: parsedSkills,
        education: (education || "").trim(),
        coverLetter: (coverLetter || "").trim(),
        resumeText: (resumeText || "").trim(),
        resumeFileName: resumeFileName || "uploaded_resume.txt",
        resumeFileBase64: resumeFileBase64 || "",
        status: "Applied",
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      candidates.unshift(newCand); // Prepend new candidate so it appears on top of lists
      await writeCandidates(candidates);

      res.status(201).json({
        success: true,
        message: "Application submitted successfully!",
        candidateId: newCand.id
      });
    } catch (e: any) {
      console.error("Error submitting candidate", e);
      res.status(500).json({ error: "Server error occurred while inserting into database." });
    }
  });

  // SECURE RECRUITER ENDPOINT: Fetch all candidates
  app.get("/api/candidates", authMiddleware, async (req, res) => {
    try {
      const candidates = await readCandidates();
      res.json(candidates);
    } catch (e) {
      res.status(500).json({ error: "Failed to load candidate roster." });
    }
  });

  // SECURE RECRUITER ENDPOINT: Fetch specific candidate
  app.get("/api/candidates/:id", authMiddleware, async (req, res) => {
    try {
      const candidates = await readCandidates();
      const cand = candidates.find((c: any) => c.id === req.params.id);
      if (!cand) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }
      res.json(cand);
    } catch (e) {
      res.status(500).json({ error: "Failed to load candidate information." });
    }
  });

  // SECURE RECRUITER ENDPOINT: Update candidate status
  app.patch("/api/candidates/:id/status", authMiddleware, async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["Applied", "Screening", "Interviewing", "Offer", "Rejected"];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }

      const candidates = await readCandidates();
      const candIndex = candidates.findIndex((c: any) => c.id === req.params.id);
      
      if (candIndex === -1) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }

      const oldStatus = candidates[candIndex].status;
      const recruiterName = (req as any).recruiter.fullName || "Recruiter";

      // Update basic details
      candidates[candIndex].status = status;
      candidates[candIndex].updatedAt = new Date().toISOString();

      // Formulate automated system audit note
      const systemNote = {
        id: `note_sys_${Date.now()}`,
        text: `⚠️ Status changed from [${oldStatus}] to [${status}] by recruiter.`,
        author: "System Audit Log",
        createdAt: new Date().toISOString()
      };

      candidates[candIndex].notes.unshift(systemNote); // add system note on top

      await writeCandidates(candidates);
      res.json(candidates[candIndex]);
    } catch (e) {
      res.status(500).json({ error: "Failed to update candidate state." });
    }
  });

  // SECURE RECRUITER ENDPOINT: Append recruiter commentary note
  app.post("/api/candidates/:id/notes", authMiddleware, async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Commentary text cannot be blank." });
      }

      const candidates = await readCandidates();
      const candIndex = candidates.findIndex((c: any) => c.id === req.params.id);

      if (candIndex === -1) {
        return res.status(404).json({ error: "Candidate profile not found." });
      }

      const recruiterName = (req as any).recruiter.fullName || "Sarah Jenkins";

      const newNote = {
        id: `note_${Date.now()}`,
        text: text.trim(),
        author: recruiterName,
        createdAt: new Date().toISOString()
      };

      candidates[candIndex].notes.unshift(newNote); // latest notes on top
      candidates[candIndex].updatedAt = new Date().toISOString();

      await writeCandidates(candidates);
      res.json(candidates[candIndex]);
    } catch (e) {
      res.status(500).json({ error: "Failed to append commentary note." });
    }
  });

  // SECURE RECRUITER ENDPOINT: Download candidate data as a custom PDF/text mock
  app.get("/api/candidates/:id/resume/download", authMiddleware, async (req, res) => {
    try {
      const candidates = await readCandidates();
      const cand = candidates.find((c: any) => c.id === req.params.id);
      
      if (!cand) {
        return res.status(404).send("File not found");
      }

      // If they uploaded reference base64 data, we can stream that. Else, construct a structured resume download
      if (cand.resumeFileBase64 && cand.resumeFileBase64.includes(";base64,")) {
        const parts = cand.resumeFileBase64.split(";base64,");
        const contentType = parts[0].split(":")[1] || "application/octet-stream";
        const buffer = Buffer.from(parts[1], "base64");
        
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${cand.resumeFileName || 'resume.pdf'}"`);
        return res.send(buffer);
      }

      // Default: generate structured text resume
      const textOutput = `=========================================
CANDIDATE APPLICATION DOCUMENT
=========================================
Full Name:     ${cand.fullName}
Email:         ${cand.email}
Phone:         ${cand.phone}
Applied for:   ${cand.position}
Experience:    ${cand.experience} Years
Education:     ${cand.education}
Submission:    ${new Date(cand.createdAt).toLocaleString()}
Status:        ${cand.status}

-----------------------------------------
CORE SKILLS INVENTORY
-----------------------------------------
${cand.skills.map((s: string) => `• ${s}`).join("\n")}

-----------------------------------------
COVER LETTER SUMMARY
-----------------------------------------
${cand.coverLetter || "No cover letter provided."}

-----------------------------------------
RAW RESUME TEXT SUBMISSION
-----------------------------------------
${cand.resumeText || "No plain text resume supplied."}
`;
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${cand.fullName.replace(/\s+/g, '_')}_Resume_Dossier.txt"`);
      res.send(textOutput);
    } catch (e) {
      res.status(500).send("Database loading exception occurred.");
    }
  });


  // --- VITE MIDDLEWARE SETUP / STATIC DISTRIBUTION SERVING ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA router fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RECRUIT-SERVER] Success: Running on port http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error booting full-stack server:", err);
});
