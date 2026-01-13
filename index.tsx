
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCcw, 
  Wallet,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Info,
  PauseCircle,
  XCircle,
  Database,
  Heart,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Zap,
  Layers,
  Globe
} from 'lucide-react';

// --- Constants & Types ---

const MODEL_NAME = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

interface Counterfactual {
  followAnnual: number;
  ignoreAnnual: number;
  wastedSpendEstimate: number;
}

interface SubscriptionAnalysis {
  name: string;
  billingCycle: string;
  cost: number;
  intentScore: number;
  behavioralCategory: string;
  regretProbability: 'Low' | 'Medium' | 'High';
  recommendedAction: string;
  recommendedTiming: string;
  explanationSignals: string[];
  humanExplanation: string;
  counterfactualSavings: Counterfactual;
  confidence: number;
  assumption: string;
}

type AppScreen = 'dashboard' | 'dataset';

// --- Mock Data & Initial State ---

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'n1', merchant: 'Netflix', amount: 15.99, date: '2023-11-15', category: 'Entertainment' },
  { id: 'n2', merchant: 'Netflix', amount: 15.99, date: '2023-12-15', category: 'Entertainment' },
  { id: 'n3', merchant: 'Netflix', amount: 15.99, date: '2024-01-15', category: 'Entertainment' },
  { id: 'n4', merchant: 'Netflix', amount: 15.99, date: '2024-02-15', category: 'Entertainment' },
  { id: 'n5', merchant: 'Netflix', amount: 15.99, date: '2024-03-15', category: 'Entertainment' },
  { id: 'n6', merchant: 'Netflix', amount: 15.99, date: '2024-04-15', category: 'Entertainment' },
  { id: 'n7', merchant: 'Netflix', amount: 15.99, date: '2024-05-15', category: 'Entertainment' },
  { id: 'a1', merchant: 'Adobe Creative', amount: 52.99, date: '2023-11-01', category: 'Software' },
  { id: 'a2', merchant: 'Adobe Creative', amount: 52.99, date: '2023-12-01', category: 'Software' },
  { id: 'a3', merchant: 'Adobe Creative', amount: 52.99, date: '2024-01-01', category: 'Software' },
  { id: 'd1', merchant: 'Disney+', amount: 10.99, date: '2023-11-10', category: 'Entertainment' },
  { id: 'd2', merchant: 'Disney+', amount: 10.99, date: '2023-12-10', category: 'Entertainment' },
  { id: 'g1', merchant: 'FitFocus Gym', amount: 45.00, date: '2023-11-20', category: 'Health' },
  { id: 'c1', merchant: 'CloudStorage', amount: 9.99, date: '2023-11-05', category: 'Software' },
];

const INITIAL_ANALYSIS: SubscriptionAnalysis[] = [
  {
    name: "Netflix",
    billingCycle: "monthly",
    cost: 15.99,
    intentScore: 42,
    behavioralCategory: "Passive Consumer",
    regretProbability: "High",
    recommendedAction: "Pause Era",
    recommendedTiming: "Immediate",
    explanationSignals: ["Low Engagement", "Price Drift", "Category Overlap"],
    humanExplanation: "Your consumption metrics show a 60% decay in title completion over the last 3 months. This is a classic 'ghost subscription' pattern.",
    counterfactualSavings: {
      followAnnual: 110.00,
      ignoreAnnual: 191.88,
      wastedSpendEstimate: 81.88
    },
    confidence: 94,
    assumption: "Viewing habits remain at current plateau."
  },
  {
    name: "Adobe Creative",
    billingCycle: "monthly",
    cost: 52.99,
    intentScore: 89,
    behavioralCategory: "Professional Power",
    regretProbability: "Low",
    recommendedAction: "Upgrade Annual",
    recommendedTiming: "Next Cycle",
    explanationSignals: ["High Utility", "Tool Depth", "Zero Regret"],
    humanExplanation: "Engagement remains at peak professional levels. Transitioning to an annual vault lock will optimize your capital efficiency by 22%.",
    counterfactualSavings: {
      followAnnual: 480.00,
      ignoreAnnual: 635.88,
      wastedSpendEstimate: 155.88
    },
    confidence: 98,
    assumption: "Freelance throughput continues to scale."
  },
  {
    name: "Disney+",
    billingCycle: "monthly",
    cost: 10.99,
    intentScore: 15,
    behavioralCategory: "Dormant Node",
    regretProbability: "High",
    recommendedAction: "Cancel Vault",
    recommendedTiming: "Immediate",
    explanationSignals: ["Zero Usage", "Redundant Content", "Auto-Renewal Loop"],
    humanExplanation: "Our sensors haven't detected a single login event in 68 days. You are effectively donating wealth to a mega-corp.",
    counterfactualSavings: {
      followAnnual: 0.00,
      ignoreAnnual: 131.88,
      wastedSpendEstimate: 131.88
    },
    confidence: 99,
    assumption: "No kids have requested 'Bluey' in the last 24 hours."
  }
];

