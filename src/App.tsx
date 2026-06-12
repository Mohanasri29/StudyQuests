import React, { useState, useEffect } from "react";
import { 
  BookOpen, LogOut, ShieldAlert, Swords, Trophy, Users, 
  BadgeCheck, Bell, Sun, Moon, Trash2, CheckCircle, Gift, Star, Gamepad2
} from "lucide-react";
import { User, Challenge } from "./types";
import LoginScreen from "./components/LoginScreen";
import ChallengeLobby from "./components/ChallengeLobby";
import ActiveStudyRoom from "./components/ActiveStudyRoom";
import ProdoChatbot from "./components/ProdoChatbot";

interface SystemNotification {
  id: string;
  text: string;
  time: string;
  type: "invitation" | "acceptance" | "reward" | "milestone";
  read: boolean;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [challengesList, setChallengesList] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [headerElapsed, setHeaderElapsed] = useState(0);

  // Theme support
  const [isLightMode, setIsLightMode] = useState(false);

  // Dynamic system notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    { id: "1", text: "Sophia_CS has invited you to join biology study room!", time: "5 min ago", type: "invitation", read: false },
    { id: "2", text: "Congratulations! Completed Pomodoro focused interval.", time: "1 hour ago", type: "milestone", read: true },
    { id: "3", text: "Scholar Level UP! Reached Bronze Focus Status Badge (+150 XP)", time: "2 hours ago", type: "reward", read: false },
    { id: "4", text: "AlexStudy accepted your Data Structures challenge lobby!", time: "Yesterday", type: "acceptance", read: true }
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Status message alerts toast
  const [alertToast, setAlertToast] = useState<{ msg: string; type: "success" | "info" | "warn" } | null>(null);

