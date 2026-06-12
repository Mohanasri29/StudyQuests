import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Global types for our in-memory multi-user simulation
interface User {
  uid: string;
  username: string;
  avatar: string;
  status: "idle" | "studying" | "distracted" | "sleeping" | "empty";
  studyTimeHrs: number;
  weeklyHrs: number;
  monthlyHrs: number;
  score: number;
  joinedAt: number;
}

interface Challenge {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  targetUsername: string; // Either a specific username or "any"
  status: "pending" | "accepted" | "declined" | "active" | "completed";
  accepterId: string | null;
  accepterName: string | null;
  accepterAvatar: string | null;
  durationMinutes: number;
  title: string;
  category: string;
  createdAt: number;
  startTime?: number;
  elapsedSeconds?: number;
}

// In-Memory Database to support continuous real-time state synchronization
const users: Record<string, User> = {};
const challenges: Challenge[] = [];

// Seed 5 active, live mock students so the platform feels populated from start
const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
];

const seedMockStudents = () => {
  const mockNames = ["AlexStudy", "Sophia_CS", "MarcusCode", "Emily_Bio", "Jordan_Math"];
  const categories = ["Computer Science", "Biochemistry", "Data Structures", "Pre-Calculus", "World History"];
  const startTimes = [36.5, 22.8, 14.2, 8.5, 4.0];

  mockNames.forEach((name, i) => {
    const mockId = `mock-student-${i}`;
    users[mockId] = {
      uid: mockId,
      username: name,
      avatar: MOCK_AVATARS[i],
      status: Math.random() > 0.3 ? "studying" : "distracted",
      studyTimeHrs: startTimes[i],
      weeklyHrs: startTimes[i] * 0.7,
      monthlyHrs: startTimes[i] * 1.5,
      score: Math.round(startTimes[i] * 85),
      joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 10 // Joined 10 days ago
    };

    // Add some pre-existing completed and active challenges to the board
    if (i < 3) {
      challenges.push({
        id: `challenge-hist-${i}`,
        creatorId: mockId,
        creatorName: name,
        creatorAvatar: MOCK_AVATARS[i],
        targetUsername: "any",
        status: i === 0 ? "active" : "completed",
        accepterId: i === 0 ? null : "mock-student-4",
        accepterName: i === 0 ? null : "Jordan_Math",
        accepterAvatar: i === 0 ? null : MOCK_AVATARS[4],
        durationMinutes: 45 + (i * 15),
        title: `Beat My Speed Study in ${categories[i]}`,
        category: categories[i],
        createdAt: Date.now() - 1000 * 60 * 60 * i,
        startTime: i === 0 ? Date.now() - 1000 * 60 * 15 : undefined,
        elapsedSeconds: i === 0 ? 900 : undefined
      });
    }
  });
};

seedMockStudents();

