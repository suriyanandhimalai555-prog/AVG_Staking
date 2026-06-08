import React, { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaCheckCircle, FaExclamationCircle, FaDollarSign, FaPercentage, FaUsers, FaArrowAltCircleUp } from "react-icons/fa";
import axios from "axios";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/plans`;

const PlansManagement = () => {
    const [plansData, setPlansData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [popupMessage, setPopupMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        roi: '',
        directReferral: '',
        ceilingLimit: '',
        investmentRange: '',
        status: 'active'
    });

    // Premium Toast Alert Popup Handler
    const showPopupMessage = (message) => {
        setPopupMessage(message);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    // Fetch and Sync Plans
    const fetchPlans = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(API, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlansData(res.data);
        } catch (err) {
            console.error(err);
            showPopupMessage("Failed to fetch investment plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    // Toggle Plan Activation Status Hook
    const togglePlanStatus = async (planId) => {
        try {
            const token = localStorage.getItem("token");
            const plan = plansData.find(p => p.id === planId);
            const newStatus = plan.status === 'active' ? 'inactive' : 'active';

            await axios.put(
                `${API}/${planId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPlansData(prev => prev.map(p =>
                p.id === planId ? { ...p, status: newStatus } : p
            ));

            showPopupMessage(`Plan "${plan.name}" changed to ${newStatus}`);
        } catch (err) {
            console.error(err);
            showPopupMessage("Status verification failed");
        }
    };

    const handleEdit = (plan) => {
        setSelectedPlan(plan);
        setFormData({
            name: plan.name,
            roi: plan.roi,
            directReferral: plan.direct_referral,
            ceilingLimit: plan.ceiling_limit,
            investmentRange: plan.investment_range,
            status: plan.status
        });
        setModalType('edit');
        setShowModal(true);
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            roi: '',
            directReferral: '',
            ceilingLimit: '',
            investmentRange: '',
            status: 'active'
        });
        setModalType('create');
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");
            const payload = {
                name: formData.name,
                roi: formData.roi,
                directReferral: formData.directReferral,
                ceilingLimit: formData.ceilingLimit,
                investmentRange: formData.investmentRange,
                status: formData.status
            };

            if (modalType === 'create') {
                await axios.post(API, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showPopupMessage('New asset plan compiled successfully');
            } else if (modalType === 'edit' && selectedPlan) {
                await axios.put(`${API}/${selectedPlan.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showPopupMessage(`Plan details updated successfully`);
            }

            setShowModal(false);
            setSelectedPlan(null);
            fetchPlans();
        } catch (err) {
            console.error(err);
            showPopupMessage("Failed to save operational changes");
        }
    };

    return (
        <div className="min-h-screen bg-[#070b1e] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none rounded-2xl shadow-2xl">
            {/* Ambient Vector Glow Overlays */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-[1600px] mx-auto space-y-8">
                
                {/* Header Profile Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Plans Management</h2>
                        <p className="text-xs text-slate-400 mt-1">Configure staking tiers, yield ratios, direct metrics, and transaction caps</p>
                    </div>
                    <button 
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-950/50 hover:brightness-110 active:scale-95 transition duration-150"
                    >
                        <FaPlus className="text-[10px]" /> Create New Plan
                    </button>
                </div>

                {/* Main Investment Tiers Grid System */}
                {loading ? (
                    <div className="py-24 text-center text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium tracking-wide">Loading asset parameters...</span>
                        </div>
                    </div>
                ) : plansData.length === 0 ? (
                    <div className="py-24 text-center text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                        No active matrix subscription packages configured.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {plansData.map((plan) => (
                            <div 
                                key={plan.id} 
                                className={`relative group bg-white/5 backdrop-blur-xl border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                                    plan.status === 'active' 
                                    ? 'border-white/10 hover:border-purple-500/40 hover:shadow-purple-950/20' 
                                    : 'border-white/5 opacity-60 hover:opacity-80'
                                }`}
                            >
                                {/* Active Accent Corner Element */}
                                {plan.status === 'active' && (
                                    <div className="absolute top-0 right-12 w-16 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                                )}

                                <div>
                                    {/* Card Header Info */}
                                    <div className="flex items-start justify-between pb-4 border-b border-white/15">
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-wide group-hover:text-purple-400 transition">
                                                {plan.name}
                                            </h3>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5 block">
                                                Package Module
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleEdit(plan)}
                                            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition duration-150"
                                        >
                                            <FaEdit className="text-xs" />
                                        </button>
                                    </div>

                                    {/* Details Attributes Grid Layout */}
                                    <div className="py-5 space-y-4">
                                        {/* ROI Row Data */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FaPercentage className="text-[11px] text-purple-400" />
                                                <span>Return on Inv. (ROI)</span>
                                            </div>
                                            <span className="font-bold text-emerald-400 tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded text-xs border border-emerald-500/10">
                                                {plan.roi}
                                            </span>
                                        </div>

                                        {/* Referral Metric Row Data */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FaUsers className="text-xs text-indigo-400" />
                                                <span>Direct Referral</span>
                                            </div>
                                            <span className="font-semibold text-slate-200">{plan.direct_referral}</span>
                                        </div>

                                        {/* Ceiling Limit Row Data */}
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <FaArrowAltCircleUp className="text-xs text-amber-400" />
                                                <span>Ceiling Cap Limit</span>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-slate-300">{plan.ceiling_limit}</span>
                                        </div>

                                        {/* Investment Value Interval Range */}
                                        <div className="flex flex-col gap-1.5 pt-1.5">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <FaDollarSign className="text-[10px] text-sky-400" />
                                                <span>Allowed Investment Range</span>
                                            </div>
                                            <div className="bg-[#0c1233]/80 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono font-bold text-purple-300 text-center tracking-wide">
                                                {plan.investment_range}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Operating Status Action Controls Row */}
                                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                                    <span className={`font-bold tracking-wider uppercase text-[10px] ${plan.status === 'active' ? 'text-purple-400' : 'text-slate-500'}`}>
                                        {plan.status} System Node
                                    </span>
                                    
                                    {/* Ultra Modern Custom Slide Toggle Switch */}
                                    <button
                                        onClick={() => togglePlanStatus(plan.id)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none focus:outline-none ${
                                            plan.status === 'active' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-slate-800 border border-white/10'
                                        }`}
                                    >
                                        <span 
                                            className={`absolute top-[3px] left-[3px] bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 ${
                                                plan.status === 'active' ? 'translate-x-5' : 'translate-x-0 bg-slate-400'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DYNAMIC CARD CONTROL/EDIT SPECIFICATION MODAL CONTAINER */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-md bg-[#0b0e26] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        
                        {/* Modal Heading Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d153a]/40">
                            <h3 className="text-sm font-bold text-white tracking-wide">
                                {modalType === 'create' ? 'Assemble Asset Plan Structure' : 'Modify Core Package Parameters'}
                            </h3>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-slate-400 hover:text-white transition text-base focus:outline-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Form Entry Core Fields */}
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Plan Metric Name</label>
                                <input 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g., Titanium Executive Tier"
                                    className="bg-[#0d153a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Yield Ratio (ROI)</label>
                                    <input 
                                        name="roi" 
                                        value={formData.roi} 
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2.5% Daily"
                                        className="bg-[#0d153a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direct Referral %</label>
                                    <input 
                                        name="directReferral" 
                                        value={formData.directReferral} 
                                        onChange={handleInputChange}
                                        placeholder="e.g., 10%"
                                        className="bg-[#0d153a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ceiling Value Threshold Cap</label>
                                <input 
                                    name="ceilingLimit" 
                                    value={formData.ceilingLimit} 
                                    onChange={handleInputChange}
                                    placeholder="e.g., $5,000 Max"
                                    className="bg-[#0d153a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Staking Investment Range Interval</label>
                                <input 
                                    name="investmentRange" 
                                    value={formData.investmentRange} 
                                    onChange={handleInputChange}
                                    placeholder="e.g., $100 - $2000"
                                    className="bg-[#0d153a]/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Initial System Status State</label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleInputChange}
                                    className="bg-[#0f1631] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                                >
                                    <option value="active">Active System Node</option>
                                    <option value="inactive">Inactive System Node</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Action Footer Controls Row */}
                        <div className="px-6 py-4 bg-[#0d153a]/20 border-t border-white/10 flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition active:scale-95"
                            >
                                Cancel Actions
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/50 hover:brightness-110 transition active:scale-95"
                            >
                                {modalType === 'create' ? 'Compile Package Node' : 'Commit Configuration Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HIGH-END TOAST MODAL POPUP DISPLAY LOGIC */}
            {showPopup && (
                <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-[#0d1433] border border-purple-500/30 shadow-2xl shadow-purple-950/50 px-5 py-3.5 rounded-2xl animate-fade-in-up">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                        i
                    </div>
                    <span className="text-xs font-semibold tracking-wide text-slate-200">
                        {popupMessage}
                    </span>
                </div>
            )}
        </div>
    );
};

export default PlansManagement;