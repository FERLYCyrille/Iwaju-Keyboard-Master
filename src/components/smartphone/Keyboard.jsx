import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconTV = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
const IconKeyboard = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h4M14 16h4" /></svg>;
const IconGamepad = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><circle cx="15" cy="11" r="1" /><circle cx="17" cy="13" r="1" /><path d="M4 10a2 2 0 0 0-2 2v2a8 8 0 0 0 8 8h4a8 8 0 0 0 8-8v-2a2 2 0 0 0-2-2H4z" /></svg>;
const IconShift = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 10h5v8h6v-8h5L12 2z" /></svg>;
const IconDelete = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>;
const IconReturn = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10l-5 5 5 5" /><path d="M20 4v7a4 4 0 0 1-4 4H4" /></svg>;
const ChevronUp = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>;
const ChevronDown = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const ChevronLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const ChevronRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

// ── DpadBtn ───────────────────────────────────────────────────────────────────

const DpadBtn = ({ pos, val, active, onPress, children, size }) => (
    <button
        onPointerDown={(e) => onPress(e, val)}
        style={{
            position: 'absolute', ...pos,
            width: size, height: size,
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: active ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
            color: active ? '#00f0ff' : '#7d859b',
            boxShadow: active ? '0 0 20px rgba(0,240,255,0.4), inset 0 0 10px rgba(0,240,255,0.2)' : '0 6px 14px rgba(0,0,0,0.2)',
            transform: active ? 'scale(0.92)' : 'scale(1)',
            touchAction: 'none', cursor: 'pointer',
            transition: 'all 0.08s ease',
        }}
    >
        {children}
    </button>
);

// ── Keyboard Component ────────────────────────────────────────────────────────

