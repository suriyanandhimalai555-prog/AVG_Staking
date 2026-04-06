import React, { useState } from "react";
// import "./Faq.css";

const faqData = [
  {
    question: "What is AVG Staking?",
    answer:
      "AVG staking allows users to lock their crypto assets in the platform to earn daily passive rewards based on the selected staking plan."
  },
  {
    question: "How does AVG Staking work?",
    answer:
      "Users deposit supported crypto assets into the staking pool. The platform allocates funds into staking strategies that generate daily rewards."
  },
  {
    question: "Is AVG Staking safe?",
    answer:
      "AVG uses multi-layer encryption, secure infrastructure, and transparent reward calculations to ensure user fund protection."
  },
  {
    question: "What returns can I earn from AVG Staking?",
    answer:
      "Returns depend on the selected plan. Some plans provide fixed daily ROI while others offer dynamic rewards."
  },
  {
    question: "Is there a minimum amount required for staking?",
    answer:
      "Yes. The minimum staking amount depends on the investment plan you select."
  },
  {
    question: "Can I withdraw my staking rewards anytime?",
    answer:
      "Yes. Rewards can be withdrawn depending on the plan conditions and reward distribution schedule."
  }
];

const Faq = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container">

        <h2 className="faq-title">
          Frequently Asked <span>Questions</span>
        </h2>

        <div className="faq-list">
          {faqData.map((item, index) => (
            <div
              className={`faq-item ${activeIndex === index ? "active" : ""}`}
              key={index}
            >
              <div
                className="faq-question"
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-left">
                  <div className="faq-number">{index + 1}</div>
                  <p>{item.question}</p>
                </div>

                <div className="faq-icon">
                  {activeIndex === index ? "−" : "+"}
                </div>
              </div>

              {activeIndex === index && (
                <div className="faq-answer">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Faq;