import React, { useEffect, useRef } from "react";
// import "./Roadmap.css";

const roadmapData = [
  {
    title: "Platform Launch",
    desc: "Release of the core staking platform with secure wallet integration and basic staking functionality.",
    icon: "◎"
  },
  {
    title: "Stable Reward Distribution",
    desc: "Implementation of reliable reward calculation and scheduled payout mechanisms.",
    icon: "⏱"
  },
  {
    title: "Performance Optimization",
    desc: "Enhancements to staking efficiency, reward visibility, and system scalability.",
    icon: "↗"
  },
  {
    title: "Flexible Asset Management",
    desc: "Improved options for managing staked assets, including partial withdrawals and plan adjustments.",
    icon: "⇄"
  },
  {
    title: "Insights & Transparency",
    desc: "Advanced dashboards providing clear insights into earnings, rewards, and platform performance.",
    icon: "$"
  }
];

const Roadmap = () => {
  const particlesRef = useRef(null);

  useEffect(() => {
    // Create floating particles for premium effect
    const particles = particlesRef.current;
    if (!particles) return;

    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random size
      const size = Math.random() * 8 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random animation duration and delay
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 5;
      particle.style.animation = `particleFloat ${duration}s ${delay}s infinite linear`;
      
      // Random opacity
      particle.style.background = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      
      particles.appendChild(particle);
    }

    return () => {
      if (particles) {
        particles.innerHTML = '';
      }
    };
  }, []);

  return (
    <section className="roadmap">
      <div className="roadmap-particles" ref={particlesRef}></div>
      
      <div className="roadmap-container">
        <h2 className="roadmap-title">
          Staking Platform <span>Roadmap</span>
        </h2>

        <div className="roadmap-timeline">
          {roadmapData.map((item, index) => (
            <div className="roadmap-item" key={index}>
              <div className="roadmap-icon">
                {item.icon}
              </div>
              <div className="roadmap-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;