// --- Custom Hook for Cursor Tracking ---

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return mousePosition;
};

// --- Components ---

const CustomCursor = () => {
  const { x, y } = useMousePosition();
  return (
    <>
      <div 
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-difference transition-transform duration-75 ease-out md:block hidden"
        style={{ transform: `translate(${x - 16}px, ${y - 16}px)`, border: '2px solid white' }}
      />
      <div 
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-[-1] blur-[120px] opacity-20 md:block hidden"
        style={{ 
          transform: `translate(${x - 200}px, ${y - 200}px)`, 
          background: 'radial-gradient(circle, #00f2ff 0%, #7000ff 50%, #ff00ea 100%)' 
        }}
      />
    </>
  );
};

const GlassCard: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`backdrop-blur-xl bg-white/60 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] md:rounded-[2.5rem] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-white/60 ${className}`}>
    {children}
  </div>
);

const AnimatedProgress = ({ value, label }: { value: number, label?: string }) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between text-[10px] md:text-xs mb-2 font-black text-slate-400 uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-slate-900">{value}%</span>
      </div>
    )}
    <div className="w-full bg-slate-200/50 rounded-full h-2.5 md:h-3 overflow-hidden p-[2px]">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const ActionIcon = ({ action }: { action: string }) => {
  const iconClass = "w-full h-full";
  const a = action.toLowerCase();
  if (a.includes('pause')) return <PauseCircle className={`${iconClass} text-amber-500`} />;
  if (a.includes('cancel')) return <XCircle className={`${iconClass} text-rose-500`} />;
  if (a.includes('upgrade') || a.includes('annual')) return <Sparkles className={`${iconClass} text-cyan-500`} />;
  if (a.includes('negotiate')) return <AlertTriangle className={`${iconClass} text-orange-500`} />;
  return <Zap className={`${iconClass} text-purple-500`} />;
};

