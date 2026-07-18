// Footer.jsx
import React from "react";
import { useLocation } from "react-router-dom";
// import "./Footer.css";
import { FaTwitter, FaFacebookF, FaInstagram } from "react-icons/fa";

const Footer = () => {
  const location = useLocation();

  const handleScroll = (sectionId) => {
    // If we're not on home page, navigate to home first then scroll
    if (location.pathname !== '/') {
      window.location.href = `/#${sectionId}`;
      return;
    }

    // Scroll to section on home page
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Height of your fixed navbar
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleSocialClick = (platform) => {
    const socialLinks = {
      twitter: "https://twitter.com/yourusername",
      facebook: "https://facebook.com/yourusername",
      instagram: "https://instagram.com/yourusername"
    };
    window.open(socialLinks[platform], '_blank');
  };

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* LEFT SECTION */}
        <div className="footer-left">
          <div 
            className="footer-logo" 
            onClick={() => {
              handleScroll('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ cursor: 'pointer' }}
          >
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1e-OKAx3lPSyDhqLtPJuoKfmJ-J5L-FLYGQ&s" alt="AVG Logo" />
            <span>AVG</span>
          </div>

          <p className="footer-desc">
            AVG Staking offers a secure way to grow your crypto assets with
            consistent daily rewards, transparent plans, and industry-grade
            security built for long-term investors.
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="footer-col">
          <h4>Products</h4>
          <ul>
            <li onClick={() => handleScroll('home')}>Home</li>
            <li onClick={() => handleScroll('plan')}>Plan</li>
          </ul>
        </div>

        {/* COMPANY */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li onClick={() => handleScroll('about')}>About Us</li>
            <li onClick={() => handleScroll('features')}>Features</li>
          </ul>
        </div>

        {/* SOCIAL MEDIA */}
        <div className="footer-col">
          <h4>Social Media</h4>
          <div className="social-icons">
            <FaTwitter onClick={() => handleSocialClick('twitter')} />
            <FaFacebookF onClick={() => handleSocialClick('facebook')} />
            <FaInstagram onClick={() => handleSocialClick('instagram')} />
          </div>
        </div>

      </div>

      {/* BOTTOM COPYRIGHT */}
      <div className="footer-bottom">
        © 2026 <span>Avg</span> All rights reserved.
      </div>

    </footer>
  );
};

export default Footer;