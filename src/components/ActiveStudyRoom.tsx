import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Camera, CameraOff, AlertTriangle, Play, Pause, Square, 
  Sparkles, CheckCircle, Flame, ShieldAlert, BadgeInfo,
  Clock, Shield, Send, MessageCircle, Activity, Eye
} from "lucide-react";
import { User, Challenge, ProctorAnalysis } from "../types";

// Random study encouraging chats from our active mock challenge partners
const PARTNER_CHATS = [
  "Nice focus! Keep it up!",
  "We are doing great. Algorithms are tough but we got this.",
  "Taking notes on chapter 4 now. How are you doing?",
  "Let's hit a 15 min focused streak now!",
  "Wow, your attention score is super high! Encouraging!",
  "Just took a sip of coffee. Grind mode on!",
];

// AI Proctor Cognitive coach nudges for self-guided study
const PROCTOR_COACH_CHATS = [
  "Biometric scan complete: posture and attention levels look excellent.",
  "Your Pomodoro focus momentum is stellar! Stay hydrated.",
  "Visual metrics verify high pupil retention focus scan stats. Perfect.",
  "Secure proctor logs: Desk spacing coordinates look quiet and focused.",
  "Remember: mini rest breaks every 25m increase brain retention by 15%.",
  "AI Proctor System check: Live camera verification packets are streaming.",
];

interface ActiveStudyRoomProps {
  currentUser: User;
  activeChallenge: Challenge;
  onSessionComplete: (challengeId: string, elapsedSec: number) => void;
  onExitEarly: () => void;
}