  // Synchronize CSS class for light mode support globally
  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [isLightMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeChallenge && activeChallenge.status === "active") {
      setHeaderElapsed(activeChallenge.elapsedSeconds || 0);
      interval = setInterval(() => {
        setHeaderElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setHeaderElapsed(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChallenge?.id, activeChallenge?.status]);

  // Live Study Timer (HH:MM:SS format)
  const formatHeaderTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, "0");
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const secs = (sec % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  useEffect(() => {
    if (activeChallenge && activeChallenge.status === "active") {
      // Direct required notification text
      triggerToast("⚡ Notification: Study Session Started Successfully!", "success");
      
      const newNotif: SystemNotification = {
        id: Date.now().toString(),
        text: `Study Session Started Successfully: "${activeChallenge.title}"`,
        time: "Just now",
        type: "milestone",
        read: false
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  }, [activeChallenge?.id]);

  // Fetch users & challenges lists
  const syncServerData = async () => {
    try {
      // 1. Fetch live active users
      const uRes = await fetch("/api/users");
      if (uRes.ok) {
        const uData: User[] = await uRes.json();
        setUsersList(uData);

        // Keep current logged-in user in sync with updated server hours/scores
        if (currentUser) {
          const matchedSelf = uData.find((u) => u.uid === currentUser.uid);
          if (matchedSelf) {
            setCurrentUser(matchedSelf);
          }
        }
      }

      // 2. Fetch challenges
      const cRes = await fetch("/api/challenges");
      if (cRes.ok) {
        const cData: Challenge[] = await cRes.json();
        setChallengesList(cData);

        // Monitor active match state shifts (e.g. if a mock student accepted user's challenge)
        if (currentUser) {
          const currentRooms = cData.filter(
            (c) => 
              c.status === "active" && 
              (c.creatorId === currentUser.uid || c.accepterId === currentUser.uid)
          );

          if (currentRooms.length > 0) {
            // Find if there's a running room we aren't displaying as active yet
            if (!activeChallenge) {
              setActiveChallenge(currentRooms[0]);
              triggerToast(`Study challenge room active with @${currentRooms[0].creatorId === currentUser.uid ? currentRooms[0].accepterName || "a partner" : currentRooms[0].creatorName}!`, "success");
            } else {
              // Update core times
              const inSyncRoom = currentRooms.find((r) => r.id === activeChallenge.id);
              if (inSyncRoom) {
                setActiveChallenge(inSyncRoom);
              }
            }
          } else {
            // Active room closed or completed
            if (activeChallenge) {
              setActiveChallenge(null);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Client sync cycle missed: ", err);
    }
  };

  // Continuous background polling to simulate standard real-time multi-user portals
  useEffect(() => {
    syncServerData(); // Initial sync

    const interval = setInterval(() => {
      syncServerData();
    }, 4500);

    return () => clearInterval(interval);
  }, [currentUser?.uid, activeChallenge?.id]);

  const triggerToast = (msg: string, type: "success" | "info" | "warn") => {
    setAlertToast({ msg, type });
    setTimeout(() => {
      setAlertToast(null);
    }, 4000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    triggerToast(`Welcome back, @${user.username}! Joined study lobby.`, "success");
    syncServerData();
  };

  const handleCreateChallenge = async (params: {
    title: string;
    category: string;
    durationMinutes: number;
    targetUsername: string;
  }) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: currentUser.uid,
          ...params
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to broadcast challenge");
      }

      const newCh: Challenge = await response.json();
      setChallengesList((prev) => [...prev, newCh]);
      triggerToast("Study challenge room broadcasted to the community!", "success");

      // Auto join if it starts as accepted
      if (newCh.status === "accepted" || newCh.status === "active") {
        setActiveChallenge(newCh);
      }
    } catch (err: any) {
      triggerToast(err.message || "Unable to launch challenge", "warn");
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    if (!currentUser) return;

    const targetCh = challengesList.find((c) => c.id === challengeId);
    if (!targetCh) return;

    // If already active, re-enter room directly
    if (targetCh.status === "active") {
      setActiveChallenge(targetCh);
      return;
    }

    try {
      const response = await fetch("/api/challenges/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          accepterId: currentUser.uid
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to accept session Match");
      }

      const activeCh: Challenge = await response.json();
      setActiveChallenge(activeCh);
      triggerToast(`Accepted study room challenge from @${activeCh.creatorName}!`, "success");
      syncServerData();

    } catch (err: any) {
      triggerToast(err.message || "Match entry rejected", "warn");
    }
  };

  const handleAcceptRandom = async () => {
    if (!currentUser) return;

    try {
      triggerToast("Consulting active matchmaking roster...", "info");
      const response = await fetch("/api/challenges/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.uid }),
      });

      if (!response.ok) {
        throw new Error("Random matchmaking queue timeout");
      }

      const result = await response.json();
      if (result.matched && result.challenge) {
        setActiveChallenge(result.challenge);
        triggerToast("Study match found! Connecting split audio-video...", "success");
        syncServerData();
      } else {
        triggerToast("No active partners found. Launch a custom card challenge!", "info");
      }
    } catch (err: any) {
      triggerToast(err.message || "Matchmaker failed", "warn");
    }
  };

  const handleSessionComplete = async (challengeId: string, elapsedSec: number) => {
    if (!currentUser) return;

    try {
      const response = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          completerId: currentUser.uid,
          elapsedSeconds: elapsedSec
        }),
      });

      if (!response.ok) {
        throw new Error("Completing session failed on server");
      }

      const result = await response.json();
      setActiveChallenge(null);
      triggerToast(`Study session completed! Awarded +${result.pointsAwarded} XP.`, "success");
      
      const milestoneNotif: SystemNotification = {
        id: Date.now().toString(),
        text: `Milestone Completed! Logged ${formatHeaderTime(elapsedSec)} of focused study (+${result.pointsAwarded} XP)`,
        time: "Just now",
        type: "reward",
        read: false
      };
      setNotifications((prev) => [milestoneNotif, ...prev]);
      
      syncServerData();

    } catch (err: any) {
      triggerToast(err.message || "Unable to fully commit focus stats", "warn");
      setActiveChallenge(null);
    }
  };

  const handleExitEarly = () => {
    setActiveChallenge(null);
    triggerToast("Returned back to student lobby", "info");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveChallenge(null);
    triggerToast("Logged out of Online Study Challenges", "info");
  };

  // Notification clear helpers
  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // If not logged in
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const onlineStudentsCount = usersList.filter((u) => u.status === "studying").length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#090614] text-[#F2EFFC] flex flex-col relative" id="applet-main-body">
      
      {/* HEADER SECTION */}
      <header className="bg-slate-900/90 border-b border-indigo-500/20 py-4 px-4 md:px-8 z-30 sticky top-0 backdrop-blur-md transition shadow-[0_4px_20px_rgba(0,240,255,0.06)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-[#00f0ff] to-[#00b0ff] text-black shadow-[0_0_15px_rgba(0,240,255,0.35)] animate-pulse rounded-lg">
              <Gamepad2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-md font-serif text-white tracking-widest flex items-center gap-1.5 uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-pink-500">
                Study Quests: Gamer Arena
              </h1>
              <span className="text-[9px] font-mono text-pink-400 tracking-wider block leading-none mt-1 uppercase">
                ⚔️ multiplayer co-op sessions & AI level-up monitors
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Realtime Community statistics */}
            <div className="hidden lg:flex items-center gap-5 text-[10px] font-mono tracking-wider uppercase">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-4 h-4 text-[#00f0ff]" />
                <span>{usersList.length} PLAYERS ON QUEST</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#00f0ff] bg-slate-850 border border-indigo-500/20 px-3 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                <span className="font-bold">{onlineStudentsCount} LIVE IN CHAMBERS</span>
              </div>
            </div>

            {/* HIGH DENSITY TOP RIGHT FOCUS TIMER WIDGET - HH:MM:SS format */}
            {activeChallenge && (
              <div className="flex items-center gap-2 bg-slate-950 border border-pink-500/60 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_6px_#ff007f]"></span>
                <div className="flex flex-col">
                  <span className="text-[7px] font-mono tracking-[0.2em] text-[#00f0ff] block font-extrabold leading-none uppercase">FOCUS MULTIPLIER ON</span>
                  <span className="text-[11px] font-mono font-extrabold text-white mt-1 leading-none tracking-widest" id="header-study-timer-countdown">
                    ⏱️ {formatHeaderTime(headerElapsed)}
                  </span>
                </div>
              </div>
            )}

            {/* LIGHT AND DARK MODE SWITCHER */}
            <button 
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2 border border-[#222] hover:border-[#AD974F] bg-black/40 text-stone-300 hover:text-[#AD974F] transition cursor-pointer flex items-center justify-center rounded-none"
              title="Toggle Light / Dark Mode"
            >
              {isLightMode ? (
                <Moon className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              ) : (
                <Sun className="w-4 h-4 text-yellow-500 stroke-[2.5]" />
              )}
            </button>

            {/* DYNAMIC NOTIFICATIONS COMPREHENSIVE HUB */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="p-2 border border-[#222] hover:border-[#AD974F] bg-black/40 text-stone-300 hover:text-white transition flex items-center justify-center rounded-none relative cursor-pointer"
                title="Notifications Portal"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-black font-mono font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce border border-black shadow">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* DROPDOWN HUB PANEL */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-[#0F0F0F] border border-[#222] p-4 shadow-2xl z-50 rounded-none light-card">
                  <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-2">
                    <span className="text-[9.5px] font-mono text-[#AD974F] uppercase tracking-wider font-extrabold flex items-center gap-1">
                      🔔 STUDY ALERTS HUB ({notifications.length})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={markAllNotificationsRead} 
                        className="text-[8px] font-mono uppercase text-stone-400 hover:text-white hover:underline cursor-pointer bg-transparent border-none"
                      >
                        Read All
                      </button>
                      <button 
                        onClick={clearNotifications} 
                        className="text-[8px] font-mono uppercase text-[#AD974F] hover:text-red-400 font-extrabold cursor-pointer bg-transparent border-none"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center font-mono text-[9px] py-4 text-stone-500">Roster alerts queue is clear.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-2.5 border text-[11px] leading-relaxed font-mono flex gap-2.5 relative group ${
                            notif.read ? "bg-black/20 border-[#222]/60 opacity-70" : "bg-white/5 border-[#AD974F]/40"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === "invitation" && <Users className="w-3.5 h-3.5 text-blue-400" />}
                            {notif.type === "milestone" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {notif.type === "reward" && <Gift className="w-3.5 h-3.5 text-[#AD974F]" />}
                            {notif.type === "acceptance" && <Swords className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <div className="flex-1 pr-4">
                            <p className={`${notif.read ? "text-stone-400" : "text-white font-medium"}`}>{notif.text}</p>
                            <span className="text-[8px] text-stone-550 block mt-1 uppercase font-semibold">{notif.time}</span>
                          </div>
                          
                          <button 
                            onClick={(e) => dismissNotification(notif.id, e)}
                            className="absolute right-1 top-1 text-stone-550 hover:text-red-400 font-mono text-[9px] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Dismiss Alert"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* USER PROFILE AVATAR WIDGET */}
            <div className="flex items-center gap-2.5 border-l border-[#222] pl-4">
              <div className="relative">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.username} 
                  className="w-8.5 h-8.5 rounded-full object-cover border border-[#AD974F] p-0.5 bg-black"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full"></span>
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[10px] font-serif font-bold text-white uppercase tracking-wider block">@{currentUser.username}</span>
                <span className="text-[8px] font-mono text-[#AD974F] uppercase tracking-widest">{currentUser.score} XP Earned</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* TOAST SYSTEM */}
      {alertToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className={`p-4 border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
            alertToast.type === "success" ? "bg-black/95 text-[#AD974F] border-[#AD974F]/30" :
            alertToast.type === "warn" ? "bg-black/95 text-rose-300 border-rose-500/30" :
            "bg-black/95 text-stone-300 border-stone-700"
          }`}>
            <div className={`w-6 h-6 rounded-none flex items-center justify-center shrink-0 ${
              alertToast.type === "success" ? "bg-[#AD974F]/10" :
              alertToast.type === "warn" ? "bg-rose-500/10" :
              "bg-stone-800"
            }`}>
              {alertToast.type === "success" && <BadgeCheck className="w-4 h-4 text-[#AD974F]" />}
              {alertToast.type === "warn" && <ShieldAlert className="w-4 h-4 text-rose-400" />}
              {alertToast.type === "info" && <Swords className="w-4 h-4 text-stone-400" />}
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest leading-relaxed flex-1">{alertToast.msg}</p>
          </div>
        </div>
      )}

      {/* SCREEN ROUTER */}
      <main className="flex-1 py-8">
        {activeChallenge ? (
          <ActiveStudyRoom
            currentUser={currentUser}
            activeChallenge={activeChallenge}
            onSessionComplete={handleSessionComplete}
            onExitEarly={handleExitEarly}
          />
        ) : (
          <ChallengeLobby
            currentUser={currentUser}
            usersList={usersList}
            challengesList={challengesList}
            onAcceptChallenge={handleAcceptChallenge}
            onAcceptRandom={handleAcceptRandom}
            onCreateChallenge={handleCreateChallenge}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-indigo-500/10 text-center text-[9px] text-[#ff007f] font-mono uppercase tracking-[0.2em] bg-slate-950">
        🎮 STUDY QUESTS ARENA • LEVEL UP YOUR MIND • © 2026. SECURE COGNITIVE ATTENTION FEEDBACK.
      </footer>

      {/* FLOATING PRODO CHATBOT */}
      <ProdoChatbot />
    </div>
  );
}
