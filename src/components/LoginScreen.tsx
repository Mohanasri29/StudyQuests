import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, BookOpen, User as UserIcon, ArrowRight, Mail, Lock, KeyRound, Check, Chrome, ShieldAlert, ArrowLeft, Gamepad2 } from "lucide-react";
import { User } from "../types";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
];

const DEFAULT_NICKNAMES = [
  "DeepWorker", "CodeWizard", "CalculusPro", "BioScholar", "FocusMaster", "StudyZen"
];

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [formMode, setFormMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Modals / Helpers
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [welcomeAnimating, setWelcomeAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorString, setErrorString] = useState("");
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleRandomize = () => {
    const randomNick = DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)] + Math.floor(Math.random() * 900 + 100);
    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
    setUsername(randomNick);
    setSelectedAvatar(randomAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorString("");

    if (formMode === "signup") {
      if (!username.trim()) {
        setErrorString("Please select a study nickname!");
        return;
      }
      if (username.length < 3) {
        setErrorString("Nickname must be at least 3 characters");
        return;
      }
      if (!email.includes("@")) {
        setErrorString("Please provide a valid email address");
        return;
      }
      if (password.length < 6) {
        setErrorString("Password must be at least 6 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setErrorString("Passwords do not match");
        return;
      }
    } else {
      if (!email.includes("@")) {
        setErrorString("Enter a correct email structure");
        return;
      }
      if (!password) {
        setErrorString("Please enter your password");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Simulate unique local UID
      let uid = localStorage.getItem("study_uid");
      if (!uid) {
        uid = `user-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("study_uid", uid);
      }

      // Sync user profile state in server memory
      const nicknameToUse = formMode === "signup" ? username.trim() : email.split("@")[0] + "_Study";
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uid, 
          username: nicknameToUse, 
          avatar: selectedAvatar 
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to register credentials on the study server");
      }

      const verifiedUser: User = await response.json();
      setTempUser(verifiedUser);
      setWelcomeAnimating(true);

      // Welcome animation runs for 2 seconds before redirection
      setTimeout(() => {
        onLogin(verifiedUser);
      }, 2000);

    } catch (err: any) {
      setErrorString(err.message || "Credential authentication error. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Elegant simulated Google login flow
    setIsSubmitting(true);
    const mockEmail = "student.google@gmail.com";
    const randomNick = "GoogleScholar_" + Math.floor(Math.random() * 800 + 100);
    const randomAvatar = PRESET_AVATARS[2];

    setTimeout(async () => {
      try {
        let uid = localStorage.getItem("study_uid") || `user-g-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("study_uid", uid);

        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, username: randomNick, avatar: randomAvatar }),
        });

        if (response.ok) {
          const user: User = await response.json();
          setTempUser(user);
          setWelcomeAnimating(true);
          setTimeout(() => {
            onLogin(user);
          }, 2000);
        }
      } catch (e) {
        setErrorString("Google authentication gateway timeout");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleSendForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.includes("@")) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail("");
    }, 2500);
  };

  // Welcome overlay trigger
  if (welcomeAnimating && tempUser) {
    return (
      <div className="min-h-screen w-full bg-[#080808] text-white flex flex-col justify-center items-center p-6 relative" id="welcome-animation-overlay">
        <div className="absolute inset-0 bg-[radial-gradient(#AD974F_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center space-y-6"
        >
          <div className="relative inline-block">
            <motion.img 
              initial={{ rotate: -10 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={tempUser.avatar} 
              className="w-24 h-24 rounded-full object-cover border-2 border-[#AD974F] shadow-2xl p-0.5 mx-auto"
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -bottom-1 -right-1 bg-[#00f0ff] text-black px-2 py-0.5 text-[8px] font-mono tracking-widest font-extrabold uppercase rounded border border-black shadow-[0_0_8px_#00f0ff]"
            >
              READY PLAYER 1
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-white tracking-widest uppercase">
              🕹️ STUDY SQUAD STARTED ⚔️
            </h2>
            <p className="text-md font-mono text-pink-400 font-extrabold">@{tempUser.username}</p>
            <p className="text-xs text-slate-300 max-w-sm mt-3 leading-relaxed uppercase tracking-[0.15em]">
              Synchronizing with peer study rosters & allocating real-time focus proctored level multipliers...
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span 
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  className="w-1.5 h-1.5 bg-[#00f0ff] rounded-full shadow-[0_0_8px_#00f0ff]"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090614] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden" id="login-signup-viewport">
      {/* Background visual graphics */}
      <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-pink-500/5 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-[#100c22] border border-indigo-500/20 rounded-2xl p-8 shadow-[0_15px_60px_rgba(0,0,0,0.6)] relative z-10"
      >
        {/* LOGO AREA */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-gradient-to-br from-[#00f0ff] to-[#00b0ff] text-black mb-3 rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.35)] animate-bounce">
            <Gamepad2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-serif tracking-widest text-[#00f0ff] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-pink-500">
            Study Quests Arena
          </h1>
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-pink-400 font-extrabold mt-1.5">
            ⚔️ multiplayer co-op sessions & AI level-up monitors
          </p>
        </div>

        {/* LOG/SIGN SWITCHER */}
        <div className="grid grid-cols-2 border border-indigo-500/20 mb-6 select-none bg-slate-950/40 rounded-xl overflow-hidden">
          <button 
            type="button"
            onClick={() => { setFormMode("login"); setErrorString(""); }}
            className={`py-2.5 text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              formMode === "login" ? "bg-[#00f0ff] text-black font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]" : "text-stone-400 hover:text-white"
            }`}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => { setFormMode("signup"); setErrorString(""); }}
            className={`py-2.5 text-xs font-mono font-bold uppercase tracking-widest transition-all ${
              formMode === "signup" ? "bg-[#00f0ff] text-black font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]" : "text-stone-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* COMPREHENSIVE FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {formMode === "signup" && (
            <div className="space-y-4">
              {/* Profile avatar choice */}
              <div>
                <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-[0.2em] font-mono mb-2">
                  1. Choose Study Avatar Profile
                </label>
                <div className="flex items-center gap-3 bg-[#111] p-3 border border-[#222]">
                  <img
                    src={selectedAvatar}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-[#AD974F] shrink-0 p-0.5 bg-black"
                  />
                  <div>
                    <span className="text-[9px] font-mono text-stone-400 block mb-1">Click profile below to select:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {PRESET_AVATARS.map((av, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-6 h-6 rounded-full overflow-hidden border transition ${
                            selectedAvatar === av ? "border-[#AD974F] scale-110" : "border-[#333] hover:border-[#666]"
                          }`}
                        >
                          <img src={av} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Username selector */}
              <div>
                <div className="flex justify-between items-center mb-1 bg-transparent">
                  <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-[0.2em] font-mono">
                    2. Unique Study Username
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="text-[9px] text-[#AD974F] hover:text-white flex items-center gap-1 font-mono uppercase tracking-widest cursor-pointer font-bold bg-transparent border-none"
                  >
                    <Sparkles className="w-3 h-3 text-[#AD974F]" />
                    Random
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-550">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. EinsteinStudy"
                    className="w-full bg-[#050505] border border-[#222] text-xs py-2.5 pl-9 pr-4 text-white placeholder-stone-600 focus:outline-none focus:border-[#AD974F] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-[0.2em] font-mono mb-1">
              {formMode === "signup" ? "3. Email Address" : "Study Registered Email"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-550">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full bg-[#050505] border border-[#222] text-xs py-2.5 pl-9 pr-4 text-white placeholder-stone-600 focus:outline-none focus:border-[#AD974F] font-mono"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-[0.2em] font-mono mb-1">
              Credential Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-550">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#050505] border border-[#222] text-xs py-2.5 pl-9 pr-4 text-white placeholder-stone-600 focus:outline-none focus:border-[#AD974F] font-mono"
              />
            </div>
          </div>

          {/* Confirm Password input (only signup) */}
          {formMode === "signup" && (
            <div>
              <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-[0.2em] font-mono mb-1">
                Verify Password Match
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-550">
                  <KeyRound className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-[#222] text-xs py-2.5 pl-9 pr-4 text-white placeholder-stone-600 focus:outline-none focus:border-[#AD974F] font-mono"
                />
              </div>
            </div>
          )}

          {/* Remember Me & Forgot password */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider pt-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-stone-400 hover:text-stone-200">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-none border-[#333] bg-black text-[#AD974F] focus:ring-0 cursor-pointer"
              />
              <span>Remember Me</span>
            </label>

            {formMode === "login" && (
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[#AD974F] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Forgot Password?
              </button>
            )}
          </div>

          {errorString && (
            <div className="bg-rose-950/20 border border-rose-500/20 p-2.5 text-[10px] text-rose-300 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorString}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#00f0ff] to-pink-500 hover:from-[#3cebff] hover:to-pink-400 disabled:bg-stone-800 disabled:text-stone-550 active:scale-[0.98] text-black font-extrabold uppercase tracking-widest py-3.5 px-4 rounded-xl text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(0,240,255,0.25)] mt-6 hover:cursor-pointer"
          >
            {isSubmitting ? "🕹️ BOOTING STUDY INSTANCE..." : formMode === "login" ? "🎮 READY PLAYER 1: ENTER ARENA" : "👾 SPAWN NEW CHARACTER SELECTION"}
            <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
          </button>
        </form>

        {/* GOOGLE INTEGRATION DIVISION */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[#222]"></div>
          <span className="flex-shrink mx-3 text-[9px] font-mono uppercase text-stone-500 tracking-widest">or integrate</span>
          <div className="flex-grow border-t border-[#222]"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-transparent hover:bg-white hover:text-black border border-[#222] rounded-none py-2.5 text-xs text-white font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition hover:cursor-pointer active:scale-[0.98]"
        >
          <Chrome className="w-4 h-4" />
          <span>Connect via Google Roster</span>
        </button>

        <div className="mt-8 pt-4 border-t border-[#222]/60 text-center">
          <p className="text-[9px] text-[#666] uppercase tracking-[0.25em] font-mono">
            SECURE ACCESS GATEWAY • VER 4.2.0
          </p>
        </div>
      </motion.div>

      {/* RECOVER ACCOUNT MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-sm w-full bg-[#0A0A0A] border border-[#222] p-6 text-slate-205 rounded-none"
          >
            <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-3">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD974F]">
                Restore Study Credentials
              </h3>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-10 h-10 bg-[#AD974F]/10 text-[#AD974F] rounded-full flex items-center justify-center mx-auto border border-[#AD974F]/30">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <p className="text-xs font-mono text-[#AD974F] uppercase tracking-wider">Instructions Transmitted!</p>
                <p className="text-[10px] text-stone-400 max-w-xs mx-auto">
                  A dynamic restore code has been compiled and routed to <strong className="text-white">{forgotEmail}</strong>. Check your academic box.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendForgot} className="space-y-4">
                <p className="text-[10px] text-stone-400 leading-relaxed font-mono">
                  Input your study credential's email. We'll automatically route a secure ticket to verify your attendance ledger.
                </p>
                <div>
                  <label className="block text-[8px] font-extrabold text-[#AD974F] uppercase tracking-widest font-mono mb-1">
                    Scholar Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full bg-[#050505] border border-[#222] text-xs py-2 px-3 text-white focus:outline-none focus:border-[#AD974F] font-mono"
                  />
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-1.5 text-[10px] font-mono uppercase bg-[#141414] hover:bg-[#222] border border-[#222] text-stone-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 text-[10px] font-mono uppercase bg-[#AD974F] text-black font-extrabold hover:bg-[#C5AE6A] transition"
                  >
                    Send Restore Code
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