const Keyboard = ({ roomCode }) => {
    const [mode, setMode] = useState('TYPING');
    const [activeKey, setActiveKey] = useState(null);
    const [capsMode, setCapsMode] = useState(false);
    const [layer, setLayer] = useState('alpha');

    // ── Layouts ──
    const alphaRows = [
        ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
        ['SHIFT', 'w', 'x', 'c', 'v', 'b', 'n', '⌫'],
        ['123', ' ', 'RETURN'],
    ];

    const numRows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['-', '/', ':', ';', '(', ')', '€', '&', '@', '"'],
        ['#', '.', ',', '?', '!', "'", '%', '⌫'],
        ['ABC', ' ', 'RETURN'],
    ];

    const rows = layer === 'alpha' ? alphaRows : numRows;

    const sendAction = async (value) => {
        const { error } = await supabase
            .from('sessions')
            .update({ last_keypress: value, created_at: new Date().toISOString() })
            .eq('room_code', roomCode);
        if (error) console.error("Erreur d'envoi:", error);
    };

    const handlePress = (e, val) => {
        e.preventDefault();

        // Vibration immédiate au toucher
        if (navigator.vibrate) navigator.vibrate(30);

        // Layer toggle
        if (val === '123') { setLayer('num'); return; }
        if (val === 'ABC') { setLayer('alpha'); return; }

        // Caps toggle
        if (val === 'SHIFT') {
            setCapsMode(p => !p);
            return;
        }

        setActiveKey(val);
        setTimeout(() => setActiveKey(null), 120);

        // Determine what to send
        let toSend = val;
        if (layer === 'alpha' && val !== '⌫' && val !== 'RETURN' && val !== ' ') {
            toSend = capsMode ? val.toUpperCase() : val.toLowerCase();
        }

        sendAction(toSend);
    };

    const isActive = (val) => activeKey === val;
    const isCaps = capsMode && layer === 'alpha';

    const getKeyStyle = (char) => {
        const active = isActive(char);
        const isSpecial = ['SHIFT', '⌫', '123', 'ABC', 'RETURN'].includes(char);
        const isSpace = char === ' ';
        const isShiftActive = char === 'SHIFT' && isCaps;

        return {
            flexShrink: 0,
            flexGrow: isSpace ? 3 : isSpecial ? 1.4 : 1,
            flexBasis: '0',
            minWidth: isSpace ? '60px' : isSpecial ? '32px' : '0',
            height: 'clamp(44px, 7vh, 62px)',
            borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '3px',
            fontSize: isSpace ? '11px' : isSpecial ? '12px' : 'clamp(13px, 2vw, 17px)',
            fontWeight: active || isShiftActive ? 700 : 500,
            letterSpacing: isSpace ? '0.08em' : '0',
            // ✅ textTransform supprimé — c'est renderLabel qui gère la casse
            touchAction: 'none', cursor: 'pointer',
            transition: 'all 0.08s ease',
            background: isShiftActive
                ? 'rgba(0,240,255,0.2)'
                : active
                    ? 'rgba(0,240,255,0.15)'
                    : isSpecial
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(255,255,255,0.06)',
            border: isShiftActive
                ? '1px solid #00f0ff'
                : active
                    ? '1px solid #00f0ff'
                    : '1px solid rgba(255,255,255,0.04)',
            color: isShiftActive || active ? '#00f0ff' : isSpecial ? '#a0aec0' : '#e2e8f0',
            boxShadow: active || isShiftActive
                ? '0 0 12px rgba(0,240,255,0.4), inset 0 0 6px rgba(0,240,255,0.15)'
                : '0 2px 4px rgba(0,0,0,0.2)',
            transform: active ? 'scale(0.93)' : 'scale(1)',
        };
    };

    const renderLabel = (char) => {
        if (char === 'SHIFT') return <><IconShift />{isCaps ? <span style={{ fontSize: '8px', letterSpacing: '0.05em' }}>ON</span> : null}</>;
        if (char === '⌫') return <IconDelete />;
        if (char === 'RETURN') return <IconReturn />;
        if (char === ' ') return 'Space';
        if (char === '123') return '123';
        if (char === 'ABC') return 'ABC';
        // ✅ Affichage en minuscule ou majuscule selon capsMode
        if (layer === 'alpha' && char.length === 1) {
            return capsMode ? char.toUpperCase() : char.toLowerCase();
        }
        return char;
    };

    const dpadSize = 'clamp(200px, 55vw, 280px)';
    const btnSize = 'clamp(58px, 16vw, 76px)';
    const btnOffset = 'clamp(71px, 20vw, 92px)';

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                background: '#0d0f18',
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0,240,255,0.05) 0%, transparent 60%)',
                fontFamily: '"Inter", system-ui, sans-serif',
                color: '#fff',
                userSelect: 'none',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between"
                style={{
                    padding: 'clamp(10px, 2.5vw, 20px) clamp(14px, 4vw, 24px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(13,15,24,0.9)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 20,
                }}
            >
                <span className="font-semibold tracking-wide" style={{ fontSize: 'clamp(13px, 3vw, 16px)' }}>
                    Iwaju Controller
                </span>
                <div className="flex items-center gap-2">
                    <span style={{
                        width: 'clamp(6px,1.5vw,8px)', height: 'clamp(6px,1.5vw,8px)',
                        borderRadius: '50%', background: '#00f0ff',
                        boxShadow: '0 0 10px #00f0ff', flexShrink: 0,
                    }} />
                    <span style={{ color: '#00f0ff', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Connected · {roomCode}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div
                style={{
                    margin: 'clamp(10px, 2.5vw, 16px) clamp(10px, 3vw, 20px)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '4px',
                    display: 'flex',
                }}
            >
                {[
                    { id: 'TYPING', label: 'Keyboard', Icon: IconKeyboard },
                    { id: 'NAV', label: 'D-Pad', Icon: IconGamepad },
                ].map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        onClick={() => setMode(id)}
                        style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            padding: 'clamp(7px, 1.8vw, 10px) 0',
                            fontSize: 'clamp(10px, 2.5vw, 13px)',
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            borderRadius: '9px',
                            background: mode === id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: mode === id ? '#fff' : '#7d859b',
                            border: 'none',
                            boxShadow: mode === id ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <Icon /> {label}
                    </button>
                ))}
            </div>

            {mode === 'TYPING' ? (
                <>
                    {/* Hint */}
                    <div className="flex flex-col items-center gap-1" style={{ opacity: 0.45, paddingBottom: '6px' }}>
                        <span style={{ color: '#7d859b' }}><IconTV /></span>
                        <p style={{ fontSize: 'clamp(10px, 2.2vw, 13px)', color: '#7d859b', textAlign: 'center', lineHeight: 1.4, fontWeight: 500, margin: 0 }}>
                            Regarde la TV pour voir le texte
                        </p>
                    </div>

                    {/* Keyboard */}
                    <div
                        className="flex flex-col mt-auto"
                        style={{
                            padding: '0 clamp(4px, 1.5vw, 10px) clamp(12px, 3vw, 24px)',
                            gap: 'clamp(4px, 1vw, 7px)',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                        }}
                    >
                        {rows.map((row, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(3px, 0.7vw, 5px)' }}>
                                {row.map(char => (
                                    <button
                                        key={char}
                                        onPointerDown={(e) => handlePress(e, char)}
                                        style={getKeyStyle(char)}
                                    >
                                        {renderLabel(char)}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* D-PAD */
                <div className="flex flex-col items-center justify-center flex-1" style={{ paddingBottom: 'clamp(32px, 8vw, 80px)' }}>
                    <p style={{
                        fontSize: 'clamp(10px, 2.5vw, 14px)',
                        color: '#7d859b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        fontWeight: 600,
                        marginBottom: 'clamp(32px, 8vw, 60px)',
                    }}>
                        Menu Navigation
                    </p>

                    <div style={{ width: dpadSize, height: dpadSize, position: 'relative' }}>
                        <DpadBtn pos={{ top: 0, left: btnOffset }} val="UP" active={isActive('UP')} onPress={handlePress} size={btnSize}><ChevronUp /></DpadBtn>
                        <DpadBtn pos={{ top: btnOffset, left: 0 }} val="LEFT" active={isActive('LEFT')} onPress={handlePress} size={btnSize}><ChevronLeft /></DpadBtn>
                        <DpadBtn pos={{ top: btnOffset, right: 0 }} val="RIGHT" active={isActive('RIGHT')} onPress={handlePress} size={btnSize}><ChevronRight /></DpadBtn>
                        <DpadBtn pos={{ bottom: 0, left: btnOffset }} val="DOWN" active={isActive('DOWN')} onPress={handlePress} size={btnSize}><ChevronDown /></DpadBtn>

                        <button
                            onPointerDown={(e) => handlePress(e, 'OK')}
                            style={{
                                position: 'absolute',
                                top: btnOffset, left: btnOffset,
                                width: btnSize, height: btnSize,
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isActive('OK') ? '#b829ff' : 'rgba(184,41,255,0.1)',
                                border: '2px solid #b829ff',
                                color: isActive('OK') ? '#fff' : '#b829ff',
                                fontSize: 'clamp(14px, 3.5vw, 18px)',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                boxShadow: '0 0 24px rgba(184,41,255,0.3), inset 0 0 12px rgba(184,41,255,0.2)',
                                transform: isActive('OK') ? 'scale(0.92)' : 'scale(1)',
                                touchAction: 'none', cursor: 'pointer',
                                transition: 'all 0.08s ease',
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Keyboard;
