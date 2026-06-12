import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Swords, Zap, Users, ShieldAlert, Plus, 
  BookOpen, Clock, Target, Sparkles, Check, Hourglass,
  ArrowLeft, Search, Calendar, ChevronRight, Award, 
  Activity, MessageSquare, Info, Shield, Send, Star,
  CheckCircle, AlertTriangle, Eye, ArrowUpRight, Flame, Globe
} from "lucide-react";
import { User, Challenge } from "../types";

interface ChallengeLobbyProps {
  currentUser: User;
  usersList: User[];
  challengesList: Challenge[];
  onAcceptChallenge: (challengeId: string) => void;
  onAcceptRandom: () => void;
  onCreateChallenge: (params: {
    title: string;
    category: string;
    durationMinutes: number;
    targetUsername: string;
  }) => void;
}

export default function ChallengeLobby({
  currentUser,
  usersList,
  challengesList,
  onAcceptChallenge,
  onAcceptRandom,
  onCreateChallenge
}: ChallengeLobbyProps) {
  // Navigation View modes
  // "select" = Main Dashboard (Grid of 10 structural cards with hover translation)
  // "self-study", "invite-friend", "random-challenges", "weekly", "monthly", "leaderboard", "rewards", "analytics", "chatbot", "about"
  const [viewMode, setViewMode] = useState<
    "select" | "self-study" | "invite-friend" | "random-challenges" | 
    "weekly" | "monthly" | "leaderboard" | "rewards" | "analytics" | "chatbot" | "about"
  >("select");
  
  // Custom states for Self-Study Setup
  const [selfTitle, setSelfTitle] = useState("Solitary Focus Core Sprint");
  const [selfCategory, setSelfCategory] = useState("Computer Science");
  const [selfDuration, setSelfDuration] = useState(25);
  const [selfGoal, setSelfGoal] = useState("Complete Chapter 4 Algorithms Exercises & take annotations");

  // Custom states for Invite Friend Setup
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [friendTitle, setFriendTitle] = useState("Direct Companion Challenge");
  const [friendCategory, setFriendCategory] = useState("Biochemistry");
  const [friendDuration, setFriendDuration] = useState(30);
  const [friendGoal, setFriendGoal] = useState("Solve molecular reaction dynamics");
  const [friendMessage, setFriendMessage] = useState("Join my study room! Let's get 45m of lock-step focus.");
  
  // Invitation flow statuses
  const [inviteStatus, setInviteStatus] = useState<"idle" | "sending" | "accepted" | "declined">("idle");
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const [declinedFriendName, setDeclinedFriendName] = useState("");

  const [activeGuideTab, setActiveGuideTab] = useState<"proctor" | "arena" | "reputation" | "start">("proctor");
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  // Broadcast modal states (still retained as backup quick actions)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science");
  const [newDuration, setNewDuration] = useState(25);
  const [customTarget, setCustomTarget] = useState("");

  // Leaderboard Tabs
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "weekly" | "monthly" | "alltime">("weekly");

  // Rewards states
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(["Warrior", "Focus"]);
  const [showBadgeUnlockAnimation, setShowBadgeUnlockAnimation] = useState<string | null>(null);
  const [scholarCoins, setScholarCoins] = useState(450);

  // Chatbot Assistant Inline Panel State
  const [botChatInput, setBotChatInput] = useState("");
  const [botChatHistory, setBotChatHistory] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    { sender: "bot", text: "Welcome! I am Prodo, your AI Study Advisor. I can help map custom Pomodoro schedules, explain weekly reputation milestones, or share deep visual proctor insights. What is your goal today?" }
  ]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Community Available Random Challenges
  const [randomChallengesSearch, setRandomChallengesSearch] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateChallenge({
      title: newTitle.trim() || "Elite Study Sprint",
      category: newCategory,
      durationMinutes: newDuration,
      targetUsername: customTarget.trim() || "any"
    });
    setShowCreateModal(false);
    setNewTitle("");
    setCustomTarget("");
  };

  // Solitary study launcher
  const handleLaunchSelfStudy = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateChallenge({
      title: selfTitle.trim() || "Solitary Focus Core Sprint",
      category: selfCategory,
      durationMinutes: selfDuration,
      targetUsername: "self"
    });
  };

  // Handle invitation submission (simulated friend acceptance)
  const handleSendFriendChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend) return;
    
    setInviteStatus("sending");
    
    // Simulate peer choosing to Accept or Decline based on outcome
    // (If user enters username containing "Decline" or random chance, simulation declines)
    const isMockFriend = selectedFriend.uid.startsWith("mock-student");
    const willDecline = selectedFriend.username.toLowerCase().includes("decline") || (Math.random() < 0.25);

    setTimeout(() => {
      if (willDecline) {
        setInviteStatus("declined");
        setDeclinedFriendName(selectedFriend.username);
        setShowDeclinePopup(true);
      } else {
        setInviteStatus("accepted");
        onCreateChallenge({
          title: friendTitle.trim() || `Study room with @${selectedFriend.username}`,
          category: friendCategory,
          durationMinutes: friendDuration,
          targetUsername: selectedFriend.username
        });
        
        // Return view Mode back
        setTimeout(() => {
          setInviteStatus("idle");
          setSelectedFriend(null);
          setViewMode("select");
        }, 1500);
      }
    }, 2800);
  };

  // Unlock visual reward badge trigger
  const testUnlockBadge = (badgeKey: string, title: string) => {
    if (unlockedAchievements.includes(badgeKey)) return;
    setShowBadgeUnlockAnimation(title);
    setUnlockedAchievements((prev) => [...prev, badgeKey]);
    setScholarCoins((prev) => prev + 150);
    setTimeout(() => {
      setShowBadgeUnlockAnimation(null);
    }, 4000);
  };

  // Bot response simulator
  const handleBotChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botChatInput.trim()) return;

    const userMsg = botChatInput.trim();
    setBotChatHistory((prev) => [...prev, { sender: "user", text: userMsg }]);
    setBotChatInput("");
    setIsBotThinking(true);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMsg })
      });
      if (response.ok) {
        const data = await response.json();
        setBotChatHistory((prev) => [...prev, { sender: "bot", text: data.text }]);
      } else {
        throw new Error();
      }
    } catch {
      setBotChatHistory((prev) => [...prev, { sender: "bot", text: "I apologize, scholar! System signal lost. Remember to stay hydrated and target 25-minute study intervals to maximize cognitive recall!" }]);
    } finally {
      setIsBotThinking(false);
    }
  };

  const selectBotChip = (text: string) => {
    setBotChatInput(text);
  };

  // Filter pending/available random lobbies
  const pendingChallenges = challengesList.filter(
    (c) => c.status === "pending" && c.creatorId !== currentUser.uid
  );

  // Active / my linked sessions
  const activeChallenges = challengesList.filter(
    (c) => 
      c.status === "active" && 
      (c.creatorId === currentUser.uid || c.accepterId === currentUser.uid)
  );

  // Mock scholars for friend search query
  const searchableUsers = usersList.filter((u) => u.uid !== currentUser.uid);
  const matchedFriends = searchableUsers.filter((u) => 
    u.username.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
    u.status.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  // Filter leaderboard users
  const sortedLeaderboard = [...usersList].sort((a, b) => b.score - a.score);

  // Simulated Weekly Challenges Static Progress
  const weeklySprints = [
    { id: 1, text: "Study 15 Hours Inside Live Battle Rooms", curr: 11.5, target: 15, unit: "hours", xp: 250, claimed: false },
    { id: 2, text: "Complete 5 Focus Sessions with Visual Proctor Active", curr: 4, target: 5, unit: "sessions", xp: 150, claimed: true },
    { id: 3, text: "Maintain 80% Average Visual Attention Score", curr: 86, target: 80, unit: "% score", xp: 300, claimed: false },
    { id: 4, text: "Join 3 Peer Study Battles from Live Lobbies", curr: 2, target: 3, unit: "sprints", xp: 200, claimed: false }
  ];

  // Monthly Quest Lists
  const monthlyQuests = [
    { id: "m1", text: "Study 100 Hours Monthly Accumulator", curr: 42.5, target: 100, xp: 1000, points: 500 },
    { id: "m2", text: "Win 10 Real-time Study Battles", curr: 7, target: 10, xp: 500, points: 250 },
    { id: "m3", text: "Reach Top 10 on the Global Vanguard Board", curr: 6, target: 10, rankTask: true, xp: 600, points: 300 },
    { id: "m4", text: "Maintain a 30-Day continuous study streak", curr: 18, target: 30, xp: 800, points: 400 }
  ];

  // Podium Mock Data for daily, weekly, monthly
  const getPodiumData = () => {
    if (leaderboardTab === "daily") {
      return {
        first: { name: "Sophia_CS", hrs: 6.8, score: 98, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        second: { name: "AlexStudy", hrs: 5.2, score: 91, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
        third: { name: "MarcusCode", hrs: 4.8, score: 88, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      };
    } else if (leaderboardTab === "weekly") {
      return {
        first: { name: "AlexStudy", hrs: 36.5, score: 95, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
        second: { name: "Sophia_CS", hrs: 28.2, score: 94, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        third: { name: "MarcusCode", hrs: 22.8, score: 90, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" }
      };
    } else if (leaderboardTab === "monthly") {
      return {
        first: { name: "Sophia_CS", hrs: 124.5, score: 97, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        second: { name: "AlexStudy", hrs: 112.8, score: 93, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
        third: { name: "Emily_Bio", hrs: 94.2, score: 91, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" }
      };
    } else {
      return {
        first: { name: "Vanguard_Legend", hrs: 880.0, score: 99, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80" },
        second: { name: "Sophia_CS", hrs: 450.2, score: 96, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
        third: { name: "AlexStudy", hrs: 390.5, score: 94, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" }
      };
    }
  };

  const podium = getPodiumData();

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 md:px-8">
      
      {/* BADGE UNLOCKED SUCCESS BANNER IN OVERLAY */}
      <AnimatePresence>
        {showBadgeUnlockAnimation && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          >
            <div className="bg-[#0D0D0D] border-2 border-[#AD974F] p-8 text-center max-w-sm w-full space-y-4 shadow-[0_0_30px_rgba(173,151,79,0.4)]">
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 1, repeat: 2 }}
                className="w-20 h-20 bg-[#AD974F]/10 border border-[#AD974F] text-[#AD974F] rounded-full flex items-center justify-center mx-auto"
              >
                <Award className="w-12 h-12" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#AD974F]">REPUTATION MILESTONE UNLOCKED</p>
                <h3 className="text-xl font-serif text-white">{showBadgeUnlockAnimation}</h3>
                <p className="text-[11px] text-stone-400">Awarded to scholars demonstrating focused eye levels and consistent attention scans.</p>
              </div>
              <div className="bg-[#1A1A1A] p-2 border border-[#222] text-[10px] font-mono text-[#AD974F] flex justify-between items-center px-4">
                <span>REWARD CREDITS:</span>
                <span>+150 Coins & +200 XP</span>
              </div>
              <button 
                onClick={() => setShowBadgeUnlockAnimation(null)}
                className="px-6 py-2 bg-[#AD974F] text-black text-xs font-mono font-bold uppercase hover:bg-[#C5AE6A] tracking-wider w-full"
              >
                Claim Honor Badge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPACT TOP SYSTEM MANUAL ON BOARD */}
      {showHowItWorks && viewMode === "select" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 relative overflow-hidden shadow-2xl rounded-none light-card">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#AD974F]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222]/80 pb-4 mb-5">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">🕹️ STUDY COMMAND CENTER</p>
              <h2 className="text-lg font-serif mt-1">Co-op Campaign Quest Logs & AI Proctor Tactics</h2>
              <p className="text-slate-300 text-xs mt-0.5">Select a strategy handbook module to master your attention focus stats!</p>
            </div>
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="text-[9px] uppercase font-mono tracking-widest font-extrabold text-[#AD974F] hover:text-white transition duration-150 border border-indigo-500/20 hover:border-[#AD974F] bg-slate-950 px-3 py-1.5 self-start md:self-auto hover:cursor-pointer rounded-lg"
            >
              Minimize Handbook [ESC]
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { id: "proctor", label: "🛡️ Visual Proctor", desc: "Vision snapshot eye tracking" },
              { id: "arena", label: "⚔️ Peer Split Rooms", desc: "Lockstep study spaces" },
              { id: "reputation", label: "🏆 Honor Ledger", desc: "Milestones & verified XP" },
              { id: "start", label: "⚡ Quick Instructions", desc: "Sprints in 3 simple steps" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveGuideTab(t.id as any)}
                type="button"
                className={`py-2 px-3 text-left border transition-all duration-200 cursor-pointer ${
                  activeGuideTab === t.id 
                    ? "bg-[#AD974F]/10 border-[#AD974F] text-white" 
                    : "bg-[#050505] border-[#222] text-slate-400 hover:border-stone-500 hover:text-stone-200"
                }`}
              >
                <div className="text-[10px] font-mono font-bold tracking-wider uppercase">{t.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5 font-sans truncate">{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="bg-[#050505] border border-[#222] p-4 text-xs leading-relaxed text-stone-300 rounded-none light-subcard">
            {activeGuideTab === "proctor" && (
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#AD974F] uppercase tracking-wider">AI Visual Monitoring capabilities:</h4>
                <p>The system utilizes a secure base64 snapshot interval to process webcam attention pipelines. Under live study sessions, we run attention calculations tracking exactly: <strong>Face Detection, Eye Coordinate movements, looking away duration, Phone device usage, sleeping gestures,</strong> and <strong>desk presence vacancy</strong>. When distraction is flagged, we record study alert warnings.</p>
              </div>
            )}
            {activeGuideTab === "arena" && (
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#AD974F] uppercase tracking-wider">Split-Screen Sync Chambers:</h4>
                <p>Establishing or joining an Arena maps user streams side-by-side with matched candidates. Live timers, active focus meters, chat, visual feeds, and session progression run in synchronized locks on both candidate panels.</p>
              </div>
            )}
            {activeGuideTab === "reputation" && (
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#AD974F] uppercase tracking-wider">Honor Score Mechanics:</h4>
                <p>Earn <strong>+1 XP every 15 seconds</strong> of verified camera focus. Attentive focus is rewarded, whereas looking away or being empty from display pauses continuous credit increments and records distraction events.</p>
              </div>
            )}
            {activeGuideTab === "start" && (
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#AD974F] uppercase tracking-wider">Quick Start Protocol:</h4>
                <p>1. Browse the <strong>Live Arena Lobbies</strong> to match or launch a customized card study challenge. <br/>2. Allow webcam permissions (or run secure local simulator). <br/>3. Maintain screen orientation to stack XP, and claim study awards upon completion.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPACT GUIDE RE-OPEN BAR */}
      {!showHowItWorks && viewMode === "select" && (
        <div className="bg-[#0D0D0D] border border-[#222] py-3 px-5 flex items-center justify-between text-xs rounded-none shadow-md light-card">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full animate-ping"></span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#AD974F] font-bold">Interactive Proctor System Handbook Available</span>
          </div>
          <button 
            onClick={() => setShowHowItWorks(true)}
            className="text-[9px] font-mono uppercase tracking-wider hover:text-[#AD974F] hover:underline cursor-pointer"
          >
            Open Handbook
          </button>
        </div>
      )}

      {/* LIVE RUNNING ROOM QUICK BANNER */}
      {activeChallenges.length > 0 && viewMode === "select" && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-serif font-bold text-white">Your study matches is active on the background!</p>
              <p className="text-[10px] text-slate-400 font-mono">Topic: {activeChallenges[0].category} • Title: "{activeChallenges[0].title}"</p>
            </div>
          </div>
          <button 
            onClick={() => onAcceptChallenge(activeChallenges[0].id)}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-mono uppercase tracking-wider font-extrabold cursor-pointer"
          >
            Re-Enter Study Room Now
          </button>
        </div>
      )}

      {/* ======================= VIEW MODE: SELECT (MAIN DASHBOARD) ======================= */}
      {viewMode === "select" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#0D0D0D] border border-[#222] p-4 font-mono text-xs light-card">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest">Active Member: @{currentUser.username.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3 text-stone-500">
              <span>Verified Score Tally: {currentUser.score} XP</span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-700"></span>
              <span>Lobby Pool: Online</span>
            </div>
          </div>

          {/* DENSITY GRID MAIN DASHBOARD GRAPHICS (10 CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="dashboard-options-grid">
            
            {/* CARD 1: Self Study */}
            <div 
              onClick={() => setViewMode("self-study")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <BookOpen className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Start Self Study</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Launch a private focused workspace. Includes dynamic face coordinates visual proctors, distraction alarms, and daily streak counters.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Configure Room <ChevronRight className="w-3.5 h-3.5 font-bold" />
              </div>
            </div>

            {/* CARD 2: Challenge a Friend */}
            <div 
              onClick={() => setViewMode("invite-friend")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Users className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Challenge a Friend</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Directly find scholar teammates by ID or username. Setup Pomodoro schedules, dispatch instant focus alerts, and study in lockstep.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Locate Partners <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 3: Accept Random Challenge */}
            <div 
              onClick={() => setViewMode("random-challenges")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Swords className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Accept Random Challenge</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Enter the matchmaker queue or browse open active cards. Directly join split-screen peer video rooms.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Browse Community Lobbies ({pendingChallenges.length}) <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 4: Weekly Challenges */}
            <div 
              onClick={() => setViewMode("weekly")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Weekly Sprints</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Track progressing academic quotas. Review study hour milestone parameters, average attention ratings, and claim XP.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Inspect Progress (76%) <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 5: Monthly Challenges */}
            <div 
              onClick={() => setViewMode("monthly")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Flame className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Monthly Quest Milestones</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Evaluate your 30-Day streak track records. Earn high-duration scholastic badges and claim prestige medal rewards.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Review Quests <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 6: Leaderboard */}
            <div 
              onClick={() => setViewMode("leaderboard")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Global Vanguard Boards</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Compare coordinates with online scholars. Features physical gold-silver-bronze podium displays for Daily, Weekly, and Monthly peaks.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                View Gold Podium <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 7: Rewards */}
            <div 
              onClick={() => setViewMode("rewards")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Honor Rewards Center</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Tally your earned study coins. Display custom unlockable title credentials like Study Warrior, Focus Master, and Productivity King.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Tally Coins wallet <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 8: Analytics */}
            <div 
              onClick={() => setViewMode("analytics")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">AI Study Analytics</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Examine multi-dimensional focus heatmaps representing hourly study trends, attention distributions, and receive proctor recommendations.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Review Recommendations <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 9: Chatbot */}
            <div 
              onClick={() => setViewMode("chatbot")}
              className="bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-100 text-[#AD974F] rounded-none flex items-center justify-center border border-[#AD974F]/20 group-hover:bg-[#AD974F] group-hover:text-black transition-all">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all">Prodo AI Chatbot Assistant</h3>
                  <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                    Chat on the fly with our study advisor. Request custom academic timetables, study tips, Pomodoro recall procedures, or query rule criteria.
                  </p>
                </div>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-[#AD974F] flex items-center gap-1.5 uppercase mt-6 font-bold">
                Consult Assistant <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* CARD 10: About */}
            <div 
              onClick={() => setViewMode("about")}
              className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#0D0D0D] border border-[#222] p-6 text-left group hover:border-[#AD974F] cursor-pointer transition-all duration-150 relative overflow-hidden flex flex-col justify-between light-card"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-md font-serif text-white group-hover:text-[#AD974F] transition-all flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#AD974F]" />
                    About Online Study Challenges Application
                  </h3>
                  <p className="text-[11px] text-stone-450 leading-relaxed max-w-4xl">
                    Review specific technological architectures, mission commitments, visual attention capture rates, WebRTC peer connection structures, and credentials authorization schemas.
                  </p>
                </div>
                <div className="text-[9px] font-mono tracking-widest text-[#AD974F] shrink-0 font-bold uppercase flex items-center gap-1">
                  Read Technical Docs <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: SELF STUDY SETUP ======================= */}
      {viewMode === "self-study" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-8 max-w-2xl mx-auto space-y-6 relative light-card" id="self-study-configuration-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Self-Guided Study</p>
              <h2 className="text-2xl font-serif text-white mt-1">Setup Personal Focus Room</h2>
            </div>
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] hover:border-stone-500 py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>

          <form onSubmit={handleLaunchSelfStudy} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Study Session Title</label>
              <input 
                type="text" 
                required
                value={selfTitle}
                onChange={(e) => setSelfTitle(e.target.value)}
                placeholder="e.g. Master's Thesis Writing Core"
                className="w-full bg-[#050505] border border-[#222] py-2.5 px-3.5 text-xs text-white placeholder-stone-605 focus:outline-none focus:border-[#AD974F] font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Subject Topic Category</label>
                <select 
                  value={selfCategory}
                  onChange={(e) => setSelfCategory(e.target.value)}
                  className="w-full bg-[#050505] border border-[#222] py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Creative Writing">Creative Writing</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Sprint Duration</label>
                <select 
                  value={selfDuration}
                  onChange={(e) => setSelfDuration(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-[#222] py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={25}>25 Minutes (Pomodoro)</option>
                  <option value={45}>45 Minutes (Intensive)</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                  <option value={180}>180 Minutes (3 Hours)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">Study Goal Target Objective</label>
              <textarea 
                rows={3}
                value={selfGoal}
                onChange={(e) => setSelfGoal(e.target.value)}
                placeholder="Declare what you intend to accomplish during this timed focus block..."
                className="w-full bg-[#050505] border border-[#222] py-2.5 px-3.5 text-xs text-white placeholder-stone-605 focus:outline-none focus:border-[#AD974F] font-mono"
              />
            </div>

            <div className="bg-[#050505] border border-[#222] p-4 text-[11px] font-mono leading-relaxed space-y-1 text-stone-400 rounded-none light-subcard">
              <span className="text-[#AD974F] font-bold block uppercase tracking-wider">🛡️ AI Attention Verification Pipeline:</span>
              <p>On launching, you'll be requested to grant webcam permissions. Our dynamic vision script takes secure snapshot scans to verify continuous focus. This maximizes leaderboard multiplier XP accrual.</p>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-[#AD974F] hover:bg-[#C5AE6A] text-black text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition"
            >
              LAUNCH SELF STUDY ROOM
            </button>
          </form>
        </div>
      )}


      {/* ======================= VIEW MODE: CHALLENGE FRIEND SETUP ======================= */}
      {viewMode === "invite-friend" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="invite-friend-view">
          
          {/* DECLINED ALARM POPUP */}
          {showDeclinePopup && (
            <div className="col-span-12 bg-rose-950/20 border border-rose-500/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#E0E0E0]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-bold text-white">Challenge Declined</h4>
                  <p className="text-[11px] text-stone-480 font-mono">@{declinedFriendName} is currently occupied or offline on their study cycles.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => { setSelectedFriend(searchableUsers[0]); setShowDeclinePopup(false); }}
                  className="px-3 py-1.5 bg-transparent hover:bg-white hover:text-black border border-[#222] text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                >
                  Challenge Another Friend
                </button>
                <button 
                  onClick={() => { setViewMode("random-challenges"); setShowDeclinePopup(false); }}
                  className="px-3 py-1.5 bg-[#AD974F] text-black text-[10px] font-mono uppercase tracking-wider font-extrabold cursor-pointer"
                >
                  Accept Random Match
                </button>
                <button 
                  onClick={() => { setViewMode("self-study"); setShowDeclinePopup(false); }}
                  className="px-3 py-1.5 bg-transparent hover:bg-[#1A1A1A] border border-[#333] text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                >
                  Start Self Study
                </button>
                <button 
                  onClick={() => { setShowDeclinePopup(false); setViewMode("select"); }}
                  className="px-2 py-1 text-stone-400 hover:text-white font-mono text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Left Panel: Search active profiles (5 Cols) */}
          <div className="lg:col-span-5 bg-[#0D0D0D] border border-[#222] p-6 space-y-5 flex flex-col justify-between light-card">
            <div className="space-y-4">
              <div className="border-b border-[#222] pb-3 flex justify-between items-center">
                <div>
                  <p className="text-[8px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Roster Lookup</p>
                  <h3 className="text-lg font-serif text-white mt-0.5">Locate Studious Peers</h3>
                </div>
                <button 
                  onClick={() => setViewMode("select")}
                  className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1 px-2 text-stone-400 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-600">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text"
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  placeholder="Query usernames (e.g., Sophia, Marcus)..."
                  className="w-full bg-[#050505] border border-[#222] py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                />
              </div>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                {matchedFriends.length === 0 ? (
                  <p className="text-center p-6 font-mono text-[10px] text-stone-500">No active scholars matching lookup context.</p>
                ) : (
                  matchedFriends.map((friend) => (
                    <div 
                      key={friend.uid}
                      onClick={() => setSelectedFriend(friend)}
                      className={`p-3 border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                        selectedFriend?.uid === friend.uid 
                          ? "bg-[#AD974F]/10 border-[#AD974F]" 
                          : "bg-[#050505] border-[#222] hover:bg-[#111]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={friend.avatar} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover border border-[#222] p-0.5 bg-black"
                        />
                        <div>
                          <p className="text-xs font-serif font-bold text-white">@{friend.username}</p>
                          <p className="text-[9px] text-[#666] font-mono flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#AD974F]" /> LEVEL SCORE: {friend.score} XP
                          </p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 uppercase border ${
                        friend.status === "studying" 
                          ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                          : "bg-black/40 text-stone-400 border-[#222]"
                      }`}>
                        {friend.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#222]/60 text-xs font-mono text-stone-500">
              Select an online classmate card to unlock direct challenge configurations.
            </div>
          </div>

          {/* Right Panel: Challenge Creation Form (7 Cols) */}
          <div className="lg:col-span-7 bg-[#0D0D0D] border border-[#222] p-6 relative light-card">
            {!selectedFriend ? (
              <div className="h-full flex flex-col justify-center items-center py-20 text-center space-y-4">
                <div className="w-12 h-12 bg-[#1A1A1A] text-stone-600 rounded-full flex items-center justify-center border border-[#222]">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-serif text-slate-300">Invite Friend Workspace Closed</p>
                  <p className="text-[11px] text-[#666] max-w-xs font-mono">Select a scholar from the left roster layout to initiate challenge parameters.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendFriendChallenge} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-[#222] pb-4">
                  <img 
                    src={selectedFriend.avatar} 
                    alt="" 
                    className="w-11 h-11 rounded-full object-cover border border-[#AD974F] p-0.5 bg-black shrink-0"
                  />
                  <div>
                    <span className="text-[8px] font-mono text-[#AD974F] block">TARGET SCHOLAR SELECTED</span>
                    <h3 className="text-md font-serif text-white">Study Arena Invite to @{selectedFriend.username}</h3>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Study Challenge Title</label>
                  <input 
                    type="text" 
                    required
                    value={friendTitle}
                    onChange={(e) => setFriendTitle(e.target.value)}
                    placeholder="e.g. Intensive Calculus III Review Battle"
                    className="w-full bg-[#050505] border border-[#222] py-2 px-3 text-xs text-white placeholder-stone-605 focus:outline-none focus:border-[#AD974F] font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Direct Topic</label>
                    <select 
                      value={friendCategory}
                      onChange={(e) => setFriendCategory(e.target.value)}
                      className="w-full bg-[#050505] border border-[#222] py-2 px-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                    >
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Data Structures">Data Structures</option>
                      <option value="Creative Writing">Creative Writing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Choose Duration Limit</label>
                    <select 
                      value={friendDuration}
                      onChange={(e) => setFriendDuration(Number(e.target.value))}
                      className="w-full bg-[#050505] border border-[#222] py-2 px-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={120}>2 Hours</option>
                      <option value={180}>3 Hours</option>
                      <option value={15}>15 Minutes Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Academic Goal</label>
                  <input 
                    type="text" 
                    required
                    value={friendGoal}
                    onChange={(e) => setFriendGoal(e.target.value)}
                    placeholder="What specific objective are you aiming to finish?"
                    className="w-full bg-[#050505] border border-[#222] py-2 px-3 text-xs text-white placeholder-stone-605 focus:outline-none focus:border-[#AD974F] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Custom Invitation Message</label>
                  <textarea 
                    rows={2}
                    value={friendMessage}
                    onChange={(e) => setFriendMessage(e.target.value)}
                    placeholder="Enter short greeting motivational call..."
                    className="w-full bg-[#050505] border border-[#222] py-2 px-3 text-xs text-white placeholder-stone-605 focus:outline-none focus:border-[#AD974F] font-mono"
                  />
                </div>

                {inviteStatus === "sending" ? (
                  <div className="bg-[#050505] border border-amber-500/20 p-4 font-mono text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                        <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-400 uppercase tracking-widest leading-relaxed">
                      Transmitting focus packet to @{selectedFriend.username}. Please wait for active WebRTC peer answer...
                    </p>
                  </div>
                ) : inviteStatus === "accepted" ? (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 font-mono text-center text-emerald-400 text-[10px] uppercase tracking-wider">
                    🎉 CONNECTION ESTABLISHED! MATCH ACCEPTED. ENTRY GRANTED...
                  </div>
                ) : (
                  <button 
                    type="submit"
                    className="w-full py-4.5 bg-[#AD974F] hover:bg-[#C5AE6A] text-black text-xs font-mono font-bold uppercase tracking-widest cursor-pointer transition hover:scale-[1.01]"
                  >
                    DISPATCH CHALLENGE INVITATION
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: RANDOM MATCH SYSTEM ======================= */}
      {viewMode === "random-challenges" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="random-matcher-portal">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Community Board</p>
              <h2 className="text-2xl font-serif text-white">Browse Active Challenge Lobbies</h2>
              <p className="text-xs text-stone-400 mt-0.5">Explore open study rooms launched by global students. View parameters or click Accept to enter split arena lobbies.</p>
            </div>
            
            <div className="flex gap-2.5 shrink-0 self-start sm:self-center">
              <button 
                onClick={onAcceptRandom}
                className="px-4 py-2 bg-[#AD974F] text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#C5AE6A] transition cursor-pointer"
              >
                🔮 Quick Match Queue
              </button>
              <button 
                onClick={() => setViewMode("select")}
                className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-2 px-3 text-stone-300 transition hover:cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={randomChallengesSearch}
                onChange={(e) => setRandomChallengesSearch(e.target.value)}
                placeholder="Search lobby titles or creators..."
                className="w-full bg-[#050505] border border-[#222] py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
              />
            </div>
          </div>

          {/* SIMULATED OPEN CARDS CONTAINER */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingChallenges.length === 0 ? (
              <div className="col-span-1 md:col-span-3 text-center py-16 px-4 bg-[#080808]/50 border border-[#222] border-dashed">
                <p className="text-sm font-serif text-stone-400">No outside lobbies are awaiting witness entrants.</p>
                <button 
                  onClick={() => onCreateChallenge({
                    title: "System Design Sprint",
                    category: "System Design",
                    durationMinutes: 45,
                    targetUsername: "any"
                  })}
                  className="mt-4 px-4 py-2 bg-[#AD974F] text-black hover:bg-[#C5AE6A] text-[10px] uppercase font-mono tracking-wider font-bold"
                >
                  Create Open Challenge
                </button>
              </div>
            ) : (
              pendingChallenges
                .filter(ch => ch.title.toLowerCase().includes(randomChallengesSearch.toLowerCase()) || ch.creatorName.toLowerCase().includes(randomChallengesSearch.toLowerCase()))
                .map((ch) => (
                  <div key={ch.id} className="bg-black/40 border border-[#222] p-5 flex flex-col justify-between space-y-4 hover:border-[#AD974F]/50 transition duration-150">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <img src={ch.creatorAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[#222]" />
                          <div>
                            <span className="text-[9px] font-mono text-stone-400 block leading-none">@{ch.creatorName}</span>
                            <span className="text-[8px] font-mono text-[#AD974F] tracking-wide uppercase mt-0.5 inline-block bg-[#AD974F]/5 px-1 py-0.5 border border-[#AD974F]/10">Rank #4 Vanguard Scholar</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono bg-[#1A1A1A] border border-[#333] px-1.5 py-0.5 text-xs text-slate-400 rounded">
                          Difficulty: Intermediate
                        </span>
                      </div>

                      <div className="border-t border-[#222]/50 pt-3">
                        <h4 className="text-xs font-serif font-bold text-white line-clamp-1 border-l border-[#AD974F] pl-2">{ch.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">Topic: {ch.category}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono leading-relaxed">Goal: Finish weekly review objectives</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#222]/40 text-xs">
                      <span className="text-stone-400 flex items-center gap-1 font-mono text-[10px]">
                        <Hourglass className="w-3.5 h-3.5 text-[#AD974F]" />
                        {ch.durationMinutes} Minutes Focus
                      </span>
                      <button 
                        onClick={() => onAcceptChallenge(ch.id)}
                        className="px-3.5 py-1.5 bg-[#AD974F] hover:bg-[#C5AE6A] text-black font-mono uppercase tracking-wider text-[10px] font-extrabold cursor-pointer"
                      >
                        Accept challenge
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: WEEKLY CHALLENGES ======================= */}
      {viewMode === "weekly" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="weekly-sprints-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Quotas Timeline</p>
              <h2 className="text-2xl font-serif text-white mt-1">Weekly Focus Sprints</h2>
              <p className="text-xs text-stone-400 mt-0.5">Meet these weekly visual proctor goals to unlock bonus coins and Vanguard ranking points.</p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[10px] font-mono bg-[#111] border border-[#222] px-2.5 py-1 text-yellow-500 uppercase tracking-wider font-extrabold animate-pulse">
                ⏳ Time Remaining: 2d 11h 45m
              </span>
              <button 
                onClick={() => setViewMode("select")}
                className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weeklySprints.map((sp) => {
              const ratio = Math.min(100, Math.round((sp.curr / sp.target) * 100));
              const isDone = ratio >= 100;
              return (
                <div key={sp.id} className="bg-black/40 border border-[#222] p-5 space-y-4 hover:border-[#AD974F]/30 transition duration-150 rounded-none">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-xs font-serif font-bold text-white leading-snug">{sp.text}</p>
                    <span className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wide border ${
                      isDone 
                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                        : "bg-black/40 text-amber-500 border-amber-500/20"
                    }`}>
                      {isDone ? "Achieved" : "In Progress"}
                    </span>
                  </div>

                  {/* Progress slide */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-stone-400">
                      <span>Roster progression:</span>
                      <span>{sp.curr} / {sp.target} {sp.unit} ({ratio}%)</span>
                    </div>
                    <div className="w-full bg-[#111] h-2 border border-[#222] overflow-hidden">
                      <div className="bg-[#AD974F] h-full transition-all duration-500" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-[#050505] p-2 border border-[#222] text-[10px] font-mono">
                    <span className="text-stone-500 uppercase">REPUTATION REWARD:</span>
                    <span className="text-[#AD974F] font-bold">+{sp.xp} Honor XP</span>
                  </div>

                  {isDone && !sp.claimed && (
                    <button 
                      onClick={() => testUnlockBadge(`weekly-${sp.id}`, `Weekly Quota #${sp.id} Completed`)}
                      className="w-full py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-mono font-bold uppercase tracking-widest cursor-pointer"
                    >
                      CLAIM CREDIT XP
                    </button>
                  )}
                  {isDone && sp.claimed && (
                    <div className="text-center text-[10px] font-mono text-emerald-400 uppercase pt-1">
                      ✓ Credit successfully collected in ledger
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: MONTHLY CHALLENGES ======================= */}
      {viewMode === "monthly" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="monthly-challenges-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Long-Term Milestones</p>
              <h2 className="text-2xl font-serif text-white mt-1">Monthly Quest Achievements</h2>
              <p className="text-xs text-stone-400 mt-0.5">Vanguard credentials earned by dedicated scholars matching absolute focus standards.</p>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {monthlyQuests.map((quest) => {
              const r = Math.min(100, Math.round((quest.curr / quest.target) * 100));
              const isAchieved = r >= 100 || quest.rankTask;
              return (
                <div key={quest.id} className="bg-black/40 border border-[#222] p-5 flex flex-col justify-between space-y-4 hover:border-[#AD974F]/20 transition duration-150">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-serif font-bold text-white max-w-xs">{quest.text}</p>
                      <span className={`text-[8px] font-mono px-2 py-0.5 uppercase border ${
                        isAchieved 
                          ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                          : "bg-black/40 text-stone-400 border-[#222]"
                      }`}>
                        {isAchieved ? "Met Badge" : "Locked"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-stone-550">
                        <span>Completion Vector:</span>
                        <span>{quest.curr} / {quest.target} {quest.rankTask ? "" : "Units"} ({isAchieved ? "100" : r}%)</span>
                      </div>
                      <div className="w-full bg-[#111] h-1.5 border border-[#222] overflow-hidden">
                        <div className="bg-[#AD974F] h-full" style={{ width: `${isAchieved ? "100" : r}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#050505] p-2 border border-[#222] text-[9px] font-mono">
                    <span className="text-stone-500">MAPPED COMP COINS: +{quest.points} SP</span>
                    <span className="text-[#AD974F] text-right font-bold">+{quest.xp} Honor XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: GLOBAL LEADERBOARD ======================= */}
      {viewMode === "leaderboard" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="leaderboard-vanguard-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">scholastic standings</p>
              <h2 className="text-2xl font-serif text-white mt-1">Vanguard Honor Ledger</h2>
              <p className="text-xs text-stone-400 mt-0.5">Verified focus milestones cataloged dynamically by eye attention and snap coordinates.</p>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Leaderboard switcher */}
          <div className="flex border border-[#222] bg-black/40 select-none max-w-md">
            {[
              { id: "daily", label: "Daily" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "alltime", label: "All Time" }
            ].map((t) => (
              <button 
                key={t.id}
                onClick={() => setLeaderboardTab(t.id as any)}
                type="button"
                className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-widest font-bold transition-all ${
                  leaderboardTab === t.id ? "bg-[#AD974F] text-black" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 3D STYLE PODIUM SCHEME DESIGN */}
          <div className="bg-[#050505] border border-[#222] py-8 px-4 flex flex-col md:flex-row items-end justify-center gap-6 md:gap-10 light-subcard">
            
            {/* 2nd Place Silver podium */}
            <div className="flex flex-col items-center space-y-2 order-2 md:order-1 select-none">
              <div className="relative">
                <img src={podium.second.avatar} alt="" className="w-14 h-14 rounded-full object-cover border border-slate-300 p-0.5 bg-black" />
                <span className="absolute -top-1 -right-1 bg-slate-400 text-black text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border border-black">2</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-serif font-bold text-white">@{podium.second.name}</p>
                <p className="text-[9px] text-slate-300 font-mono mt-0.5">{podium.second.hrs}h completed</p>
                <p className="text-[9px] text-stone-500 font-mono">Avg: {podium.second.score}% focus</p>
              </div>
              {/* Podium pedestal */}
              <div className="w-28 bg-slate-300/10 border border-slate-300/30 h-20 flex flex-col items-center justify-center p-2 mt-2 shadow-inner">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">SILVER SCHOLAR</span>
              </div>
            </div>

            {/* 1st Place Gold podium */}
            <div className="flex flex-col items-center space-y-2 order-1 md:order-2 select-none -translate-y-4">
              <div className="relative">
                <img src={podium.first.avatar} alt="" className="w-18 h-18 rounded-full object-cover border border-[#AD974F] p-0.5 bg-black" />
                <span className="absolute -top-1 -right-1 bg-[#AD974F] text-black text-[11px] font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center border border-black animate-bounce">1</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-serif font-extrabold text-white">@{podium.first.name}</p>
                <p className="text-[10px] text-[#AD974F] font-mono mt-0.5">{podium.first.hrs}h completed</p>
                <p className="text-[9px] text-stone-500 font-mono">Avg: {podium.first.score}% focus</p>
              </div>
              {/* Podium pedestal */}
              <div className="w-32 bg-[#AD974F]/10 border-2 border-[#AD974F] h-28 flex flex-col items-center justify-center p-2 mt-2 shadow-[0_0_20px_rgba(173,151,79,0.15)]">
                <Trophy className="w-6 h-6 text-[#AD974F] animate-pulse" />
                <span className="text-[10px] font-mono text-[#AD974F] uppercase tracking-wider font-extrabold mt-1">GOLD VANGUARD</span>
              </div>
            </div>

            {/* 3rd Place Bronze podium */}
            <div className="flex flex-col items-center space-y-2 order-3 select-none">
              <div className="relative">
                <img src={podium.third.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-amber-850 p-0.5 bg-black" />
                <span className="absolute -top-1 -right-1 bg-amber-600 text-black text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border border-black">3</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-serif font-bold text-white">@{podium.third.name}</p>
                <p className="text-[9px] text-amber-500 font-mono mt-0.5">{podium.third.hrs}h completed</p>
                <p className="text-[9px] text-stone-500 font-mono">Avg: {podium.third.score}% focus</p>
              </div>
              {/* Podium pedestal */}
              <div className="w-24 bg-amber-900/10 border border-amber-900/30 h-14 flex flex-col items-center justify-center p-2 mt-2 shadow-inner">
                <span className="text-[10px] font-mono text-amber-500/80 uppercase tracking-widest font-bold">BRONZE REPUTE</span>
              </div>
            </div>

          </div>

          {/* Leaders board standard ledger table */}
          <div className="space-y-2 border-t border-[#222] pt-4">
            <h3 className="text-xs font-mono font-bold uppercase text-[#AD974F] tracking-widest pl-2 mb-3">Global Scholar Standings:</h3>
            {sortedLeaderboard.map((u, idx) => {
              const isSelf = u.uid === currentUser.uid;
              return (
                <div 
                  key={u.uid}
                  className={`py-3 px-4 border ${
                    isSelf 
                      ? "bg-[#AD974F]/5 border-[#AD974F]/30 text-[#AD974F]" 
                      : "bg-black/40 border-[#222]"
                  } flex items-center justify-between transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 font-mono text-stone-400 text-xs text-center">{idx + 1}</span>
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#222] bg-black" />
                    <div>
                      <p className="text-xs font-serif font-bold text-white uppercase">{u.username}</p>
                      <p className="text-[10px] text-[#AD974F] font-mono leading-none mt-0.5 inline-block bg-[#AD974F]/5 border border-[#AD974F]/10 px-1 py-0.5 rounded">Vanguard Cadet</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div className="text-right hidden sm:block">
                      <span className="text-stone-500 text-[10px] block uppercase leading-none">TOTAL COMPTIME</span>
                      <span className="text-white font-bold">{u.studyTimeHrs.toFixed(1)}h</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-500 text-[10px] block uppercase leading-none">TOTAL SCORE</span>
                      <span className="text-[#AD974F] font-bold">{u.score} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: REWARDS CENTER ======================= */}
      {viewMode === "rewards" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="rewards-vault-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Honor Vault</p>
              <h2 className="text-2xl font-serif text-white mt-1">Reputation Rewards cabinet</h2>
              <p className="text-xs text-stone-400 mt-0.5">Earn coins on focus streaks & claim badges depicting unique scholastic milestones.</p>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 border border-[#222] p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase">COINS WALLET & VERIFIED STATUS</span>
              <p className="text-4xl font-serif text-[#AD974F] font-extrabold">{scholarCoins} <span className="text-xs font-mono font-medium text-[#AD974F]">Scholar Gold coins</span></p>
              <p className="text-xs text-stone-400 leading-relaxed max-w-lg font-mono">Unlock standard achievement titles! Select any locked award badge below to trigger dynamic reputation code simulation verify credentials.</p>
            </div>
            <button 
              onClick={() => testUnlockBadge("Vanguard_Titan", "Vanguard_Titan Medal Claimed")}
              className="px-6 py-3 bg-[#AD974F] text-black text-xs font-mono font-bold uppercase tracking-widest hover:bg-[#C5AE6A] self-start md:self-auto cursor-pointer"
            >
              Unlock Test Milestone Badge (+150 gold)
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase text-[#AD974F] tracking-widest leading-none pt-2 pl-1 mb-4">Milestone Reputation Badge Cabinet:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "Warrior", title: "Study Warrior Medal", desc: "Unlock by participating and completing 5 Live Arena split-screen peer challenges.", icon: Swords },
                { key: "Focus", title: "Focus Master Medal", desc: "Maintain visual attention coordinates > 85% score for 3 cumulative self-guided hours.", icon: Target },
                { key: "Champion", title: "Monthly Champion Prestige", desc: "Reach rank 1 coordinates on daily, weekly, or monthly Vanguard standings.", icon: Trophy },
                { key: "King", title: "Productivity King Badge", desc: "Successfully accumulate more than 100 total verified visual proctor hours.", icon: Award }
              ].map((badge) => {
                const isOwned = unlockedAchievements.includes(badge.key);
                return (
                  <div 
                    key={badge.key}
                    onClick={() => testUnlockBadge(badge.key, badge.title)}
                    className={`p-4 border ${
                      isOwned 
                        ? "bg-[#AD974F]/5 border-[#AD974F]/30 text-[#AD974F]" 
                        : "bg-black/20 border-[#222] text-[#666] opacity-65 cursor-pointer hover:opacity-100 hover:border-[#666]"
                    } flex gap-4 transition-all duration-150 relative overflow-hidden`}
                  >
                    <div className={`p-3 shrink-0 rounded-none border ${isOwned ? "bg-[#AD974F]/10 border-[#AD974F]" : "bg-black border-[#222]"}`}>
                      <badge.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-serif font-bold ${isOwned ? "text-white" : "text-stone-500"}`}>{badge.title}</h4>
                      <p className="text-[10px] text-stone-400 mt-1 leading-normal font-sans">{badge.desc}</p>
                      <span className="text-[9px] font-mono uppercase tracking-wider block mt-2 text-[#AD974F] font-bold">
                        {isOwned ? "✓ Achievement Unlocked (Claimed)" : "🔒 Locked. Click to simulated claim"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: AI COGNITIVE ANALYTICS ======================= */}
      {viewMode === "analytics" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card" id="analytics-overview-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Cognitive Tracking</p>
              <h2 className="text-2xl font-serif text-white mt-1">Personalized Focus Trends</h2>
              <p className="text-xs text-stone-400 mt-0.5">Visualize biometric tracking summaries mapped through Gemini Vision metrics across the past week.</p>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG Visual charts mapping focus trends (7 Cols) */}
            <div className="lg:col-span-7 bg-[#050505] p-5 border border-[#222] space-y-4 light-subcard">
              <h3 className="text-xs font-mono font-bold uppercase text-[#AD974F] tracking-widest mb-4">Focus Hours Distribution Trend:</h3>
              
              {/* Custom SVG line plot */}
              <div className="relative h-64 border border-[#222]/80 bg-black/80 flex items-end p-6 p-b-2 font-mono">
                {/* Y grids */}
                <div className="absolute inset-x-0 top-[20%] border-t border-[#111] text-[8px] text-stone-605 pl-1 font-mono">6.5 hours</div>
                <div className="absolute inset-x-0 top-[40%] border-t border-[#111] text-[8px] text-stone-605 pl-1 font-mono">4.5 hours</div>
                <div className="absolute inset-x-0 top-[60%] border-t border-[#111] text-[8px] text-stone-605 pl-1 font-mono">2.5 hours</div>
                <div className="absolute inset-x-0 top-[80%] border-t border-[#111] text-[8px] text-stone-605 pl-1 font-mono">1.0 hours</div>

                <svg className="w-full h-full" viewBox="0 0 500 200">
                  {/* Grid Lines */}
                  {/* Drawing curve */}
                  <path 
                    d="M 10 180 L 80 150 L 150 90 L 220 140 L 290 80 L 360 40 L 430 110" 
                    fill="none" 
                    stroke="#AD974F" 
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* Points */}
                  <circle cx="10" cy="180" r="5" fill="#10B981" />
                  <circle cx="80" cy="150" r="5" fill="#10B981" />
                  <circle cx="150" cy="90" r="5" fill="#10B981" />
                  <circle cx="220" cy="140" r="5" fill="#10B981" />
                  <circle cx="290" cy="80" r="5" fill="#10B981" />
                  <circle cx="360" cy="40" r="5" fill="#111" stroke="#AD974F" strokeWidth="2" />
                  <circle cx="430" cy="110" r="5" fill="#10B981" />
                </svg>

                {/* X labels */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[8px] text-slate-500 font-mono tracking-wider uppercase">
                  <span>Mon (1.2h)</span>
                  <span>Tue (2.4h)</span>
                  <span>Wed (4.2h)</span>
                  <span>Thu (3.0h)</span>
                  <span>Fri (4.5h)</span>
                  <span>Sat (6.2h)</span>
                  <span>Sun (3.5h)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center font-mono">Continuous tracking indicates focus peaking during late Saturday evening slots.</p>
            </div>

            {/* AI Advisor Personalized recommendations (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0A0A0A] border border-[#222] p-5 space-y-4 flex flex-col justify-between light-subcard">
              <div className="space-y-4">
                <span className="text-[9px] font-mono text-[#AD974F] uppercase tracking-wider font-extrabold flex items-center gap-1.5 leading-none">
                  <Star className="w-4 h-4 text-[#AD974F] animate-spin" style={{ animationDuration: "10s" }} />
                  ADVISORY DEEP VERIFICATION METRICS
                </span>

                <div className="space-y-3.5 text-xs text-stone-300 leading-relaxed font-mono">
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <span className="text-emerald-400 font-bold block uppercase text-[10px]">Focal Coefficient Peak (Mon-Fri)</span>
                    <p className="mt-1">Average concentration ratios are <strong>(+12%) higher</strong> inside synchronizing split-screen battle environments compared to solitary study blocks! Human accountability represents your primary catalyst.</p>
                  </div>

                  <div className="border-l-2 border-[#AD974F] pl-3">
                    <span className="text-[#AD974F] font-bold block uppercase text-[10px]">Attention drop warnings alert</span>
                    <p className="mt-1">"Based on visual proctored coordinate trackings, your concentration limit peaks at <strong>45 minutes</strong> on technical subject disciplines (e.g. Computer Science). We recommend implementing a lock-step 5-minute active motor transition recess."</p>
                  </div>

                  <div className="border-l-2 border-rose-500 pl-3">
                    <span className="text-rose-400 font-bold block uppercase text-[10px]">Phone distraction flags coincidence</span>
                    <p className="mt-1">"Mobile phone snapshot flags occur heavily coincidental to late-night midnight cycles. Suggest placing physical devices in separate rooms during Pomodoro focus blocks."</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#222]/80 font-serif text-[11px] text-[#AD974F]">
                "Maximize performance by triggering short visual focus sprints."
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: INTERACTIVE CHATBOT ======================= */}
      {viewMode === "chatbot" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-6 space-y-6 relative light-card animate-fadeIn" id="chatbot-assistant-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Scholar Advisor</p>
              <h2 className="text-2xl font-serif text-white mt-1">Prodo AI Companion Chat</h2>
              <p className="text-xs text-stone-400 mt-0.5">Consult our expert assistant for academic schedule mapping, focus tips, or website system conditions.</p>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Context question chips (4 Cols) */}
            <div className="lg:col-span-4 bg-[#050505] p-5 border border-[#222] space-y-4 flex flex-col justify-between light-subcard">
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-[#AD974F] uppercase tracking-wider font-extrabold block">Context Prompt Chips:</span>
                <p className="text-[11px] text-stone-400 leading-relaxed font-mono">Select any prompt query chip below to populate the interactive input field automatically:</p>
                
                <div className="flex flex-col gap-2.5">
                  {[
                    "Suggest me a custom 3-hour Pomodoro study schedule",
                    "How does the visual snapshot proctor track eye levels?",
                    "Explain the weekly Quota milestone rewards XP system",
                    "Share research-backed tips to avoid mobile distractions"
                  ].map((chipText) => (
                    <button 
                      key={chipText}
                      onClick={() => selectBotChip(chipText)}
                      className="text-left text-[11.5px] font-mono p-3 bg-black/50 border border-[#222] hover:border-[#AD974F]/40 hover:text-white transition duration-150"
                    >
                      • {chipText}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#222]/80 font-mono text-[9px] text-slate-500 uppercase tracking-widest">
                VERIFIED STUDY COACH MODEL • REF NO 880e
              </div>
            </div>

            {/* Conversation Box (8 Cols) */}
            <div className="lg:col-span-8 bg-[#050505] p-5 border border-[#222] h-[450px] flex flex-col justify-between space-y-4 light-subcard">
              {/* Message scrollway */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {botChatHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex ${item.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`p-3.5 max-w-xl text-xs leading-relaxed font-mono ${
                      item.sender === "user" 
                        ? "bg-[#AD974F] text-black rounded-none border border-black/10 font-bold" 
                        : "bg-[#111] text-stone-200 rounded-none border border-[#222]"
                    }`}>
                      <p className="text-[8px] uppercase tracking-widest text-[#AD974F]/70 mb-1 leading-none font-bold">
                        {item.sender === "user" ? "SCHOLAR TARGET" : "ADVISER PRODO"}
                      </p>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
                {isBotThinking && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-black/40 border border-[#222] font-mono text-[10px] text-zinc-500 animate-pulse">
                      Prodo adviser formulating cognitive response...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat form box */}
              <form onSubmit={handleBotChatSend} className="flex gap-2">
                <input 
                  type="text"
                  value={botChatInput}
                  onChange={(e) => setBotChatInput(e.target.value)}
                  placeholder="Ask Prodo study schedule queries or eye proctor mechanics..."
                  className="flex-1 bg-black border border-[#222] py-3 px-4 text-xs text-white focus:outline-none focus:border-[#AD974F] font-mono"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#AD974F] hover:bg-[#C5AE6A] text-black font-mono font-bold uppercase tracking-widest text-xs cursor-pointer"
                >
                  Ask AI
                </button>
              </form>

            </div>

          </div>
        </div>
      )}


      {/* ======================= VIEW MODE: ABOUT APPLICATION ======================= */}
      {viewMode === "about" && (
        <div className="bg-[#0D0D0D] border border-[#222] p-8 max-w-3xl mx-auto space-y-6 relative light-card" id="about-application-docs-view">
          
          <div className="flex justify-between items-center border-b border-[#222] pb-4">
            <div>
              <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] font-mono font-bold">Tech Specifications</p>
              <h2 className="text-2xl font-serif text-white mt-1">About Online Study Challenges</h2>
            </div>
            
            <button 
              onClick={() => setViewMode("select")}
              className="text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 bg-black/40 border border-[#222] py-1.5 px-3 text-stone-300 transition hover:cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          <div className="space-y-6 text-xs leading-relaxed text-stone-300 font-mono">
            <div className="space-y-2">
              <h3 className="text-sm font-serif text-white font-bold flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full"></span>
                1. System Mission Definition
              </h3>
              <p className="text-stone-400">
                Online Study Challenges represents an academic, high-fidelity competitive focus platform designed to assist students worldwide in overcoming cognitive attrition. By establishing lock-step split-screen study rooms and verified WebRTC peer visual loops, we construct a healthy, game-like accountability lattice encouraging academic rigor.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-serif text-white font-bold flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-[#AD974F] rounded-full"></span>
                2. Core Capabilities & Mechanics
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-stone-400">
                <li><strong>Live Synchronous Timers:</strong> Persistent study stopwatches runs automatically across headers to accumulate verified Honor XP credits.</li>
                <li><strong>Dynamic Visual Proctor snapshots:</strong> Processes JPEG base64 webcam frames periodically to track face detection, phone gestures, and sleep.</li>
                <li><strong>Matchmaker Arena:</strong> Random matchmaking lobbies allow instant synchronous P2P video calls.</li>
                <li><strong>Honor rewards cabinet:</strong> Trade focus minutes for scholar badges and gold.</li>
              </ul>
            </div>

            <div className="space-y-2 border-t border-[#222] pt-4">
              <h3 className="text-sm font-serif text-[#AD974F] font-bold uppercase tracking-wide">
                3. Application Technological Blueprint Core
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="bg-[#050505] p-3 border border-[#222] light-subcard">
                  <span className="text-white block font-bold text-[11px] mb-1">FRONTEND ARCHITECTURE:</span>
                  <p className="text-stone-500 text-[10px]">React 19 + TypeScript + Tailwind CSS framework. Animates layout shifts cleanly via motion components. Icons mapped from Lucide systems.</p>
                </div>
                <div className="bg-[#050505] p-3 border border-[#222] light-subcard">
                  <span className="text-white block font-bold text-[11px] mb-1">BACKEND UTILITIES SERVER:</span>
                  <p className="text-stone-500 text-[10px]">Node.js with Express.js REST API routes proxying study roster logs, challenge database, and visual monitoring inputs to Gemini models.</p>
                </div>
                <div className="bg-[#050505] p-3 border border-[#222] light-subcard">
                  <span className="text-white block font-bold text-[11px] mb-1">DATABASE SCHEMA STORAGE:</span>
                  <p className="text-stone-500 text-[10px]">Simulated MongoDB / Firestore in-memory collections managing dynamic user scores, weekly metrics, active stream rooms, and completed histories.</p>
                </div>
                <div className="bg-[#050505] p-3 border border-[#222] light-subcard">
                  <span className="text-white block font-bold text-[11px] mb-1">ARTIFICIAL INTELLIGENCE PIPELINE:</span>
                  <p className="text-stone-500 text-[10px]">Generative Computer Vision utilizing server-side Gemini 3.5 Flash Flash model API keys. Scores posture, eyes, smartphone presence fully.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
