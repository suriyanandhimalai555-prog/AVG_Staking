// About.jsx
import about from '../assets/about.png'

const About = () => {
  return (
    <section className="about">
      {/* Floating Orbs - Only addition */}
      <div className="about-floating-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="about-container">
        {/* LEFT IMAGE */}
        <div className="about-left">
          <div className="about-image-wrapper">
            <img src={about} alt="About AVG" />
          </div>

          {/* floating dots */}
          <span className="about-dot dot-1"></span>
          <span className="about-dot dot-2"></span>
          <span className="about-dot dot-3"></span>
        </div>

        {/* RIGHT CONTENT */}
        <div className="about-right">
          <h2 className="about-title">
            About <span>AVG</span>
          </h2>

          <p>
            AVG Staking allows users to earn passive income by securely locking
            their assets. Enjoy flexible staking plans, transparent rewards,
            and real-time tracking of your returns, all powered by a reliable
            and secure staking infrastructure.
          </p>

          <p>
            Built for beginners and professional traders, our platform delivers
            real-time market data, advanced tools, and 24/7 global support.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;