// Hero.jsx
import { useEffect, useRef, useState } from "react";
// import "./Hero.css";
import hero from "../assets/hero.png"; // your right-side image
import logo from "../assets/logo.png"; // import your logo for favicon

const Hero = ({ onLoginClick }) => {
  const heroRef = useRef(null);
  const glowRef = useRef(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // Set favicon dynamically using the logo
    const setFavicon = () => {
      // Remove existing favicons
      const existingFavicons = document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']");
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon - Use the imported logo
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = logo; // Using your logo as favicon
      document.head.appendChild(link);

      // Add apple touch icon for iOS devices
      const appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = logo;
      document.head.appendChild(appleLink);

      // Set document title
      document.title = 'Avg Stake';
    };

    setFavicon();

    // Parallax effect on mouse move
    const handleMouseMove = (e) => {
      if (!heroRef.current || window.innerWidth < 768) return;
      
      const { clientX, clientY } = e;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      
      const x = (clientX - left - width / 2) / 25;
      const y = (clientY - top - height / 2) / 25;
      
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    // Prevent body scroll when modal is open
    if (showLogin) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Escape key to close modal
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showLogin) {
        setShowLogin(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
      
      // Optional: Clean up favicon on unmount
      const favicons = document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']");
      favicons.forEach(favicon => favicon.remove());
    };
  }, [showLogin]); // Added showLogin dependency

  const handleSignInClick = () => {
    setShowLogin(true);
    if (onLoginClick) onLoginClick();
  };

  const handleCloseModal = () => {
    setShowLogin(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your login logic here
    console.log('Login submitted');
  };

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-container">
        {/* LEFT CONTENT */}
        <div className="hero-left">
          <h1 className="hero-title">
            TRUSTED GLOBAL <br />
            <span>AVG</span>
          </h1>

          <p className="hero-description">
            Stake Your Crypto. Earn Rewards Effortlessly. High-Yield Plans
            Designed for Every Investor. Track Your Earnings in Real-Time,
            Anytime. Maximum Security for Your Digital Assets. Start Staking
            Today and Watch Your Crypto Grow.
          </p>

          <button className="hero-btn" onClick={handleSignInClick}>
            <span className="btn-text">Sign In</span>
            <span className="btn-icon">↗</span>
          </button>
        </div>

        {/* RIGHT CONTENT */}
        <div className="hero-right">
          <div className="hero-glow" ref={glowRef} />
          <div className="image-wrapper">
            <img 
              src={hero} 
              alt="AVG Illustration" 
              className="floating-image"
              loading="eager"
            />
          </div>
          
          {/* Floating orbs for premium effect */}
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="modal-overlay" onClick={handleBackdropClick}>
          <div className="login-modal">
            <button className="modal-close" onClick={handleCloseModal}>×</button>
            
            <div className="modal-header">
              {/* Logo and Brand Section - Fixed: Logo left of AVG text */}
              <div className="brand-container">
                <img src={logo} alt="AVG Logo" className="modal-logo" />
                <h2 className="modal-title">AVG</h2>
              </div>
            </div>

            <div className="modal-content">
              <h3 className="welcome-text">Welcome to AVG Staking</h3>
              <p className="signin-text">Sign in to continue</p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="userCode">User Code</label>
                  <input 
                    type="text" 
                    id="userCode" 
                    placeholder="Enter your user code"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    placeholder="Enter password"
                    className="form-input"
                    required
                  />
                </div>

                <div className="forgot-password">
                  <a href="#">Forgot password?</a>
                </div>

                <button type="submit" className="continue-btn">
                  Continue
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;