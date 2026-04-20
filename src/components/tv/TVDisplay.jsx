import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../supabaseClient';
import { generateRoomCode } from '../../utils/generateCode';

const TVDisplay = () => {
    const phrases = useMemo(() => [
        "Iwaju Tech est le futur.",
        "Le développement web est un art.",
        "React et Supabase sont puissants.",
        "La programmation demande de la rigueur.",
        "Le code propre est durable.",
        "Un bon développeur apprend chaque jour.",
        "La persévérance fait la différence.",
        "Le travail en équipe améliore les projets.",
        "Comprendre avant de coder est essentiel.",
        "Les erreurs font partie de l’apprentissage.",
        "La logique est la base de tout programme.",
        "Un projet bien structuré est plus facile à maintenir.",
        "La pratique régulière améliore les compétences.",
        "Un bon design rend une application agréable.",
        "La simplicité est souvent la meilleure solution.",
        "Tester son code évite beaucoup de problèmes.",
        "La curiosité pousse à progresser.",
        "Chaque bug est une opportunité d’apprendre.",
        "Le développement demande du temps et de la patience.",
        "Un code lisible est un code utile."
    ], []);

    const [roomCode, setRoomCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gameState, setGameState] = useState('playing');
    const [targetText, setTargetText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errors, setErrors] = useState(0);
    const [totalCharsTyped, setTotalCharsTyped] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [wpm, setWpm] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [focusedButton, setFocusedButton] = useState(0);
    const [restartFocused, setRestartFocused] = useState(false);

    useEffect(() => {
        if (gameState !== 'playing' || !startTime) return;
        const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(interval);
    }, [gameState, startTime]);

    const formattedTime = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
    const accuracy = totalCharsTyped > 0 ? Math.round(((totalCharsTyped - errors) / totalCharsTyped) * 100) : 100;

    useEffect(() => {
        const initSession = async () => {
            const code = generateRoomCode();
            setTargetText(phrases[Math.floor(Math.random() * phrases.length)]);
            const { error } = await supabase
                .from('sessions')
                .insert([{ room_code: code, game_state: { status: 'waiting', wpm: 0 } }]);
            if (!error) { setRoomCode(code); setLoading(false); }
            else console.error("Erreur d'initialisation:", error);
        };
        initSession();
    }, [phrases]);

    const resetGame = useCallback(() => {
        setTargetText(phrases[Math.floor(Math.random() * phrases.length)]);
        setCurrentIndex(0); setErrors(0); setWpm(0);
        setStartTime(null); setTotalCharsTyped(0);
        setElapsed(0); setGameState('playing');
        setFocusedButton(0); setRestartFocused(false);
    }, [phrases]);

    const handleInput = useCallback((char) => {
        if (gameState === 'finished') {
            if (['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(char)) setFocusedButton(p => p === 0 ? 1 : 0);
            if (char === 'OK') { focusedButton === 0 ? resetGame() : window.location.reload(); }
            return;
        }
        if (gameState === 'playing') {
            if (['UP', 'DOWN'].includes(char)) { setRestartFocused(p => !p); return; }
            if (char === 'OK') { if (restartFocused) { resetGame(); } return; }
            if (['LEFT', 'RIGHT'].includes(char)) return;
            setTotalCharsTyped(p => p + 1);
            setCurrentIndex((prevIndex) => {
                if (prevIndex === 0 && !startTime) setStartTime(Date.now());
                const expectedChar = targetText[prevIndex];
                if (char === expectedChar) {
                    const nextIndex = prevIndex + 1;
                    if (startTime) {
                        const minutes = (Date.now() - startTime) / 60000;
                        setWpm(Math.round((nextIndex / 5) / minutes) || 0);
                    }
                    if (nextIndex === targetText.length) setGameState('finished');
                    return nextIndex;
                } else {
                    if (char !== '⌫') setErrors(p => p + 1);
                    return prevIndex;
                }
            });
        }
    }, [startTime, targetText, gameState, focusedButton, restartFocused, resetGame]);

    useEffect(() => {
        if (!roomCode) return;
        const channel = supabase
            .channel('tv-room')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'sessions',
                filter: `room_code=eq.${roomCode}`
            }, (payload) => {
                const key = payload.new.last_keypress;
                if (key) handleInput(key);
            }).subscribe();
        return () => supabase.removeChannel(channel);
    }, [roomCode, handleInput]);

    // ── LOADING ──
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
            <p className="text-sm sm:text-base font-semibold uppercase tracking-widest" style={{ color: '#7d859b' }}>
                Initialisation de la session...
            </p>
        </div>
    );

    // ── FIN DE PARTIE ──
    if (gameState === 'finished') {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-8"
                style={{
                    background: '#050508',
                    backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(0,240,255,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(184,41,255,0.04) 0%, transparent 50%)',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    color: '#fff',
                    gap: 'clamp(24px, 5vw, 64px)',
                }}
            >
                <h1
                    className="font-bold tracking-tight text-center"
                    style={{
                        fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                        color: '#00f0ff',
                        textShadow: '0 0 40px rgba(0,240,255,0.4)',
                    }}
                >
                    TERMINÉ !
                </h1>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-3xl">
                    {[
                        { label: 'Vitesse', value: wpm, unit: 'WPM', color: '#00f0ff' },
                        { label: 'Précision', value: `${accuracy}`, unit: '%', color: '#b829ff' },
                        { label: 'Temps', value: formattedTime, unit: '', color: '#00f0ff' },
                    ].map(({ label, value, unit, color }) => (
                        <div
                            key={label}
                            className="flex-1 flex flex-col items-center rounded-2xl"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(0,240,255,0.15)',
                                padding: 'clamp(16px, 3vw, 32px) clamp(20px, 4vw, 48px)',
                            }}
                        >
                            <span className="font-semibold uppercase mb-2" style={{ color: '#7d859b', fontSize: 'clamp(10px, 1.2vw, 13px)', letterSpacing: '0.15em' }}>
                                {label}
                            </span>
                            <span
                                className="font-bold font-mono leading-none"
                                style={{ color, textShadow: `0 0 30px ${color}60`, fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
                            >
                                {value}<span style={{ fontSize: 'clamp(1rem, 2vw, 2rem)', color: '#5C6270', marginLeft: '4px' }}>{unit}</span>
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xl">
                    <button
                        className="flex-1 font-bold rounded-xl uppercase tracking-wider cursor-none transition-all duration-300"
                        style={{
                            padding: 'clamp(12px, 2vw, 20px) clamp(20px, 3vw, 40px)',
                            fontSize: 'clamp(0.9rem, 1.5vw, 1.4rem)',
                            border: '2px solid #b829ff',
                            color: focusedButton === 0 ? '#000' : '#b829ff',
                            background: focusedButton === 0 ? '#b829ff' : 'rgba(184,41,255,0.1)',
                            boxShadow: focusedButton === 0 ? '0 0 30px rgba(184,41,255,0.5)' : 'none',
                            transform: focusedButton === 0 ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        Nouvelle Phrase
                    </button>
                    <button
                        className="flex-1 font-bold rounded-xl uppercase tracking-wider cursor-none transition-all duration-300"
                        style={{
                            padding: 'clamp(12px, 2vw, 20px) clamp(20px, 3vw, 40px)',
                            fontSize: 'clamp(0.9rem, 1.5vw, 1.4rem)',
                            border: '2px solid rgba(255,255,255,0.15)',
                            color: focusedButton === 1 ? '#fff' : '#7d859b',
                            background: focusedButton === 1 ? 'rgba(255,255,255,0.1)' : 'transparent',
                            transform: focusedButton === 1 ? 'scale(1.05)' : 'scale(1)',
                        }}
                    >
                        Quitter (Menu)
                    </button>
                </div>
            </div>
        );
    }

    // ── JEU EN COURS ──
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                background: 'linear-gradient(135deg, #0a0d15 0%, #05060a 100%)',
                fontFamily: '"Inter", system-ui, sans-serif',
                color: '#fff',
            }}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(0,240,255,0.03) 0%, transparent 50%)' }} />

            {/* HEADER */}
            <div
                className="flex items-center justify-between relative z-10 flex-wrap gap-3"
                style={{ padding: 'clamp(16px, 4vw, 40px) clamp(16px, 5vw, 60px)' }}
            >
                <div className="flex items-center gap-2 sm:gap-4 font-semibold" style={{ fontSize: 'clamp(14px, 2vw, 24px)' }}>
                    <svg width="clamp(20,2vw,32)" height="clamp(20,2vw,32)" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ width: 'clamp(20px, 2.5vw, 32px)', height: 'clamp(20px, 2.5vw, 32px)', filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.6))' }}>
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h4M14 16h4" />
                    </svg>
                    <span className="hidden sm:inline">Iwaju Keyboard Master</span>
                    <span className="sm:hidden">IKM</span>
                </div>

                <div
                    className="flex items-center gap-2 sm:gap-4 rounded-xl"
                    style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(0,240,255,0.2)',
                        boxShadow: 'inset 0 0 20px rgba(0,240,255,0.05)',
                        padding: 'clamp(8px, 1vw, 12px) clamp(12px, 2vw, 24px)',
                    }}
                >
                    <span className="hidden sm:inline font-semibold uppercase" style={{ color: '#00f0ff', fontSize: 'clamp(10px, 1vw, 14px)', letterSpacing: '0.1em' }}>
                        Mobile Session Code
                    </span>
                    <span className="sm:hidden font-semibold uppercase" style={{ color: '#00f0ff', fontSize: '10px', letterSpacing: '0.1em' }}>Code</span>
                    <span className="font-bold font-mono tracking-widest" style={{ fontSize: 'clamp(14px, 1.8vw, 22px)', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                        {roomCode}
                    </span>
                </div>
            </div>

            {/* PHRASE */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-4 sm:px-8 md:px-16" style={{ padding: '0 clamp(16px, 8vw, 100px)' }}>
                <div
                    className="font-medium text-center"
                    style={{
                        fontSize: 'clamp(1.4rem, 4.5vw, 3.8rem)',
                        lineHeight: 1.6,
                        letterSpacing: '0.03em',
                        maxWidth: '1100px',
                        width: '100%',
                        wordBreak: 'break-word',
                    }}
                >
                    {targetText.split('').map((char, index) => {
                        const display = char === ' ' ? '\u00A0' : char;
                        if (index < currentIndex) return (
                            <span key={index} style={{ color: '#00f0ff', textShadow: '0 0 24px rgba(0,240,255,0.6)' }}>{display}</span>
                        );
                        if (index === currentIndex) return (
                            <span key={index}>
                                <span style={{
                                    display: 'inline-block',
                                    width: 'clamp(3px, 0.4vw, 6px)',
                                    height: 'clamp(28px, 4.5vw, 64px)',
                                    background: '#00f0ff',
                                    marginRight: '2px',
                                    verticalAlign: 'middle',
                                    boxShadow: '0 0 16px #00f0ff',
                                    borderRadius: '2px',
                                    animation: 'blink 1s step-end infinite',
                                }} />
                                <span style={{ color: '#4b526b' }}>{display}</span>
                            </span>
                        );
                        return <span key={index} style={{ color: '#4b526b' }}>{display}</span>;
                    })}
                </div>
            </div>

            {/* FOOTER */}
            <div
                className="flex items-center justify-between relative z-10 flex-wrap gap-4"
                style={{
                    padding: 'clamp(16px, 3vw, 40px) clamp(16px, 5vw, 60px)',
                    borderTop: '1px solid rgba(0,240,255,0.05)',
                    background: 'linear-gradient(to top, rgba(0,240,255,0.02), transparent)',
                }}
            >
                <div className="flex gap-6 sm:gap-10 md:gap-16">
                    {[
                        { label: 'WPM', value: wpm },
                        { label: 'Accuracy', value: `${accuracy}%` },
                        { label: 'Time', value: formattedTime },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-1 sm:gap-2">
                            <span
                                className="font-bold font-mono leading-none tabular-nums"
                                style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)', textShadow: '0 0 24px rgba(255,255,255,0.2)' }}
                            >
                                {value}
                            </span>
                            <span
                                className="font-semibold uppercase"
                                style={{ color: '#00f0ff', fontSize: 'clamp(9px, 1vw, 15px)', letterSpacing: '0.15em' }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Restart Button */}
                <button
                    onClick={resetGame}
                    className="flex items-center gap-2 sm:gap-3 rounded-xl font-semibold uppercase tracking-wider cursor-none transition-all duration-200"
                    style={{
                        padding: 'clamp(10px, 1.2vw, 16px) clamp(16px, 2.5vw, 32px)',
                        fontSize: 'clamp(11px, 1.2vw, 18px)',
                        background: restartFocused ? '#b829ff' : 'rgba(184,41,255,0.1)',
                        border: '2px solid #b829ff',
                        color: restartFocused ? '#000' : '#b829ff',
                        boxShadow: restartFocused
                            ? '0 0 40px rgba(184,41,255,0.7), inset 0 0 20px rgba(184,41,255,0.3)'
                            : '0 0 24px rgba(184,41,255,0.3), inset 0 0 16px rgba(184,41,255,0.2)',
                        transform: restartFocused ? 'scale(1.05)' : 'scale(1)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <svg style={{ width: 'clamp(12px, 1.2vw, 18px)', height: 'clamp(12px, 1.2vw, 18px)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 2.25-5.85" /><path d="M3 6v6h6" />
                    </svg>
                    <span className="hidden sm:inline">Changer de phrase</span>
                    <span className="sm:hidden">Restart</span>
                </button>
            </div>

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
        </div>
    );
};

export default TVDisplay;