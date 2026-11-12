import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import ImageSlider from "../components/ImageSlider";
import About from "../components/About";
import Plan from "../components/plan";
import Roadmap from "../components/Roadmap";
import Features from "../components/Features";
import FAQ from "../components/Faq";
import { FiBell, FiX } from "react-icons/fi";

function Home() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if user previously chose "Don't show me again"
    const hidePopup = localStorage.getItem("hide_website_announcement");
    if (!hidePopup) {
      // Small delay for smooth popup entrance on visit
      const timer = setTimeout(() => setShowPopup(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleIgnore = () => {
    setShowPopup(false);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem("hide_website_announcement", "true");
    setShowPopup(false);
  };

  return (
    <div className="relative">
      <section id="home">
        <Hero />
      </section>

      <section id="slider">
        <ImageSlider />
      </section>

      <section id="about">
        <About />
      </section>

      <section id="plan">
        <Plan />
      </section>

      <section id="roadmap">
        <Roadmap />
      </section>

      <section id="features">
        <Features />
      </section>

      <section id="faq">
        <FAQ />
      </section>

      {/* WEBSITE ANNOUNCEMENT POPUP */}
      {/* {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 sm:p-8 space-y-6 relative">
            
            <button
              onClick={handleIgnore}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
            >
              <FiX className="text-sm" />
            </button>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center text-xl shrink-0 shadow-inner">
                <FiBell />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-[#f77704]/10 text-[#f77704] text-[10px] font-black uppercase tracking-wider mb-1">
                  Important Announcement
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Payout Notice
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <p>
                Please note that payouts will not be processed on <span className="font-bold text-slate-900">November 6th, 7th, 8th, and 9th</span>. Regular payouts will resume right after this period.
              </p>
              <p className="text-slate-500 font-semibold italic text-xs">
                * All other dashboard operations, staking services, and system features will continue to work normally as usual.
              </p>
              <p className="text-sm sm:text-base font-bold text-[#f77704] pt-1">
                🪔 Wishing you and your family a Happy Diwali! ✨
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleDontShowAgain}
                className="w-full py-3 rounded-xl bg-[#0437cc] hover:bg-[#032da6] text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                Don't show me again
              </button>
              <button
                onClick={handleIgnore}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Ignore
              </button>
            </div>

          </div>
        </div>
      )} */}
    </div>
  );
}

export default Home;