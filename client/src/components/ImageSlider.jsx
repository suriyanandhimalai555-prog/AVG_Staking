import { useEffect, useMemo, useRef, useState } from "react";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";

const ImageSlider = ({ onLoginClick }) => {
    const heroRef = useRef(null);
    const glowRef = useRef(null);
    const [showLogin, setShowLogin] = useState(false);
    const [slides, setSlides] = useState([]);
    const [loadingSlides, setLoadingSlides] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const setFavicon = () => {
            const existingFavicons = document.querySelectorAll(
                "link[rel*='icon'], link[rel*='apple-touch-icon']"
            );
            existingFavicons.forEach((favicon) => favicon.remove());

            document.title = "Avg Stake";
        };

        setFavicon();

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

        const handleEscKey = (e) => {
            if (e.key === "Escape" && showLogin) {
                setShowLogin(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("keydown", handleEscKey);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("keydown", handleEscKey);
        };
    }, [showLogin]);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                setLoadingSlides(true);
                const res = await API.get("/banner-slides/public");
                setSlides(res.data || []);
            } catch (error) {
                console.error("Hero banner fetch error:", error);
                setSlides([]);
            } finally {
                setLoadingSlides(false);
            }
        };

        fetchSlides();
    }, []);

    useEffect(() => {
        if (!slides.length) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3500);

        return () => clearInterval(timer);
    }, [slides]);

    const activeSlide = useMemo(() => {
        if (!slides.length) return null;
        return slides[currentSlide % slides.length];
    }, [slides, currentSlide]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowLogin(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Login submitted");
    };

    return (
        <section className="relative overflow-hidden px-4 py-6 md:px-6 md:py-8 image-slider" ref={heroRef}>
            <div className="mx-auto max-w-[1800px]">

                {/* TITLE */}

                <div className="mb-10 text-center">

                    <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
                        🏆 AVG ACHIEVERS
                    </span>

                    <h2 className="mt-4 text-3xl font-bold text-white md:text-5xl">
                        Celebrating Our Top Performers
                    </h2>

                    <p className="mx-auto mt-4 max-w-3xl text-sm text-blue-200 md:text-base">
                        Members who achieved their targets and unlocked exciting rewards.
                    </p>

                </div>

                {loadingSlides ? (

                    <div className="flex h-[300px] items-center justify-center text-white">
                        Loading...
                    </div>

                ) : (

                    <>
                        {/* ROW 1 */}

                        <div className="overflow-hidden">

                            <div
                                className="flex gap-6"
                                style={{
                                    width: "max-content",
                                    animation: "avgScrollLeft 15s linear infinite",
                                }}
                            >

                                {[...slides, ...slides].map((item, index) => (

                                    <div
                                        key={`top-${index}`}
                                        className="
    flex
    w-[650px]
    overflow-hidden
    rounded-[28px]
    bg-white
    shadow-[0_20px_60px_rgba(0,0,0,0.18)]
    border border-slate-100
    transition-all
    duration-500
    hover:-translate-y-2
  "
                                    >

                                        {/* IMAGE */}

                                        <div className="relative w-[220px] flex-shrink-0">

                                            <img
                                                src={item.imageUrl}
                                                alt={item.username}
                                                className="h-full w-full object-cover"
                                            />

                                            <div className="absolute left-3 top-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white">
                                                🏆 ACHIEVER
                                            </div>

                                        </div>

                                        {/* CONTENT */}

                                        <div className="flex flex-1 flex-col justify-center p-5">

                                            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                Target Completed
                                            </span>

                                            <h3 className="mt-3 text-2xl font-bold text-slate-900">
                                                {item.username}
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                AVG Elite Achiever
                                            </p>

                                            <div className="mt-4 grid grid-cols-2 gap-3">

                                                <div className="rounded-xl bg-slate-100 p-3">
                                                    <p className="text-xs text-slate-500">
                                                        Target
                                                    </p>

                                                    <h4 className="mt-1 font-bold text-slate-900">
                                                        $
                                                        {Number(
                                                            item.target_amount || 0
                                                        ).toLocaleString()}
                                                    </h4>
                                                </div>

                                                <div className="rounded-xl bg-green-50 p-3">
                                                    <p className="text-xs text-green-600">
                                                        Achieved
                                                    </p>

                                                    <h4 className="mt-1 font-bold text-green-700">
                                                        $
                                                        {Number(
                                                            item.progress || 0
                                                        ).toLocaleString()}
                                                    </h4>
                                                </div>

                                            </div>

                                            <div className="mt-3 rounded-xl bg-amber-50 p-3">

                                                <p className="text-xs text-amber-600">
                                                    Reward Earned
                                                </p>

                                                <h4 className="mt-1 font-bold text-slate-900 line-clamp-2">
                                                    {item.reward}
                                                </h4>

                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </>
                )}

            </div>

            {showLogin && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={handleBackdropClick}
                >
                    <div className="relative w-full max-w-md rounded-[28px] border border-[#355BB6] bg-[#17327A] p-6 text-white shadow-2xl">
                        <button
                            className="absolute right-4 top-4 text-3xl leading-none text-blue-200"
                            onClick={() => setShowLogin(false)}
                        >
                            ×
                        </button>

                        <h2 className="text-2xl font-bold">Welcome to AVG Staking</h2>
                        <p className="mt-2 text-blue-200">Sign in to continue</p>

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-2 block text-sm text-blue-200">User Code</label>
                                <input
                                    type="text"
                                    placeholder="Enter your user code"
                                    className="w-full rounded-xl border border-[#355BB6] bg-[#102C72] px-4 py-3 text-white outline-none focus:border-blue-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-blue-200">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter password"
                                    className="w-full rounded-xl border border-[#355BB6] bg-[#102C72] px-4 py-3 text-white outline-none focus:border-blue-400"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
                            >
                                Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ImageSlider;