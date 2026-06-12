export interface User {
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

export interface Challenge {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  targetUsername: string;
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

export interface ProctorAnalysis {
  status: "studying" | "distracted" | "sleeping" | "empty";
  reason: string;
  score: number;
  tip: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}