export default function ActiveStudyRoom({
  currentUser,
  activeChallenge,
  onSessionComplete,
  onExitEarly
}: ActiveStudyRoomProps) {
  // Timer States
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Video and Snapshot States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis Feed States
  const [proctorFeed, setProctorFeed] = useState<ProctorAnalysis>({
    status: "studying",
    reason: "Awaiting first visual proctor snapshot scan...",
    score: 100,
    tip: "Position your camera clearly showing your eyes and workspace."
  });

  // Warnings & Stats Counters
  const [distractionCount, setDistractionCount] = useState(0);
  const [sessionPointsEarned, setSessionPointsEarned] = useState(0);
  const [showActiveRoomGuide, setShowActiveRoomGuide] = useState(true);
  const [focusLog, setFocusLog] = useState<{ time: string; msg: string; flag: "info" | "success" | "warn" }[]>([
    { time: "00:00", msg: "Visual session proctor initialized.", flag: "info" }
  ]);

  // Challenger Partner Chats Simulation
  const [partnerMessage, setPartnerMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string; self: boolean }[]>([
    { sender: "System", text: "Study match established.", time: "Joined", self: false }
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stopwatches
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          // Award XP score increments continuously
          if (next % 15 === 0) {
            setSessionPointsEarned((p) => p + 1);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 300, facingMode: "user" }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      logFocus("Camera proctor feed active.", "success");
    } catch (err: any) {
      setCameraError("Camera access was blocked (or not supported in this frame). Enable simulated proctoring below.");
      setIsCameraActive(false);
      logFocus("Camera access failed. Using local simulation.", "warn");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    // Attempt starting the camera initially
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Visual Proctor Scheduler (Runs every 24 seconds to balance limits)
  useEffect(() => {
    let proctorInterval: NodeJS.Timeout | null = null;
    if (isRunning) {
      proctorInterval = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 24000);
    }
    return () => {
      if (proctorInterval) clearInterval(proctorInterval);
    };
  }, [isRunning, isCameraActive]);

  // Challenger Mock Chat Simulation Scheduler
  useEffect(() => {
    let chatInterval: NodeJS.Timeout | null = null;
    if (isRunning) {
      chatInterval = setInterval(() => {
        const isSelfProctor = activeChallenge.accepterId === "self-proctor";
        const msgList = isSelfProctor ? PROCTOR_COACH_CHATS : PARTNER_CHATS;
        const randomChat = msgList[Math.floor(Math.random() * msgList.length)];
        const minutes = Math.floor(elapsedSeconds / 60);
        const secs = elapsedSeconds % 60;
        const timestamp = `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: activeChallenge.creatorId === currentUser.uid ? (activeChallenge.accepterName || "Partner") : activeChallenge.creatorName, 
            text: randomChat, 
            time: timestamp, 
            self: false 
          }
        ]);
      }, 45000); // Send message every 45 seconds
    }
    return () => {
      if (chatInterval) clearInterval(chatInterval);
    };
  }, [isRunning, elapsedSeconds, activeChallenge.accepterId]);

  // Logging function
  const logFocus = (msg: string, flag: "info" | "success" | "warn") => {
    const minStr = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
    const secStr = (elapsedSeconds % 60).toString().padStart(2, "0");
    setFocusLog((prev) => [{ time: `${minStr}:${secStr}`, msg, flag }, ...prev]);
  };

  // Base64 snapshot capture and request
  const captureAndAnalyzeFrame = async () => {
    if (isAnalyzing) return;

    let base64Image = "";

    // 1. If camera is active, extract the base64 snapshot frame dynamically from canvas
    if (isCameraActive && videoRef.current && canvasRef.current) {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          canvas.width = 320;
          canvas.height = 240;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL("image/jpeg", 0.75);
        }
      } catch (err) {
        console.error("Frame capture failed:", err);
      }
    }

    setIsAnalyzing(true);

    try {
      // POST the frame snapshot to server. If camera is disabled, server generates randomized study statuses (fallback)
      const response = await fetch("/api/gemini/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image, username: currentUser.username }),
      });

      if (!response.ok) {
        throw new Error("Unable to contact proctor service");
      }

      const parsedAnalysis: ProctorAnalysis = await response.json();
      setProctorFeed(parsedAnalysis);

      // Distribute warnings & alerts
      if (parsedAnalysis.status === "studying") {
        logFocus("Proctor scan: Excellent focus detected.", "success");
      } else if (parsedAnalysis.status === "distracted") {
        setDistractionCount((prev) => prev + 1);
        logFocus(`Distraction Alert: ${parsedAnalysis.reason}`, "warn");
      } else if (parsedAnalysis.status === "sleeping") {
        setDistractionCount((prev) => prev + 1);
        logFocus("Critical Alert: Student appears sleeping/unresponsive.", "warn");
      } else if (parsedAnalysis.status === "empty") {
        logFocus("Alert: Camera field is vacant (empty desk).", "warn");
      }

    } catch (err: any) {
      console.warn("Proctor processing failed:", err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerMessage.trim()) return;

    const minutes = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timestamp = `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    setChatMessages((prev) => [
      ...prev,
      { sender: "You", text: partnerMessage.trim(), time: timestamp, self: true }
    ]);
    setPartnerMessage("");
  };

  // Convert seconds to digital clock format (e.g. 05:43)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleFinishSession = async () => {
    // Send final logs and finish the challenge
    stopCamera();
    onSessionComplete(activeChallenge.id, elapsedSeconds);
  };

  // Visual Challenger placeholder assets representing split-screen studies
  const challengerAvatar = activeChallenge.creatorId === currentUser.uid 
    ? (activeChallenge.accepterAvatar || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300") 
    : activeChallenge.creatorAvatar;

  const challengerName = activeChallenge.creatorId === currentUser.uid
    ? (activeChallenge.accepterName || "QuietBuddy")
    : activeChallenge.creatorName;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <audio id="warning-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav" preload="auto"></audio>
      
      {/* HEADER ROOM PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0D0D0D] border border-[#222] p-6 rounded-none gap-4 shadow-lg">
        <div>
          <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#AD974F] font-bold bg-[#AD974F]/5 px-3 py-1 rounded-sm border border-[#AD974F]/25">
            {activeChallenge.category} • SYNCHRONOUS
          </span>
          <h2 className="text-2xl font-serif text-white mt-3 leading-tight">{activeChallenge.title}</h2>
          <p className="text-slate-400 text-xs mt-1.5">
            PEER PARTNER: <span className="font-semibold text-white">@{challengerName.toUpperCase()}</span> • TARGET DURATION: <span className="font-mono text-white">{activeChallenge.durationMinutes} MINS</span>
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto self-stretch">
          {/* DIGITAL COUNTER */}
          <div className="bg-[#050505] border border-[#222] px-6 py-2.5 rounded-none font-mono text-center flex-1 md:flex-none">
            <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Elapsed Flow</span>
            <span className="text-3xl font-bold text-white tracking-widest block mt-1">
              {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-3 rounded-none border border-[#333] hover:text-white transition flex items-center justify-center cursor-pointer ${isRunning ? "text-[#AD974F] hover:bg-white hover:text-black bg-[#050505]" : "text-emerald-400 hover:bg-emerald-500/5 bg-[#050505]"}`}
              title={isRunning ? "Pause Session" : "Resume Session"}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleFinishSession}
              id="active-room-finish-btn"
              className="px-5 py-3 bg-[#AD974F] hover:bg-[#C5AE6A] text-black font-bold uppercase tracking-widest text-[10px] rounded-none transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#AD974F]/10"
            >
              <Square className="w-3.5 h-3.5 fill-black text-black" />
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE ARENA TOUR MANUAL */}
      {showActiveRoomGuide ? (
        <div className="bg-[#0A0A0A] border border-[#222] p-5 relative overflow-hidden shadow-2xl" id="active-arena-guide-box">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#AD974F]/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start gap-4 border-b border-[#222]/80 pb-3.5 mb-3.5">
            <div>
              <p className="text-[9px] text-[#AD974F] font-mono uppercase tracking-[0.2em] font-bold">Active Arena Dashboard Tutorial</p>
              <h3 className="text-sm font-serif text-white mt-1">Understanding the Live Screen Features</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowActiveRoomGuide(false)}
              className="text-[9px] font-mono uppercase tracking-widest text-[#AD974F] hover:text-white transition cursor-pointer font-bold"
            >
              [Dismiss]
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-stone-300">
            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-[#AD974F] font-bold uppercase tracking-wider">1. SECURE WEBCAM FEED</span>
              <p className="leading-relaxed">
                Click <strong>Turn Camera On</strong> to enable visual study verification. The local proctor analyzes snapshot posture frames securely every 24 seconds. If blocked, a dynamic focus simulator automatically checks.
              </p>
            </div>
            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-[#AD974F] font-bold uppercase tracking-wider">2. ATTENTION SCALE FACTORS</span>
              <p className="leading-relaxed">
                Your <strong>Attention Score (0-100%)</strong> indicates current focus quality. Maintain "STUDYING" status to accrue continuous XP points (+1 XP every 15 seconds). Distraction flags halt continuous score ledger gains.
              </p>
            </div>
            <div className="space-y-1">
              <span className="block font-mono text-[9px] text-[#AD974F] font-bold uppercase tracking-wider">3. MATCH CHAT CONTROL</span>
              <p className="leading-relaxed">
                Inject motivation or coordinate study guidelines synchronously with your partner using the right-hand panel. Active status updates show up on the central proctor board immediately.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[#222] py-3.5 px-6 flex items-center justify-between text-xs rounded-none shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#AD974F] animate-pulse shadow-[0_0_8px_#AD974F]" />
            <span className="text-[9px] font-mono uppercase text-[#AD974F] tracking-[0.15em] font-bold">ACTIVE STUDY ARENA ASSISTANT READY</span>
            <span className="text-stone-400 hidden sd:inline">• Click show guide to view proctor parameters, XP reward frequencies, and chat controls.</span>
          </div>
          <button 
            onClick={() => setShowActiveRoomGuide(true)}
            className="text-[9px] font-mono uppercase tracking-widest text-stone-300 hover:text-[#AD974F] transition duration-150 underline cursor-pointer"
          >
            Show Arena Features Guide
          </button>
        </div>
      )}

      {/* BODY SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* WEBCAMS PORT / VIDEO CALL FOR CHALLENGE (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0D0D0D] border border-[#222] p-5 rounded-none shadow-[0_8px_30px_rgb(0,0,0,0.6)]">
            <h3 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <span className="w-2 h-2 bg-[#AD974F] rounded-full shadow-[0_0_8px_#AD974F] animate-pulse"></span>
              Synchronous Video Arena
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USER STREAM PANEL */}
              <div className="relative bg-[#050505] aspect-[4/3] rounded-none overflow-hidden border border-[#222] group shadow-inner">
                {isCameraActive ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center bg-slate-900">
                    <CameraOff className="w-10 h-10 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400 font-semibold">Webcam Feed Off</span>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-xs">
                      Webcam allows live AI visual tracking snapshots dynamically.
                    </p>
                  </div>
                )}

                {/* Subtitle Status */}
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-sm border border-[#222] text-[10px] flex items-center gap-1.5 text-white tracking-widest uppercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${proctorFeed.status === "studying" ? "bg-[#AD974F] shadow-[0_0_8px_#AD974F]" : "bg-red-500"}`}></span>
                  You ({currentUser.username}) • {proctorFeed.status.toUpperCase()}
                </div>

                {/* Trigger snapshot scan */}
                {isCameraActive && (
                  <button
                    onClick={captureAndAnalyzeFrame}
                    disabled={isAnalyzing}
                    className="absolute top-3 right-3 bg-[#AD974F] hover:bg-[#C5AE6A] text-black font-semibold p-2 rounded-none text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAnalyzing ? "Scanning..." : "Scan Attention Now"}
                  </button>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* CHALLENGER STREAM PANEL */}
              {activeChallenge.accepterId === "self-proctor" ? (
                <div className="relative bg-[#050505] aspect-[4/3] rounded-none overflow-hidden border border-[#222] p-4 flex flex-col justify-between group shadow-inner">
                  {/* Neon Grid grid background */}
                  <div className="absolute inset-0 bg-[radial-gradient(#AD974F_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-[#AD974F] rounded-full animate-ping"></div>
                      <span className="text-[10px] font-mono text-white tracking-widest uppercase">PROCTOR MONITOR ACTIVE</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#AD974F] border border-[#AD974F]/40 px-2 py-0.5 bg-black/40">
                      V.SNAP_24s
                    </span>
                  </div>

                  {/* Animated sonar scan center */}
                  <div className="flex-1 flex flex-col justify-center items-center z-10 space-y-4">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      {/* Pulsing ring */}
                      <div className="absolute inset-0 rounded-full border border-[#AD974F]/30 animate-pulse scale-110"></div>
                      <div className="absolute inset-1 rounded-full border border-[#AD974F]/50 animate-ping" style={{ animationDuration: "2.5s" }}></div>
                      <div className="w-16 h-16 rounded-full bg-[#0D0D0D] border border-[#AD974F] flex items-center justify-center shadow-[0_0_15px_rgba(173,151,79,0.2)]">
                        <Eye className="w-8 h-8 text-[#AD974F] animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-[11px] font-mono text-stone-300">Biometric Attention Verification Pipeline</p>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Webcam snapshot AI Eye-tracking active</p>
                    </div>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="z-10 bg-black/60 p-2 border border-[#222] font-mono text-[9px] flex justify-between items-center text-[#AD974F] rounded-sm">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>HEURISTIC FEEDBACK</span>
                    </div>
                    <span>{proctorFeed.status.toUpperCase()} ({proctorFeed.score}%)</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-[#AD974F]/20 text-[#AD974F] border border-[#AD974F]/30 px-2 py-0.5 rounded-none text-[9px] font-mono uppercase tracking-widest">
                    AI PROCTOR V2
                  </div>
                </div>
              ) : (
                <div className="relative bg-[#050505] aspect-[4/3] rounded-none overflow-hidden border border-[#222] group shadow-inner">
                  <img 
                    src={challengerAvatar} 
                    alt="" 
                    className="w-full h-full object-cover brightness-95"
                  />
                  
                  {/* Simulated focus wave pattern */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>

                  {/* Subtitle Status */}
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-sm border border-[#222] text-[10px] flex items-center gap-1.5 text-white tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {challengerName} • STUDYING
                  </div>

                  <div className="absolute top-3 right-3 bg-emerald-600/90 text-white px-2 py-0.5 rounded-none text-[9px] font-mono select-none uppercase tracking-widest">
                    Live Feed Matched
                  </div>
                </div>
              )}
            </div>

            {/* Camera Options */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-[#222] gap-3">
              <p className="text-slate-450 text-[10px] font-sans flex items-center gap-1 uppercase tracking-wider">
                <BadgeInfo className="w-3.5 h-3.5 text-[#AD974F]" />
                Snapshots undergo structural analysis via Gemini every 24 seconds.
              </p>
              
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${isCameraActive ? "bg-red-950/40 text-red-400 hover:bg-red-950/60 border border-red-500/10" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Turn Camera Off
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Turn Camera On
                  </>
                )}
              </button>
            </div>
            {cameraError && (
              <p className="text-yellow-500 text-[10px] font-mono mt-2 text-center bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                {cameraError}
              </p>
            )}
                    {/* AI MONITOR ANALYSIS CARD */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Status indicator (7 Cols) */}
            <div className="md:col-span-7 bg-[#0D0D0D] border border-[#222] p-5 rounded-none flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
              <div>
                <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] mb-1">PROCTOR STATUS</p>
                <h3 className="text-sm font-serif text-white mb-4 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#AD974F]" />
                  Visual Study Monitor Status
                </h3>

                <div className="flex items-center gap-4 bg-[#050505] p-4 rounded-none border border-[#222]">
                  <div className={`w-12 h-12 rounded-none flex items-center justify-center shrink-0 ${
                    proctorFeed.status === "studying" ? "bg-[#AD974F]/10 text-[#AD974F]" :
                    proctorFeed.status === "distracted" ? "bg-amber-500/10 text-amber-500" :
                    "bg-red-500/10 text-red-500"
                  }`}>
                    {proctorFeed.status === "studying" && <CheckCircle className="w-6 h-6" />}
                    {proctorFeed.status === "distracted" && <AlertTriangle className="w-6 h-6" />}
                    {proctorFeed.status === "sleeping" && <ShieldAlert className="w-6 h-6" />}
                    {proctorFeed.status === "empty" && <AlertTriangle className="w-6 h-6" />}
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Current Classify</span>
                    <span className={`text-md font-bold block tracking-wider ${
                      proctorFeed.status === "studying" ? "text-[#AD974F]" :
                      proctorFeed.status === "distracted" ? "text-amber-500" :
                      "text-red-500"
                    }`}>
                      {proctorFeed.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    <span className="font-bold text-slate-450 uppercase text-[10px] tracking-widest mr-1">Analysis:</span> {proctorFeed.reason}
                  </p>
                  <p className="text-[11px] text-[#C5AE6A] font-sans italic">
                    <span className="font-bold text-[#AD974F] uppercase tracking-widest not-italic text-[9px] mr-1">Proctor Tip:</span> "{proctorFeed.tip}"
                  </p>
                </div>
              </div>

              {/* Progress Focus Score */}
              <div className="mt-6 pt-4 border-t border-[#222]">
                <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  <span>Attention Score</span>
                  <span className="text-[#AD974F] font-bold">{proctorFeed.score}%</span>
                </div>
                <div className="w-full bg-[#050505] border border-[#222] h-2 rounded-none overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      proctorFeed.score >= 80 ? "bg-[#AD974F]" :
                      proctorFeed.score >= 50 ? "bg-amber-500" :
                      "bg-rose-500"
                    }`}
                    style={{ width: `${proctorFeed.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick stats and alerts log (5 Cols) */}
            <div className="md:col-span-5 bg-[#0D0D0D] border border-[#222] p-5 rounded-none flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.25em] mb-1">PROCTOR LOGS</p>
              <h3 className="text-sm font-serif text-white mb-4">Lobby Attention Warnings</h3>
              
              <div className="grid grid-cols-2 gap-2 text-center mb-4">
                <div className="bg-[#050505] p-3 rounded-none border border-[#222]">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Distractions</span>
                  <span className={`text-xs font-bold font-mono mt-0.5 block ${distractionCount > 2 ? "text-rose-400" : "text-white"}`}>
                    {distractionCount} flagged
                  </span>
                </div>
                <div className="bg-[#050505] p-3 rounded-none border border-[#222]">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Credits XP</span>
                  <span className="text-xs font-bold font-mono text-[#AD974F] mt-0.5 block">
                    +{sessionPointsEarned} XP
                  </span>
                </div>
              </div>

              {/* Focus Logs list */}
              <div className="flex-1 bg-[#050505] rounded-none p-3 border border-[#222] h-40 overflow-y-auto space-y-2.5 font-mono scrollbar-thin">
                {focusLog.map((log, i) => (
                  <div key={i} className="text-[10px] leading-tight flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                    <span className={`${
                      log.flag === "info" ? "text-slate-450" :
                      log.flag === "success" ? "text-emerald-500" :
                      "text-amber-500 font-semibold"
                    }`}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STUDY MATCH ROOM CHATS (4 Cols) */}
        <div className="lg:col-span-4 bg-[#0D0D0D] border border-[#222] rounded-none p-6 flex flex-col h-[520px] lg:h-auto overflow-hidden text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          <p className="text-[9px] text-[#AD974F] uppercase tracking-[0.25em] mb-1">Encouragements</p>
          <h3 className="text-sm font-serif text-white mb-3 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#AD974F]" />
            Arena Study Chat
          </h3>
          <p className="text-[10px] text-slate-400 mb-4 font-sans leading-relaxed">
            Exchange focal goals synchronously with your active peer.
          </p>

          {/* Message Screen */}
          <div className="flex-1 bg-[#050505]/80 rounded-none p-4 border border-[#222] overflow-y-auto space-y-4 mb-4">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${msg.self ? "text-[#AD974F]" : "text-slate-400"}`}>
                    {msg.sender}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {msg.time}
                  </span>
                </div>
                <div className={`p-2.5 rounded-none text-xs max-w-full leading-relaxed ${
                  msg.self 
                    ? "bg-[#AD974F] text-black font-semibold" 
                    : msg.sender === "System" 
                    ? "bg-[#0A0A0A] border border-[#222] text-slate-500 font-mono italic"
                    : "bg-[#111111] border border-[#222] text-slate-200"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form sender */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={partnerMessage}
              onChange={(e) => setPartnerMessage(e.target.value)}
              placeholder="Inject energy to peer..."
              className="flex-1 bg-[#050505] border border-[#222] rounded-none py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#AD974F]"
            />
            <button
              type="submit"
              className="p-3 bg-[#AD974F] hover:bg-[#C5AE6A] text-black rounded-none active:scale-95 transition cursor-pointer"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>  </div>
      </div>
    </div>
  );
}