const Header = ({ currentScreen, setScreen, logoImage }: { currentScreen: AppScreen, setScreen: (s: AppScreen) => void, logoImage: string | null }) => {
  return (
    <header className="sticky top-0 z-[100] backdrop-blur-2xl bg-white/70 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 md:h-24 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 md:gap-4 cursor-pointer group"
          onClick={() => setScreen('dashboard')}
        >
          <div className="relative w-10 h-10 md:w-16 md:h-16 overflow-hidden rounded-xl md:rounded-2xl bg-black flex items-center justify-center border border-white/20 shadow-xl transition-transform group-hover:scale-105 group-active:scale-95">
             <img src={logoImage || 'logo.png'} alt="SmartPause AI Logo" className="w-full h-full object-contain p-1" />
             <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent pointer-events-none"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-3xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-1">
              SmartPause <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500">AI</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
              <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[8px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.15em] md:tracking-[0.2em]">Quantum Wealth Guard</p>
            </div>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <button 
            onClick={() => setScreen('dataset')}
            className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 px-6 lg:px-8 py-3 rounded-2xl transition-all ${currentScreen === 'dataset' ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-600 hover:bg-white border border-slate-200 hover:shadow-lg'}`}
          >
            <Database className="w-4 h-4 text-cyan-500" />
            Archive
          </button>
          <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default">
             <div className="p-1 rounded-full bg-pink-100"><Heart className="w-3 h-3 text-pink-500 fill-pink-500" /></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium Intelligence</span>
          </div>
        </nav>

        <div className="md:hidden flex items-center gap-3">
           <RefreshCcw className="w-5 h-5 text-slate-400 active:rotate-180 transition-transform duration-500" />
        </div>
      </div>
    </header>
  );
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SubscriptionAnalysis[]>(INITIAL_ANALYSIS);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const fetchLogo = async () => {
    const cached = localStorage.getItem('smartpause_logo_cache');
    if (cached) {
      setLogoImage(cached);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: "A professional minimalist circular logo for a futuristic fintech AI named 'SmartPause'. Geometric 'S' combined with a pause icon. Glowing neon cyan and magenta accents, deep black background. Vector style, premium branding.",
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          setLogoImage(base64);
          localStorage.setItem('smartpause_logo_cache', base64);
        }
      }
    } catch (e) { console.error("Logo generation failed", e); }
  };

  const fetchHeroImage = async () => {
    const cached = localStorage.getItem('smartpause_hero_cache');
    if (cached) {
      setHeroImage(cached);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: "Cinematic, macro photography of a crystal planet core, floating geometric obsidian shards, liquid neon magenta and cyan light streams, dark space background, futuristic minimalism, 8k render.",
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = `data:image/png;base64,${part.inlineData.data}`;
          setHeroImage(base64);
          localStorage.setItem('smartpause_hero_cache', base64);
        }
      }
    } catch (e) { console.error("Hero generation failed", e); }
  };

  const runAnalysis = async () => {
    setLoading(true); // Still show loading on the button, but not the whole screen
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Analyze these recurring payments: ${JSON.stringify(MOCK_TRANSACTIONS)}. Theme: "Quantum Financial Vibe". Focus on behavioral archetypes. Return updated analysis keeping the same structure.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                billingCycle: { type: Type.STRING },
                cost: { type: Type.NUMBER },
                intentScore: { type: Type.INTEGER },
                behavioralCategory: { type: Type.STRING },
                regretProbability: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                recommendedTiming: { type: Type.STRING },
                explanationSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                humanExplanation: { type: Type.STRING },
                counterfactualSavings: {
                  type: Type.OBJECT,
                  properties: {
                    followAnnual: { type: Type.NUMBER },
                    ignoreAnnual: { type: Type.NUMBER },
                    wastedSpendEstimate: { type: Type.NUMBER }
                  },
                  required: ["followAnnual", "ignoreAnnual", "wastedSpendEstimate"]
                },
                confidence: { type: Type.INTEGER },
                assumption: { type: Type.STRING }
              },
              required: ["name", "billingCycle", "cost", "intentScore", "behavioralCategory", "regretProbability", "recommendedAction", "recommendedTiming", "explanationSignals", "humanExplanation", "counterfactualSavings", "confidence", "assumption"]
            }
          }
        }
      });
      const data = JSON.parse(response.text || '[]');
      if (data.length > 0) setAnalysis(data);
    } catch (err: any) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    // We already have initial analysis set in state.
    // Fetch background updates on mount if needed, but the user wants it instant.
    // fetchLogo and fetchHeroImage are handled in background.
    fetchHeroImage();
    fetchLogo();
  }, []);

  const totalPotentialSavings = useMemo(() => {
    return analysis.reduce((acc, item) => acc + (item.counterfactualSavings.ignoreAnnual - item.counterfactualSavings.followAnnual), 0);
  }, [analysis]);

  return (
    <div className="min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-cyan-500 selection:text-white pb-24 md:pb-0 relative overflow-hidden">
      <CustomCursor />
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-[-2]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-100/20 rounded-full blur-[120px] md:blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 rounded-full blur-[120px] md:blur-[150px]"></div>
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
      </div>

      <Header currentScreen={currentScreen} setScreen={setCurrentScreen} logoImage={logoImage} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 md:py-16">
        
        {currentScreen === 'dataset' ? (
          <div className="animate-in space-y-8 md:space-y-12">
            <button onClick={() => setCurrentScreen('dashboard')} className="group flex items-center gap-3 text-slate-400 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] hover:text-slate-900 transition-all">
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" /> Quantum Return Path
            </button>
            <GlassCard className="p-6 md:p-16">
              <h2 className="text-3xl md:text-7xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter leading-none">The Archive</h2>
              <p className="text-xs md:text-xl text-slate-400 font-medium mb-10 md:mb-16 tracking-tight">Raw behavioral telemetry ingested for era validation.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
                {MOCK_TRANSACTIONS.map((t, idx) => (
                  <div key={idx} className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-white/40 border border-white hover:border-cyan-200 transition-all hover:bg-white hover:scale-[1.02] hover:shadow-xl group">
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <div className="p-2 md:p-3 rounded-xl bg-slate-100 group-hover:bg-cyan-50 transition-colors">
                        <Layers className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-hover:text-cyan-500" />
                      </div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest">{t.category}</span>
                    </div>
                    <p className="font-black text-lg md:text-2xl text-slate-900 truncate mb-1">{t.merchant}</p>
                    <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 md:mb-6">{t.date}</p>
                    <div className="flex justify-between items-center pt-4 md:pt-6 border-t border-slate-100">
                      <p className="font-black text-xl md:text-2xl text-slate-900">${t.amount}</p>
                      <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="animate-in">
            {/* Stunning Hero */}
            <div className="mb-10 md:mb-24 relative h-[350px] sm:h-[450px] md:h-[650px] rounded-[2.5rem] md:rounded-[6rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:shadow-[0_40px_100px_rgba(0,0,0,0.1)] group">
              {heroImage ? (
                <img src={heroImage} className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110" alt="Cosmic Finance" />
              ) : (
                <div className="w-full h-full bg-[#0D0D12] flex items-center justify-center">
                   <div className="w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-2xl md:rounded-3xl animate-pulse backdrop-blur-3xl flex items-center justify-center">
                     <img src={logoImage || 'logo.png'} className="w-10 h-10 md:w-16 md:h-16 opacity-50 object-contain" />
                   </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-transparent"></div>
              <div className="absolute bottom-8 md:bottom-28 left-6 md:left-24 right-6 md:right-auto max-w-4xl text-white">
                <div className="inline-flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-3xl px-4 md:px-6 py-2 rounded-full border border-white/20 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-6 md:mb-10 shadow-2xl animate-bounce-subtle">
                  <span className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400"><Sparkles className="w-full h-full fill-cyan-400/20" /></span> Financial Era Guard Active
                </div>
                <h2 className="text-4xl sm:text-6xl md:text-9xl font-black mb-4 md:mb-10 leading-[1.05] md:leading-[0.95] tracking-tighter">Your wealth, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">transcended</span>.</h2>
                <p className="text-xs sm:text-lg md:text-3xl text-white/70 font-medium leading-relaxed max-w-2xl tracking-tight opacity-90">Protecting your era with autonomous behavioral intelligence and quantum-level prosperity monitoring.</p>
              </div>
            </div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-10 mb-12 md:mb-32">
              <GlassCard className="md:col-span-2 p-8 md:p-14 relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.05] md:opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                  <Wallet className="w-24 h-24 md:w-40 md:h-40 text-cyan-500" />
                </div>
                <div>
                  <h3 className="text-[10px] md:text-[11px] font-black text-cyan-600 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Recovery Potential
                  </h3>
                  <div className="flex items-baseline gap-3 md:gap-4 mb-1">
                    <span className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter">${totalPotentialSavings.toFixed(0)}</span>
                    <span className="text-cyan-500 font-black text-[10px] md:text-lg uppercase tracking-widest">Growth pool</span>
                  </div>
                </div>
                <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 md:mt-10">Real-time behavior scan leakage</p>
              </GlassCard>

              <GlassCard className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-white to-purple-50 group">
                <h3 className="text-[10px] md:text-[11px] font-black text-purple-600 uppercase tracking-[0.4em] mb-6 md:mb-10">Horizon</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter">7</span>
                  <span className="text-purple-500 font-black text-[10px] md:text-sm uppercase tracking-widest">Mo History</span>
                </div>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 md:mt-10">Deep Telemetry Scan</p>
              </GlassCard>

              <div className="bg-slate-950 p-8 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl text-white flex flex-col justify-between border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 md:p-10 opacity-20 transition-all duration-1000 group-hover:scale-125 group-hover:rotate-[20deg]">
                  <img src={logoImage || 'logo.png'} alt="logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                </div>
                <h3 className="text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.4em] mb-6 md:mb-10">Precision Index</h3>
                <div className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">96.8%</div>
                <p className="text-[9px] md:text-[11px] text-cyan-400 font-black uppercase tracking-[0.4em] mt-6 md:mt-10">Valid Era Score</p>
              </div>
            </div>

            {/* Intelligence Stream */}
            <div className="space-y-10 md:space-y-28">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-6">
                <div>
                   <h2 className="text-3xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">Quantum Stream</h2>
                   <p className="text-xs md:text-2xl font-medium text-slate-400 mt-3 md:mt-6 tracking-tight">Active era surveillance and subscription regret metrics.</p>
                </div>
                <button 
                  onClick={runAnalysis}
                  className="inline-flex items-center justify-center gap-3 md:gap-4 bg-slate-950 text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-cyan-500/10 border border-white/10 group w-full md:w-auto"
                >
                  <RefreshCcw className={`w-4 h-4 md:w-5 md:h-5 text-cyan-400 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                  {loading ? 'Analyzing...' : 'Resync Vibes'}
                </button>
              </div>

              <div className="space-y-10 md:space-y-32">
                {analysis.map((sub, idx) => (
                  <GlassCard key={idx} className="overflow-hidden group">
                    <div className="p-6 md:p-20">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-20 mb-10 md:mb-24">
                        <div className="flex items-start gap-5 md:gap-14">
                          <div className="hidden sm:flex bg-gradient-to-br from-cyan-50 to-pink-50 p-6 md:p-12 rounded-[2rem] md:rounded-[4.5rem] border border-white shadow-inner group-hover:scale-105 transition-transform">
                            <Zap className="text-purple-600 w-8 h-8 md:w-14 md:h-14 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2 md:mb-4">
                              <h3 className="text-2xl md:text-7xl font-black text-slate-900 tracking-tighter">{sub.name}</h3>
                              <span className={`text-[8px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] px-3 md:px-6 py-1.5 md:py-2.5 rounded-full border ${
                                sub.regretProbability === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              }`}>
                                {sub.regretProbability} Regret Risk
                              </span>
                            </div>
                            <p className="text-lg md:text-4xl font-bold text-slate-400 tracking-tighter">
                              ${sub.cost.toFixed(2)} <span className="text-slate-200">/</span> {sub.billingCycle}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between lg:flex-col lg:items-center gap-4 bg-slate-950 p-6 md:p-14 rounded-[2rem] md:rounded-[5rem] border border-white/10 min-w-full md:min-w-[320px] shadow-xl group-hover:scale-[1.01] transition-all">
                          <p className="text-[9px] md:text-[12px] font-black uppercase text-white/30 tracking-[0.4em] md:tracking-[0.5em] hidden lg:block mb-6">Autonomous Action</p>
                          <div className="flex items-center gap-4 md:gap-6">
                             <div className="scale-110 md:scale-150"><ActionIcon action={sub.recommendedAction} /></div>
                             <span className="text-xl md:text-5xl font-black text-white tracking-tighter">{sub.recommendedAction}</span>
                          </div>
                          <p className="text-[10px] md:sm font-black text-cyan-400 uppercase tracking-[0.3em] mt-1 md:mt-4">{sub.recommendedTiming}</p>
                        </div>
                      </div>

                      <div className="mb-10 md:mb-24">
                        <AnimatedProgress value={sub.intentScore} label="Inferred Intent Convergence" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-32 pt-10 md:pt-24 border-t border-slate-100/50">
                        <div>
                          <h4 className="text-[9px] md:text-xs font-black text-slate-300 uppercase tracking-[0.4em] mb-6 md:mb-10 flex items-center gap-2 md:gap-3">
                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> AI Logic Summary
                          </h4>
                          <p className="text-lg md:text-4xl font-bold text-slate-800 leading-[1.2] md:leading-[1.1] mb-8 md:mb-12 italic tracking-tighter">"{sub.humanExplanation}"</p>
                          <div className="flex flex-wrap gap-2 md:gap-5">
                            {sub.explanationSignals.map((s, i) => (
                              <span key={i} className="bg-slate-100/50 backdrop-blur-md text-[9px] md:text-[14px] font-black uppercase tracking-widest text-slate-500 px-4 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200/50 hover:bg-white transition-all">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50/40 via-white to-pink-50/40 p-8 md:p-20 rounded-[2.5rem] md:rounded-[6rem] border border-white relative shadow-inner">
                          <h4 className="text-[9px] md:text-xs font-black text-cyan-600 uppercase tracking-[0.4em] mb-6 md:mb-10">Savings Counterfactual</h4>
                          <div className="space-y-6 md:space-y-10">
                            <div className="flex justify-between items-center text-sm md:text-2xl">
                              <span className="font-bold text-slate-400 tracking-tight">Standard Era</span>
                              <span className="font-black text-slate-900">${sub.counterfactualSavings.ignoreAnnual.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm md:text-2xl">
                              <span className="font-bold text-cyan-500 tracking-tight">Optimized Era</span>
                              <span className="font-black text-cyan-600">${sub.counterfactualSavings.followAnnual.toFixed(0)}</span>
                            </div>
                            <div className="pt-6 md:pt-10 border-t border-cyan-200/50 flex justify-between items-center">
                              <span className="text-[9px] md:text-xs font-black text-rose-500 uppercase tracking-[0.4em] md:tracking-[0.5em]">Leakage</span>
                              <span className="text-2xl md:text-7xl font-black text-rose-600 tracking-tighter">-${sub.counterfactualSavings.wastedSpendEstimate.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Meta Row */}
                    <div className="bg-slate-950 px-6 md:px-20 py-6 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border-t border-white/5">
                       <div className="flex items-center gap-4 md:gap-6">
                         <div className="h-2.5 w-2.5 md:h-3 md:w-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,211,238,1)]"></div>
                         <span className="text-[9px] md:text-[15px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.5em]">{sub.behavioralCategory} Archetype</span>
                       </div>
                       <button className="text-[10px] md:text-[15px] font-black text-cyan-400 uppercase tracking-[0.3em] md:tracking-[0.4em] hover:text-white transition-all flex items-center gap-3 md:gap-4 group">
                         Execute Quantum Era Optimization <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-3 transition-transform" />
                       </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stunning Branding Footer */}
        <section className="mt-24 md:mt-72 text-center pb-24 md:pb-60">
          <div className="relative inline-block mb-16 md:mb-24">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-[40px] md:blur-[60px] opacity-10 md:opacity-20 animate-pulse"></div>
             <div className="relative inline-flex items-center gap-4 md:gap-6 bg-white px-8 md:px-16 py-5 md:py-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-100">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-black rounded-xl md:rounded-[2rem] flex items-center justify-center p-2.5 md:p-3 shadow-xl hover:rotate-[360deg] transition-transform duration-1000">
                  <img src={logoImage || 'logo.png'} alt="logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] md:text-lg font-black text-slate-800 uppercase tracking-[0.3em] md:tracking-[0.4em]">SmartPause AI</p>
                  <p className="text-[8px] md:text-xs font-medium text-slate-400 uppercase tracking-[0.2em] mt-0.5 md:mt-1 italic">Exclusive prosperity engine</p>
                </div>
             </div>
          </div>

          <h3 className="text-3xl md:text-9xl font-black text-slate-900 mb-8 md:mb-20 tracking-tighter px-4 leading-[1.1] md:leading-[0.9] max-w-6xl mx-auto">
            Your wealth is <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600">exclusively yours</span>.
          </h3>
          
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 px-4">
            {['Prosperity', 'Inference', 'Privacy', 'Autonomy'].map((p, i) => (
              <GlassCard key={i} className="p-6 md:p-12 text-[9px] md:text-sm font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-slate-400 hover:text-cyan-500 hover:border-cyan-200 transition-all cursor-default text-center">
                {p}
              </GlassCard>
            ))}
          </div>
        </section>
      </main>

      <footer className="hidden md:block py-32 md:py-48 border-t border-slate-100 bg-white relative">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div className="flex flex-col items-center gap-8 md:gap-10 mb-16 md:mb-20">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-black rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center p-4 shadow-2xl hover:scale-110 transition-transform">
               <img src={logoImage || 'logo.png'} alt="SmartPause AI" className="w-full h-full object-contain" />
            </div>
            <span className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic">SmartPause</span>
          </div>
          <div className="flex flex-wrap justify-center gap-10 md:gap-24 text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] md:tracking-[0.6em]">
            <a href="#" className="hover:text-cyan-500 transition-colors">Vibe protocol</a>
            <a href="#" className="hover:text-purple-500 transition-colors">Charter</a>
            <a href="#" className="hover:text-pink-500 transition-colors">Quant API</a>
          </div>
        </div>
        <div className="h-[4px] md:h-[6px] w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mt-24 md:mt-40 opacity-30 blur-[1px]"></div>
      </footer>

      {/* Mobile Glass Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 pb-6 z-[100]">
        <div className="backdrop-blur-3xl bg-white/80 border border-white/50 px-8 py-5 flex items-center justify-around rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className={`flex flex-col items-center gap-1.5 transition-all ${currentScreen === 'dashboard' ? 'text-cyan-600 scale-110' : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('dataset')}
            className={`flex flex-col items-center gap-1.5 transition-all ${currentScreen === 'dataset' ? 'text-cyan-600 scale-110' : 'text-slate-400'}`}
          >
            <Database className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
