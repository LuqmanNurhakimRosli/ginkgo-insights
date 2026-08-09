import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useGinkgo } from "@/state/ginkgo-store";
import { locations } from "@/data/sites";
import { ChevronDown, MapPin, Clock, Cpu, Award, Settings as SettingsIcon, X, Sliders } from "lucide-react";
import { providers } from "@/services/ai";

export function TopNav() {
  const { location, setLocation, t1, t2, providerId, setProviderId } = useGinkgo();
  const [timeStr, setTimeStr] = useState("");
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hrs = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      setTimeStr(`${hrs}:${mins} MYT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOpenSource = providerId === "ollama" || providerId === "groq" || providerId === "huggingface";

  return (
    <header className="flex h-11 items-center justify-between border-b border-white/10 bg-[#0B0C0E] px-4 font-mono text-[11px] uppercase tracking-widest text-[#9CA3AF] relative z-40">
      {/* Brand wordmark */}
      <div className="flex items-center gap-4">
        <span className="font-bold text-[14px] text-[#F5F5F4] tracking-[0.2em]">GINKGO</span>
        <span className="text-white/20">|</span>
        <span className="text-[#9CA3AF] text-[10px]">MISSION CONTROL HUD</span>

        {/* Open Source AI Bonus Badge */}
        {isOpenSource && (
          <div className="hidden lg:flex items-center gap-1.5 rounded border border-[#22C55E]/40 bg-[#22C55E]/10 px-2 py-0.5 text-[9px] text-[#22C55E]">
            <Award className="h-3 w-3" />
            <span>OPEN-SOURCE AI MODEL (+BONUS MARKS)</span>
          </div>
        )}
      </div>

      {/* Center Metadata / Controls */}
      <div className="flex items-center gap-3">
        {/* Track B Urban vs Rural Location Selector */}
        <div className="flex items-center gap-1.5 rounded border border-white/10 bg-[#16171A] px-2.5 py-1 text-[#F5F5F4]">
          <MapPin className="h-3 w-3 text-[#5EEAD4]" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-transparent text-[10px] uppercase outline-none text-[#F5F5F4] cursor-pointer"
            aria-label="Location"
          >
            {locations.map((l) => (
              <option key={l} value={l} className="bg-[#16171A] text-[#F5F5F4]">
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
        </div>

        {/* AI Provider Switcher (Ollama / Groq / HuggingFace / Gemini / Mock) */}
        <div className="relative">
          <button
            onClick={() => setShowProviderModal((s) => !s)}
            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] uppercase transition-all ${
              isOpenSource
                ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]"
                : "border-white/10 bg-[#16171A] text-[#F5F5F4] hover:border-white/20"
            }`}
          >
            <Cpu className="h-3 w-3 text-[#5EEAD4]" />
            <span>MODEL: {providerId.toUpperCase()}</span>
            <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
          </button>

          {/* Provider Selector Dropdown */}
          {showProviderModal && (
            <div className="absolute right-0 top-9 z-50 w-72 rounded border border-white/10 bg-[#16171A]/95 p-3 shadow-2xl backdrop-blur">
              <div className="mb-2 border-b border-white/10 pb-2 text-[10px] font-semibold text-[#5EEAD4]">
                SELECT AI & GIS MODEL BACKEND
              </div>
              <div className="space-y-1">
                {Object.entries(providers).map(([id, prov]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setProviderId(id);
                      setShowProviderModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded p-2 text-left text-[10px] transition-all ${
                      providerId === id
                        ? "border border-[#5EEAD4]/40 bg-[#5EEAD4]/10 text-[#5EEAD4]"
                        : "text-[#9CA3AF] hover:bg-white/5 hover:text-[#F5F5F4]"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{prov.name}</div>
                      <div className="text-[8px] text-[#5B5F66]">
                        {id === "ollama" || id === "groq" || id === "huggingface"
                          ? "OPEN-SOURCE MODEL (+BONUS)"
                          : "STANDARD BACKEND"}
                      </div>
                    </div>
                    {providerId === id && <span className="text-[#5EEAD4]">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Settings Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-1.5 rounded border border-white/10 bg-[#16171A] px-2.5 py-1 text-[10px] text-[#F5F5F4] transition-all hover:border-[#5EEAD4]/40 hover:bg-[#5EEAD4]/10 hover:text-[#5EEAD4]"
        >
          <SettingsIcon className="h-3 w-3" />
          <span className="hidden sm:inline">SETTINGS</span>
        </button>

        {/* Temporal Compare Pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
          <span className="text-[#5EEAD4] font-semibold">{t1}</span>
          <span>VS</span>
          <span className="text-[#5EEAD4] font-semibold">{t2}</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
          <Clock className="h-3 w-3 text-[#5EEAD4]" />
          <span>{timeStr || "14:32 MYT"}</span>
        </div>
      </div>

      {/* Operator Badge */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#5EEAD4] animate-cyan-pulse" />
        <span className="text-[10px] text-[#F5F5F4]">SYS ONLINE</span>
      </div>

      {/* Full Interactive Settings Management Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded border border-white/10 bg-[#16171A] p-6 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[#5EEAD4]">
                <Sliders className="h-4 w-4" />
                <span className="font-bold text-[14px] uppercase tracking-wider">SYSTEM CONFIGURATION & MANAGEMENT</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded p-1 text-[#9CA3AF] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-[11px] uppercase text-[#F5F5F4]">
              {/* AI Model Backend */}
              <div>
                <label className="block text-[9px] text-[#9CA3AF] mb-1">AI MODEL BACKEND DELIVERY</label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#0B0C0E] p-2 text-[11px] text-[#5EEAD4] outline-none"
                >
                  {Object.entries(providers).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Study Area Location */}
              <div>
                <label className="block text-[9px] text-[#9CA3AF] mb-1">TRACK B STUDY LOCATION TARGET</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#0B0C0E] p-2 text-[11px] text-[#F5F5F4] outline-none"
                >
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Suitability Weight Sliders */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="block text-[9px] text-[#9CA3AF]">DEVELOPMENT SUITABILITY CRITERIA WEIGHTS</span>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>FLOOD EXPOSURE RISK</span>
                    <span className="text-[#5EEAD4]">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TRANSPORT ACCESSIBILITY</span>
                    <span className="text-[#5EEAD4]">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VEGETATION RETENTION</span>
                    <span className="text-[#5EEAD4]">30%</span>
                  </div>
                </div>
              </div>

              {/* Quick Route Navigator Links */}
              <div className="border-t border-white/10 pt-3">
                <span className="block text-[9px] text-[#9CA3AF] mb-2">QUICK MODULE NAVIGATOR</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/settings"
                    onClick={() => setShowSettingsModal(false)}
                    className="rounded border border-white/10 bg-white/5 p-2 text-center text-[10px] text-[#5EEAD4] hover:bg-white/10"
                  >
                    FULL SETTINGS CONSOLE ↗
                  </Link>
                  <Link
                    to="/help"
                    onClick={() => setShowSettingsModal(false)}
                    className="rounded border border-white/10 bg-white/5 p-2 text-center text-[10px] text-[#F5F5F4] hover:bg-white/10"
                  >
                    METHODOLOGY & HELP ↗
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded bg-[#5EEAD4] px-4 py-1.5 text-[11px] font-bold text-[#0B0C0E] hover:opacity-90"
              >
                APPLY & CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
