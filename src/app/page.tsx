"use client";

import { useState, useEffect } from "react";
import { StarsBackground } from "@/components/StarsBackground";
import { ShootingStars } from "@/components/ShootingStars";

export default function Home() {
  const [sfaLive, setSfaLive] = useState(false);
  const [aiLive, setAiLive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [status, setStatus] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const API_URL = "https://cjc43qk5d6o2ftzkngskpjp3dy0suvmi.lambda-url.ap-south-1.on.aws/";

  useEffect(() => {
    setMounted(true);

    const checkServerStatus = async () => {
      // Check SFA Server
      try {
        const sfaRes = await fetch("https://api-sfa.noukha.in/api/noukha-mdm-service/health");
        setSfaLive(sfaRes.ok);
      } catch (err) {
        setSfaLive(false);
      }

      // Check AI Server
      try {
        const aiRes = await fetch("https://ai.noukha.in/ocr/api/health");
        setAiLive(aiRes.ok);
      } catch (err) {
        setAiLive(false);
      }
    };

    // Initial check on load
    checkServerStatus();

    // Poll every 30 seconds to keep UI in sync with backend
    const interval = setInterval(() => {
      checkServerStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const callApi = async (body: any, key: string, onSuccess: () => void) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setStatus({ msg: `Executing ${body.action} for ${body.name || 'All'}...`, type: null });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
        setStatus({ msg: `Successfully ${body.action === 'start' ? 'started' : 'stopped'} ${body.name || 'All Servers'}`, type: 'success' });
      } else {
        throw new Error("Failed to execute command");
      }
    } catch (err) {
      console.error(err);
      setStatus({ msg: `Error: Could not ${body.action} server`, type: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
      setTimeout(() => setStatus({ msg: '', type: null }), 5000);
    }
  };

  const toggleSfa = () => {
    const action = sfaLive ? "stop" : "start";
    callApi({ action, name: "Noukha-SFA" }, 'sfa', () => setSfaLive(!sfaLive));
  };

  const toggleAi = () => {
    const action = aiLive ? "stop" : "start";
    callApi({ action, name: "Noukha-AI" }, 'ai', () => setAiLive(!aiLive));
  };

  const toggleAll = () => {
    const action = (sfaLive && aiLive) ? "stop" : "start";
    // For all servers, we send environment: "demo" and NO name as per instructions
    callApi({ action, environment: "demo" }, 'all', () => {
      const newState = action === "start";
      setSfaLive(newState);
      setAiLive(newState);
    });
  };

  const allActive = sfaLive && aiLive;

  if (!mounted) return <div className="min-h-screen bg-[#0F110E]" />;

  return (
    <div className="min-h-screen bg-[#0F110E] text-white selection:bg-[#14A842]/30 flex flex-col relative overflow-hidden">
      {/* Background Components */}
      <div className="absolute inset-0 z-0">
        <StarsBackground />
        <ShootingStars />
      </div>

      <header className="border-b border-white/5 bg-[#0F110E]/50 backdrop-blur-md sticky top-0 z-50 boot-animation">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src="/logo.svg" alt="Noukha Logo" className="w-32" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono leading-none">
                <span className={`w-1.5 h-1.5 rounded-full ${sfaLive ? 'bg-[#14A842]' : 'bg-red-500 animate-pulse'}`} />
                SFA: {sfaLive ? 'ACTIVE' : 'OFFLINE'}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono leading-none">
                <span className={`w-1.5 h-1.5 rounded-full ${aiLive ? 'bg-[#14A842]' : 'bg-red-500 animate-pulse'}`} />
                AI: {aiLive ? 'ACTIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-grow flex flex-col w-full">
        {/* Status Toast */}
        {status.msg && (
          <div className={`fixed bottom-24 right-6 px-6 py-3 rounded-xl border backdrop-blur-xl z-[100] transition-all animate-in fade-in slide-in-from-right-4 
            ${status.type === 'success' ? 'bg-[#14A842]/10 border-[#14A842]/30 text-[#14A842]' :
              status.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                'bg-white/5 border-white/10 text-zinc-400'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-[#14A842]' : status.type === 'error' ? 'bg-red-500' : 'bg-white animate-pulse'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{status.msg}</span>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-grow boot-animation" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Server <span className="gradient-text">Control Center</span>
            </h1>
            <p className="text-zinc-400 max-w-xl text-lg">
              Manage and monitor independent environments for SFA and AI products.
            </p>
          </div>
          <button
            onClick={toggleAll}
            disabled={loading['all']}
            style={{ animationDelay: '0.2s' }}
            className={`boot-animation group relative flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden border
              ${loading['all'] ? 'opacity-50 cursor-wait' : ''}
              ${allActive
                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                : 'bg-[#14A842]/10 text-[#14A842] border-[#14A842]/20 hover:bg-[#14A842]/20 shadow-[0_0_30px_rgba(20,168,66,0.1)]'
              }`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${allActive ? 'from-red-500/10 to-transparent' : 'from-[#14A842]/10 to-transparent'}`} />

            <div className="relative flex items-center gap-3">
              {loading['all'] ? (
                <svg className="animate-spin h-3 w-3 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              ) : (
                <div className={`w-2.5 h-2.5 rounded-full shadow-lg transition-all duration-500 ${allActive ? 'bg-red-500 shadow-red-500/50' : 'bg-[#14A842] shadow-[#14A842]/50 animate-pulse'}`} />
              )}
              {allActive ? 'Shutdown All' : 'Execute Launch'}
            </div>
          </button>
        </div>

        {/* Server Control List */}
        <section className="flex flex-col gap-3 mb-8">
          {/* SFA Server Row */}
          <div
            style={{ animationDelay: '0.3s' }}
            className={`boot-animation glass p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-[#14A842]/20 transition-all duration-500 ${sfaLive ? 'bg-[#14A842]/[0.05] border-[#14A842]/30' : 'bg-white/[0.02]'}`}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${sfaLive ? 'bg-[#14A842]/20 border-[#14A842]/40 text-[#14A842] shadow-[0_0_15px_rgba(20,168,66,0.2)]' : 'bg-zinc-800 border-white/10 text-zinc-500'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold italic tracking-tight uppercase leading-tight">Noukha-SFA</h2>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${sfaLive ? 'bg-[#14A842] animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest leading-none">
                    {sfaLive ? 'Running' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
              <p className="text-zinc-500 text-xs hidden lg:block italic">Force Automation environment</p>
              <button
                onClick={toggleSfa}
                disabled={loading['sfa']}
                className={`relative inline-flex h-10 w-24 items-center rounded-full transition-all duration-300 focus:outline-none ${loading['sfa'] ? 'opacity-50 cursor-wait' : ''} ${sfaLive ? 'bg-[#14A842] shadow-[0_0_15px_rgba(20,168,66,0.3)]' : 'bg-zinc-800'}`}
              >
                <span className="sr-only">Toggle SFA Server</span>
                <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-all duration-300 ${sfaLive ? 'translate-x-[58px]' : 'translate-x-[4px]'}`} />
                <span className={`absolute text-[9px] font-black uppercase transition-all duration-300 ${sfaLive ? 'left-3 opacity-100 text-white' : 'left-3 opacity-0 text-zinc-500'}`}>ON</span>
                <span className={`absolute text-[9px] font-black uppercase transition-all duration-300 ${sfaLive ? 'right-3 opacity-0 text-[#14A842]' : 'right-3 opacity-100 text-zinc-400'}`}>OFF</span>
                {loading['sfa'] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0F110E]/40 rounded-full">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* AI Server Row */}
          <div
            style={{ animationDelay: '0.4s' }}
            className={`boot-animation glass p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-[#14A842]/20 transition-all duration-500 ${aiLive ? 'bg-[#14A842]/[0.05] border-[#14A842]/30' : 'bg-white/[0.02]'}`}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${aiLive ? 'bg-[#14A842]/20 border-[#14A842]/40 text-[#14A842] shadow-[0_0_15px_rgba(20,168,66,0.2)]' : 'bg-zinc-800 border-white/10 text-zinc-500'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold italic tracking-tight uppercase leading-tight">Noukha-AI</h2>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${aiLive ? 'bg-[#14A842] animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest leading-none">
                    {aiLive ? 'Running' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
              <p className="text-zinc-500 text-xs hidden lg:block italic">Artificial Intelligence & LLM demo server</p>
              <button
                onClick={toggleAi}
                disabled={loading['ai']}
                className={`relative inline-flex h-10 w-24 items-center rounded-full transition-all duration-300 focus:outline-none ${loading['ai'] ? 'opacity-50 cursor-wait' : ''} ${aiLive ? 'bg-[#14A842] shadow-[0_0_15px_rgba(20,168,66,0.3)]' : 'bg-zinc-800'}`}
              >
                <span className="sr-only">Toggle AI Server</span>
                <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-all duration-300 ${aiLive ? 'translate-x-[58px]' : 'translate-x-[4px]'}`} />
                <span className={`absolute text-[9px] font-black uppercase transition-all duration-300 ${aiLive ? 'left-3 opacity-100 text-white' : 'left-3 opacity-0 text-zinc-500'}`}>ON</span>
                <span className={`absolute text-[9px] font-black uppercase transition-all duration-300 ${aiLive ? 'right-3 opacity-0 text-[#14A842]' : 'right-3 opacity-100 text-zinc-400'}`}>OFF</span>
                {loading['ai'] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0F110E]/40 rounded-full">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  </div>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{ animationDelay: '0.5s' }}
          className="boot-animation mt-auto pt-8 border-t border-white/5 text-center text-zinc-600 text-sm"
        >
          <p>© 2026 Noukha Technologies. Internal Use Only.</p>
        </footer>
      </main>
    </div>
  );
}
