'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from "react";
import axios from "axios";

const InterviewInput = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false); // New: Loading state
    const router = useRouter();



const handleStart = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    try {
        // 1. Send prompt to Python Backend
        const response = await axios.post(
            "http://127.0.0.1:8000/start",
            { business_prompt: prompt },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const data = response.data;

        // 2. data contains { "session_id": "...", "question": "..." }
        console.log("Session Started:", data);

        // 3. Store session data
        sessionStorage.setItem("current_session_id", data.session_id);
        sessionStorage.setItem("initial_question", data.question);

        router.push("/interview");

    } catch (error) {
        console.error("Error starting interview:", error);

        // Axios gives better error info 🔍
        if (error.response) {
            alert(error.response.data?.message || "Server error");
        } else if (error.request) {
            alert("No response from server. Is backend running?");
        } else {
            alert("Something went wrong");
        }
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="w-full flex flex-col gap-4 mt-2">
            <div className="relative w-full group">
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        zIndex: 0,
                    }}
                />
                <input
                    id="prompt-input"
                    type="text"
                    disabled={isLoading}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder={isLoading ? "Generating session..." : "Collect testimonial for my pizza restaurant…"}
                    className="relative w-full rounded-xl px-5 py-4 text-base sm:text-lg outline-none transition-all duration-300"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f9fafb',
                        zIndex: 1,
                        backdropFilter: 'blur(12px)',
                    }}
                    autoFocus
                />
            </div>

            <button
                id="start-interview-btn"
                onClick={handleStart}
                disabled={!prompt.trim() || isLoading}
                className="w-full rounded-xl px-6 py-4 text-base sm:text-lg font-semibold text-white transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40"
                style={{
                    background: (prompt.trim() && !isLoading)
                        ? 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)'
                        : 'linear-gradient(135deg, #4b2d8a 0%, #2a5091 100%)',
                }}
            >
                {isLoading ? "Preparing Alex..." : "Start Video Interview"}
            </button>
        </div>
    );
};

export default InterviewInput;