// Initialize the backend app
async function buildApp() {
  const app = express();
  const PORT = 3000;

  // Let Express parse JSON payloads up to 10MB to accept webcam snapshot frames
  app.use(express.json({ limit: "10mb" }));

  // Initialize server-side Gemini client
  let ai: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is not defined.");
  }

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create or sync user profile
  app.post("/api/users", (req, res) => {
    const { uid, username, avatar } = req.body;
    if (!uid || !username) {
      return res.status(400).json({ error: "UID and username are required" });
    }

    if (!users[uid]) {
      // Create user
      users[uid] = {
        uid,
        username,
        avatar: avatar || "assets/avatar-default.png",
        status: "idle",
        studyTimeHrs: 0,
        weeklyHrs: 0,
        monthlyHrs: 0,
        score: 0,
        joinedAt: Date.now()
      };
    } else {
      // Update existing
      users[uid].username = username;
      if (avatar) users[uid].avatar = avatar;
    }
    res.json(users[uid]);
  });

  // Get active users & leaderboard
  app.get("/api/users", (req, res) => {
    res.json(Object.values(users));
  });

  // Update study status & score increments
  app.post("/api/users/status", (req, res) => {
    const { uid, status, incrementHrs, scoreDelta } = req.body;
    if (!uid || !users[uid]) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const user = users[uid];
    if (status) user.status = status;
    if (typeof incrementHrs === "number") {
      user.studyTimeHrs += incrementHrs;
      user.weeklyHrs += incrementHrs;
      user.monthlyHrs += incrementHrs;
    }
    if (typeof scoreDelta === "number") {
      user.score = Math.max(0, user.score + scoreDelta);
    }

    res.json(user);
  });

  // Fetch all challenges
  app.get("/api/challenges", (req, res) => {
    // Process periodically to simulate mock students changing timers & accepting
    const now = Date.now();
    challenges.forEach((ch) => {
      if (ch.status === "active" && ch.startTime) {
        const elapsed = Math.floor((now - ch.startTime) / 1000);
        ch.elapsedSeconds = elapsed;
        const targetSeconds = ch.durationMinutes * 60;
        if (elapsed >= targetSeconds) {
          ch.status = "completed";
          // Distribute simulation score
          if (users[ch.creatorId]) {
            users[ch.creatorId].studyTimeHrs += ch.durationMinutes / 60;
            users[ch.creatorId].score += ch.durationMinutes * 2;
            users[ch.creatorId].status = "idle";
          }
          if (ch.accepterId && users[ch.accepterId]) {
            users[ch.accepterId].studyTimeHrs += ch.durationMinutes / 60;
            users[ch.accepterId].score += ch.durationMinutes * 2;
            users[ch.accepterId].status = "idle";
          }
        }
      }
    });

    res.json(challenges);
  });

  // Create a study challenge
  app.post("/api/challenges/create", (req, res) => {
    const { creatorId, targetUsername, durationMinutes, title, category } = req.body;
    if (!creatorId || !durationMinutes || !title) {
      return res.status(400).json({ error: "Creator ID, duration, and title are required" });
    }

    const creator = users[creatorId];
    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    const isSelfStudy = targetUsername === "self";

    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      creatorId,
      creatorName: creator.username,
      creatorAvatar: creator.avatar,
      targetUsername: targetUsername || "any",
      status: isSelfStudy ? "active" : "pending",
      accepterId: isSelfStudy ? "self-proctor" : null,
      accepterName: isSelfStudy ? "AI Proctor Assistant" : null,
      accepterAvatar: isSelfStudy ? "https://cdn-icons-png.flaticon.com/512/4712/4712109.png" : null,
      durationMinutes: Number(durationMinutes),
      title,
      category: category || "General",
      createdAt: Date.now(),
      startTime: isSelfStudy ? Date.now() : undefined,
      elapsedSeconds: isSelfStudy ? 0 : undefined
    };

    challenges.push(newChallenge);
    creator.status = "studying";

    // Auto-respond for simulation if targeted at a mock student
    if (targetUsername && targetUsername !== "any" && targetUsername !== "self") {
      const matchMock = Object.values(users).find(u => u.username.toLowerCase() === targetUsername.toLowerCase() && u.uid.startsWith("mock-student"));
      if (matchMock) {
        setTimeout(() => {
          newChallenge.status = "accepted";
          newChallenge.accepterId = matchMock.uid;
          newChallenge.accepterName = matchMock.username;
          newChallenge.accepterAvatar = matchMock.avatar;
          newChallenge.startTime = Date.now();
          newChallenge.elapsedSeconds = 0;
          matchMock.status = "studying";
        }, 3000);
      }
    }

    res.json(newChallenge);
  });

  // Accept a challenge
  app.post("/api/challenges/accept", (req, res) => {
    const { challengeId, accepterId } = req.body;
    if (!challengeId || !accepterId) {
      return res.status(400).json({ error: "Challenge ID and Accepter ID are required" });
    }

    const ch = challenges.find(c => c.id === challengeId);
    const accepter = users[accepterId];

    if (!ch) return res.status(404).json({ error: "Challenge not found" });
    if (!accepter) return res.status(404).json({ error: "Accepter not found" });

    ch.status = "active";
    ch.accepterId = accepterId;
    ch.accepterName = accepter.username;
    ch.accepterAvatar = accepter.avatar;
    ch.startTime = Date.now();
    ch.elapsedSeconds = 0;

    accepter.status = "studying";
    if (users[ch.creatorId]) {
      users[ch.creatorId].status = "studying";
    }

    res.json(ch);
  });

  // Decline a challenge
  app.post("/api/challenges/decline", (req, res) => {
    const { challengeId } = req.body;
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch) return res.status(404).json({ error: "Challenge not found" });

    ch.status = "declined";
    res.json(ch);
  });

  // Complete/End study session challenge early
  app.post("/api/challenges/complete", (req, res) => {
    const { challengeId, completerId } = req.body;
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch) return res.status(404).json({ error: "Challenge not found" });

    ch.status = "completed";
    
    // Distribute fractional hours completed
    const sessionTimeSec = ch.elapsedSeconds || 0;
    const sessionTimeHrs = sessionTimeSec / 3600;
    const computedPoints = Math.round(sessionTimeSec / 15); // 1 point per 15 secs of focus

    if (users[ch.creatorId]) {
      users[ch.creatorId].studyTimeHrs += sessionTimeHrs;
      users[ch.creatorId].weeklyHrs += sessionTimeHrs;
      users[ch.creatorId].monthlyHrs += sessionTimeHrs;
      users[ch.creatorId].score += computedPoints;
      users[ch.creatorId].status = "idle";
    }

    if (ch.accepterId && users[ch.accepterId]) {
      users[ch.accepterId].studyTimeHrs += sessionTimeHrs;
      users[ch.accepterId].weeklyHrs += sessionTimeHrs;
      users[ch.accepterId].monthlyHrs += sessionTimeHrs;
      users[ch.accepterId].score += computedPoints;
      users[ch.accepterId].status = "idle";
    }

    res.json({ success: true, pointsAwarded: computedPoints, hoursTracked: sessionTimeHrs });
  });

  // Accept a Random Challenge matching service
  app.post("/api/challenges/random", (req, res) => {
    const { userId } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    // Look for an open "any" challenge created by someone else that is pending
    const openChallenge = challenges.find(c => c.targetUsername === "any" && c.status === "pending" && c.creatorId !== userId);

    if (openChallenge) {
      openChallenge.status = "active";
      openChallenge.accepterId = userId;
      openChallenge.accepterName = user.username;
      openChallenge.accepterAvatar = user.avatar;
      openChallenge.startTime = Date.now();
      openChallenge.elapsedSeconds = 0;

      user.status = "studying";
      if (users[openChallenge.creatorId]) {
        users[openChallenge.creatorId].status = "studying";
      }

      return res.json({ matched: true, challenge: openChallenge });
    }

    // No existing pending challenge? Let's pair them up with a random active mock student who will "issue" a challenge!
    const mockStudent = Object.values(users).find(u => u.uid.startsWith("mock-student") && u.status !== "studying");
    const categories = ["Data Structures", "Algorithms", "Chemistry Lab", "Calculus III", "Creative Writing", "Quiet Focus"];
    const randCategory = categories[Math.floor(Math.random() * categories.length)];
    const randDuration = [25, 45, 60, 90][Math.floor(Math.random() * 4)];

    const mockName = mockStudent ? mockStudent.username : "StudyCompanion";
    const mockAvatar = mockStudent ? mockStudent.avatar : MOCK_AVATARS[0];
    const mockId = mockStudent ? mockStudent.uid : "mock-student-0";

    const simulatedChallenge: Challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      creatorId: mockId,
      creatorName: mockName,
      creatorAvatar: mockAvatar,
      targetUsername: "any",
      status: "active",
      accepterId: userId,
      accepterName: user.username,
      accepterAvatar: user.avatar,
      durationMinutes: randDuration,
      title: `Simultaneous Focus: ${randCategory} Challenge`,
      category: randCategory,
      createdAt: Date.now(),
      startTime: Date.now(),
      elapsedSeconds: 0
    };

    challenges.push(simulatedChallenge);
    user.status = "studying";
    if (mockStudent) {
      mockStudent.status = "studying";
    }

    res.json({ matched: true, challenge: simulatedChallenge });
  });

  // --- GEMINI ENDPOINTS ---

  // Chatbot Assistant explaining app and giving guidance
  app.post("/api/gemini/chat", async (req, res) => {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not defined
      return res.json({
        text: "Hi there! I am the Study Companion. It seems the system is in local preview mode without a Gemini API Key. To activate my full AI capabilities, please configure a `GEMINI_API_KEY` in settings. For now, let me tell you that this Online Study Challenges app allows you to create live focus challenges, compete with mock or real classmates around the world, track your visual attention using your webcam proctor, and level up the leaderboard!"
      });
    }

    try {
      // Construct a tailored system instruction
      const systemInstruction = 
        "You are 'Prodo', the friendly AI Study Proctor & Advisor. You assist students on the 'Online Study Challenges' website. " +
        "Explain that website features include: " +
        "1. Login Page, where users set up custom usernames. " +
        "2. Custom Focus Challenges where you can challenge friends by username or participate in random community challenges. " +
        "3. A live timer that runs as they study to accumulate hours and points. " +
        "4. AI Web Proctoring: The application uses their web camera (with permission) to run visual attention analysis on their study screen! We flag and alert them when they display sleeping, playing on phone, empty desk (missing), or talking, and keep stats. " +
        "5. Global Leaderboard with reward ranks. " +
        "Give actionable, inspiring study tips (Pomodoro technique, active recall), and maintain an excited, pro-wellness, non-judgmental tone!";

      // Convert history format if present, otherwise just generate
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      res.status(500).json({ error: err.message || "Failed to contact Gemini" });
    }
  });

  // AI Visual Monitoring: Evaluates study attention from webcam frame
  app.post("/api/gemini/monitor", async (req, res) => {
    const { imageBase64, username } = req.body;

    if (!ai) {
      // Return beautiful, randomized proctoring simulation if API key is not defined
      const states: Array<"studying" | "distracted" | "sleeping" | "empty"> = ["studying", "studying", "distracted", "empty"];
      const randStatus = states[Math.floor(Math.random() * states.length)];
      const templates = {
        studying: {
          status: "studying",
          reason: "Focused on study screen or taking handwritten notes.",
          score: 95,
          tip: "Excellent posture. Keep up the good learning flow!"
        },
        distracted: {
          status: "distracted",
          reason: "Detected eyes straying or looking down repeatedly (simulating phone/device distractions).",
          score: 60,
          tip: "Turn off distractions and place your phone in another room."
        },
        sleeping: {
          status: "sleeping",
          reason: "Lowered head or closed eyes detected for an extended duration.",
          score: 20,
          tip: "Try standing up, drinking a glass of cold water, or doing stretching exercises."
        },
        empty: {
          status: "empty",
          reason: "Student has moved out of camera field of view.",
          score: 10,
          tip: "Return to your study desk to resume accumulating leaderboard points."
        }
      };

      return res.json(templates[randStatus]);
    }

    try {
      if (!imageBase64) {
        return res.status(400).json({ error: "Webcam image frame is required for analysis." });
      }

      // Format visual input for Gemini API
      // imageBase64 can contain the data url prefix, strip it if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      };

      const promptText = `Analyze this webcam snapshot of student ${username || "User"} who is currently in a live timed study challenge. ` +
        `Your task is to accurately proctor and classify their current visual attention state into exactly one of: status: "studying", "distracted" (e.g. holding a mobile phone, texting, looking elsewhere, talking), "sleeping", or "empty" (no student visible in front of desk). ` +
        `Provide a reason explaining the classification, an integer concentration score between 0 and 100, and a supportive actionable tip. ` +
        `Return your response as a valid JSON object matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: promptText }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "The proctored classification. Must be exactly 'studying', 'distracted', 'sleeping', or 'empty'."
              },
              reason: {
                type: Type.STRING,
                description: "A short human explanation of what was visually detected (e.g. 'Writing on a notepad', 'Checking smartphone', 'Dozing off on desk')."
              },
              score: {
                type: Type.INTEGER,
                description: "Focus/concentration score from 0 up to 100."
              },
              tip: {
                type: Type.STRING,
                description: "A friendly, constructive tip encouraging focus or workspace optimization."
              }
            },
            required: ["status", "reason", "score", "tip"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);

    } catch (err: any) {
      console.error("Gemini Visual Monitor Error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze study snap" });
    }
  });


  // --- Vite & Production Static Files Serving Configuration ---

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast development bundling
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static delivery
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Online Study Challenges server running on http://0.0.0.0:${PORT}`);
  });
}

buildApp().catch((err) => {
  console.error("Fatal: failed to boostrap custom Express server:", err);
  process.exit(1);
});
