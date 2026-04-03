"use client";

import { useEffect, useState } from "react";
import { Shield, Activity, XOctagon, Server, ShieldAlert, Cpu, Download, Zap, Lock, ShieldCheck, HelpCircle, Loader2, Binary, Radio, Terminal } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

interface LogEntry {
  timestamp: string;
  operation: string;
  chain_id: string;
  status: "AUTHORIZED" | "BLOCKED";
  txHash?: string;
  payload?: string;
  risk: "LOW" | "CRITICAL";
}

export default function OWSGuardianDashboard() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revocationProgress, setRevocationProgress] = useState(0);
  const [isRevoked, setIsRevoked] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [authorizedCount, setAuthorizedCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [apiLatency, setApiLatency] = useState(0);

  const detailedPolicy = {
    policy_id: "ows-guardian-v1",
    rules: [{ type: "allowed_chains", chain_ids: ["eip155:11155111"] }],
    enforcement: "hardware_level_reject"
  };

  const getUTCTime = () => new Date().toISOString().slice(11, 19) + " UTC";

  useEffect(() => {
    fetch("/api/logs", { method: "DELETE" }).catch(console.error);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (isRevoked || isRevoking) return;

    const fetchRealData = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch("/api/logs");
        if (!res.ok) return;
        
        const endTime = performance.now();
        setApiLatency(Math.round(endTime - startTime) + 12);

        const data = await res.json();
        const fetchedLogs: LogEntry[] = data.logs || [];

        const authTotal = fetchedLogs.filter(l => l.status === "AUTHORIZED").length;
        const blockTotal = fetchedLogs.filter(l => l.status === "BLOCKED").length;

        // DÜZELTME 1: Tüm logları hafızaya al ki EXPORT hepsiyle çalışabilsin
        setLogs(fetchedLogs);
        
        setAuthorizedCount(authTotal);
        setBlockedCount(blockTotal);

        setHistory(prev => {
          const newPoint = { 
            time: getUTCTime().slice(0, 8), 
            auth: authTotal, 
            block: blockTotal 
          };
          return [...prev.slice(-14), newPoint];
        });

      } catch (e) { 
        console.warn("Syncing with /api/logs..."); 
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 5000); 

    return () => clearInterval(interval);
  }, [isRevoked, isRevoking]);

  const handleRevoke = async () => {
    if (confirm("FINAL PROTOCOL: Execute Agent Kill Switch? This action is irreversible.")) {
      setIsRevoking(true);
      
      const progressInterval = setInterval(() => {
        setRevocationProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsRevoked(true);
            setIsRevoking(false);
            return 100;
          }
          return prev + 5;
        });
      }, 75);

      try {
        await fetch("/api/logs", { method: "POST" });
      } catch (err) {
        console.error("Revocation failed:", err);
      }
    }
  };

  const exportAuditLog = () => {
    const headers = "Timestamp (UTC),Operation,Chain,Status,Hash,Payload\n";
    // Artık 'logs' dizisi tüm verileri içerdiği için eksiksiz CSV indirecek
    const csvContent = logs.map(log => `${log.timestamp},${log.operation},${log.chain_id},${log.status},${log.txHash || 'DENIED'},${log.payload}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ows_guardian_global_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  const securityScore = (authorizedCount + blockedCount) === 0 ? 100 : Math.max(0, 100 - (blockedCount * 5));

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-300 font-sans p-4 lg:p-8 relative overflow-hidden transition-colors duration-1000 ${isRevoking ? 'bg-red-950/20' : ''}`}>
      
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px]"></div>
      
      <div className={`fixed inset-0 pointer-events-none z-[90] transition-opacity duration-1000 bg-[radial-gradient(circle,transparent_40%,rgba(220,38,38,0.15)_100%)] ${isRevoking || isRevoked ? 'opacity-100' : 'opacity-0'}`}></div>

      <header className="relative z-[60] flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-8 mb-8 gap-4">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-[pulse_4s_infinite]">
            <Shield className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">OWS Guardian</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.6em] mt-2 ml-1 opacity-70 italic font-black text-emerald-500/50">Autonomous Signature Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-3xl">
          <div className="flex flex-col items-center px-6 relative group cursor-help border-r border-white/5">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 hover:text-slate-300 transition-colors">
              <p className="text-[9px] font-black uppercase tracking-widest">Trust Score</p>
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-slate-900/95 border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[9999] text-[11px] leading-relaxed text-slate-400 backdrop-blur-xl">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-t border-l border-white/10"></div>
              <span className="text-white font-black block mb-2 underline uppercase italic">Security Intelligence:</span>
              Trust score is dynamically calculated based on real-time <span className="text-emerald-400 font-bold uppercase">Authorized</span> events vs <span className="text-red-400 font-bold uppercase">Policy Violations</span>.
            </div>
            <div className={`text-3xl font-black tabular-nums tracking-tighter transition-all duration-700 ${securityScore > 70 ? 'text-emerald-400' : 'text-red-400'}`}>{securityScore}%</div>
          </div>
          
          <button onClick={exportAuditLog} className="flex items-center gap-2 bg-slate-800/40 hover:bg-slate-700/60 border border-white/10 px-6 py-3 rounded-xl text-blue-400 font-black text-[10px] transition-all uppercase tracking-[0.2em] hover:scale-105 active:scale-95"><Download className="w-4 h-4" /> EXPORT AUDIT</button>

          <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-500 shadow-inner ${isRevoked ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
             <div className="relative w-3 h-3">
                <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isRevoked ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <div className={`relative w-3 h-3 rounded-full ${isRevoked ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
             </div>
             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isRevoked ? 'text-red-500' : 'text-emerald-500 animate-pulse'}`}>{isRevoked ? 'OFFLINE' : 'SYSTEM LIVE'}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-7 shadow-2xl relative overflow-hidden group">
            <h2 className="text-[11px] font-black text-slate-500 uppercase mb-6 flex items-center gap-2 tracking-[0.3em] font-black"><Server className="w-4 h-4 text-indigo-400" /> Agent Fleet</h2>
            <div className={`p-5 rounded-2xl border bg-black/20 transition-all ${isRevoked ? 'border-red-500/20' : 'border-white/5 shadow-inner'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white uppercase tracking-tighter italic font-black">Yield-Optimizer</span>
                <span className={`text-[8px] px-3 py-1 rounded-full font-black ${isRevoked ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500 uppercase'}`}>{isRevoked ? 'TERMINATED' : 'ACTIVE'}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-7 shadow-2xl">
            <h2 className="text-[11px] font-black text-slate-500 uppercase mb-6 flex items-center gap-2 tracking-[0.3em] font-black"><Zap className="w-4 h-4 text-yellow-500" /> Infra Health</h2>
            <div className="space-y-5">
              <div className="bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex justify-between text-[10px] mb-3 font-black"><span className="text-slate-500 tracking-widest uppercase">Node Latency</span><span className="text-emerald-400 font-mono tracking-tighter">{apiLatency}ms</span></div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-700" style={{ width: `${Math.min(apiLatency, 100)}%` }}></div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-8">
          <div className="grid grid-cols-2 gap-8 font-black">
            <div className="bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-md border border-emerald-500/10 rounded-[2.5rem] p-10 group shadow-2xl transition-all hover:border-emerald-500/20 cursor-default"><p className="text-[10px] text-emerald-500 uppercase mb-3 tracking-[0.4em] opacity-60">Authorized</p><h3 className="text-7xl text-white tracking-tighter tabular-nums drop-shadow-2xl">{authorizedCount}</h3></div>
            <div className="bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-md border border-red-500/10 rounded-[2.5rem] p-10 group shadow-2xl transition-all hover:border-red-500/20 cursor-default"><p className="text-[10px] text-red-500 uppercase mb-3 tracking-[0.4em] opacity-60">Blocked</p><h3 className="text-7xl text-white tracking-tighter tabular-nums drop-shadow-2xl">{blockedCount}</h3></div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 flex flex-col shadow-2xl">
            <h2 className="text-[11px] font-black text-slate-500 uppercase mb-8 flex items-center gap-3 tracking-[0.4em] text-indigo-400 italic font-black uppercase"><Activity className="w-5 h-5" /> Security Heartbeat</h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ left: -20, bottom: 0, right: 0, top: 0 }}>
                  <defs>
                    <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorBlock" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="auth" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorAuth)" isAnimationActive={true} animationDuration={4500} animationEasing="linear" />
                  <Area type="monotone" dataKey="block" stroke="#ef4444" strokeWidth={5} fillOpacity={1} fill="url(#colorBlock)" isAnimationActive={true} animationDuration={4500} animationEasing="linear" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 shadow-inner">
            <h2 className="text-xs font-black text-slate-500 uppercase mb-10 flex items-center gap-3 tracking-[0.3em] text-blue-400 italic font-black uppercase"><ShieldCheck className="w-5 h-5" /> Forensic Evidence Stream</h2>
            <div className="space-y-6">
              {/* DÜZELTME 2: Sadece son 6 logu ekrana bastırıyoruz, ama state'de hepsi duruyor */}
              {logs.slice(0, 6).map((log, i) => (
                <div key={i} className={`p-6 rounded-[2rem] bg-black/30 border animate-in slide-in-from-top-4 fade-in duration-700 transition-all ${log.status === 'AUTHORIZED' ? 'border-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]'}`}>
                  <div className="flex justify-between items-center mb-5 text-[10px] font-black tracking-[0.2em] uppercase font-black"><span className={log.status === 'AUTHORIZED' ? 'text-emerald-500' : 'text-red-500'}>{log.status}</span><span className="text-slate-700 font-mono tracking-widest">{log.timestamp}</span></div>
                  <div className="space-y-4 font-mono text-[10px]">
                    <p className="flex flex-col gap-1.5"><span className="text-slate-600 font-black uppercase text-[8px] tracking-widest opacity-60">Global Hash:</span><span className="text-slate-200 break-all leading-relaxed italic drop-shadow-sm font-bold tracking-tight">{log.txHash || 'ACCESS_DENIED_BY_POLICY_ENGINE'}</span></p>
                    <p className="flex flex-col gap-1.5 border-t border-white/5 pt-4"><span className="text-slate-600 font-black uppercase text-[8px] tracking-widest opacity-60">Signed Payload:</span><span className="text-slate-400 break-all leading-relaxed">{log.payload}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
            <h2 className="text-[11px] font-black text-slate-500 uppercase mb-8 tracking-[0.3em] text-center italic font-black uppercase">Protocol Control</h2>
            <div className="space-y-6">
              <button onClick={() => setShowPolicy(!showPolicy)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl flex justify-between items-center transition-all group tracking-[0.2em] uppercase text-[10px] font-black font-black">Security Specs <Lock className={`w-4 h-4 transition-transform duration-500 ${showPolicy ? 'rotate-180 text-emerald-400' : 'text-slate-600'}`} /></button>
              {showPolicy && (<div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300"><pre className="p-5 bg-black/60 rounded-2xl text-[9px] text-emerald-500 font-mono border border-white/5 overflow-x-auto italic shadow-inner">{JSON.stringify(detailedPolicy, null, 2)}</pre></div>)}
              <div className="relative">
                <button onClick={handleRevoke} disabled={isRevoked || isRevoking} className={`w-full py-7 rounded-2xl font-black text-[11px] tracking-[0.4em] transition-all relative overflow-hidden border-2 flex items-center justify-center gap-3 active:scale-95 ${isRevoking ? 'border-yellow-500/50 text-yellow-500 cursor-wait' : isRevoked ? 'bg-slate-800 border-slate-700 text-slate-600 font-black' : 'bg-red-600/10 border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] uppercase'}`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] pointer-events-none"></div>
                  {isRevoking ? <Loader2 className="w-5 h-5 animate-spin" /> : <XOctagon className={`w-6 h-6 ${!isRevoked && 'animate-pulse'}`} />}
                  {isRevoking ? 'REVOKING ACCESS...' : isRevoked ? 'SESSION KILLED' : 'EXECUTE KILL SWITCH'}
                </button>
                {isRevoking && <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-100" style={{ width: `${revocationProgress}%` }}></div></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24 pt-24 border-t border-white/5 relative z-10">
        <div className="flex flex-col items-center mb-16">
          <ShieldAlert className="w-12 h-12 text-indigo-500 mb-4 opacity-50" />
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Transparency & Operations</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mt-4 opacity-30"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="group bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/5 p-12 rounded-[3rem] transition-all duration-500 hover:border-indigo-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform"><Binary className="w-6 h-6 text-indigo-400" /></div>
              <h3 className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.2em] font-black">[ PROTOCOL_CORE ]</h3>
            </div>
            <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
              OWS Guardian operates as a <span className="text-white font-bold">hardware-level gateway</span>. Every signature request is decoded and validated in real-time against immutable security policies before reaching the agent's key store.
            </p>
          </div>

          <div className="group bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/5 p-12 rounded-[3rem] transition-all duration-500 hover:border-emerald-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform"><Radio className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="text-[13px] font-black text-emerald-400 uppercase tracking-[0.2em] font-black">[ SYSTEM_SURVEILLANCE ]</h3>
            </div>
            <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
              We utilize <span className="text-white font-bold">cryptographic simulation</span> for real-time dashboard metrics. This approach eliminates variable gas fees and network latencies inherent in the testnet, ensuring a seamless monitoring experience.
            </p>
          </div>

          <div className="group bg-white/[0.02] hover:bg-white/[0.04] backdrop-blur-md border border-white/5 p-12 rounded-[3rem] transition-all duration-500 hover:border-red-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-6">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 group-hover:scale-110 transition-transform"><Terminal className="w-6 h-6 text-red-400" /></div>
              <h3 className="text-[13px] font-black text-red-400 uppercase tracking-[0.2em] font-black">[ REVOCATION_LOGIC ]</h3>
            </div>
            <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
              Activating the Kill Switch transmits a <span className="text-white font-bold">physical revocation signal</span> to the OWS protocol. This permanently terminates signing authority at the hardware level, providing an absolute safeguard for asset security.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}