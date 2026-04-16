import React from "react";
import Hero from "../components/Hero";
import About from "../components/About";
import Plan from "../components/plan";
import Roadmap from "../components/Roadmap";
import Features from "../components/Features";
import FAQ from "../components/Faq";

function Home() {
  return (
    <> 
      <section id="home">
        <Hero />
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
    </>
  );
}

export default Home;