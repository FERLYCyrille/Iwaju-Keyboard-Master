import { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import Keyboard from './Keyboard';

const RemoteControl = () => {
    const [inputCode, setInputCode] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const handleJoin = async () => {
        setError('');

        const { data, error: supabaseError } = await supabase
            .from('sessions')
            .select('*')
            .eq('room_code', inputCode.trim())
            .single();

        if (supabaseError || !data) {
            setError("Code invalide. Vérifie l'écran TV.");
            return;
        }

        setRoomCode(inputCode.trim());
        setIsConnected(true);
    };

    if (isConnected) {
        return <Keyboard roomCode={roomCode} />;
    }

    return (
        <div
            style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0d0f18',
                color: '#fff',
                fontFamily: 'system-ui'
            }}
        >
            <h2 style={{ marginBottom: 10 }}>IWAJU Controller</h2>
            <p style={{ opacity: 0.6 }}>Entre le code affiché sur la TV</p>

            <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="AB12"
                style={{
                    marginTop: 20,
                    fontSize: '2rem',
                    textAlign: 'center',
                    width: 140,
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #333',
                    background: '#111',
                    color: '#fff'
                }}
            />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button
                onClick={handleJoin}
                style={{
                    marginTop: 20,
                    padding: '12px 24px',
                    borderRadius: 10,
                    background: '#00f0ff',
                    border: 'none',
                    fontWeight: 600
                }}
            >
                Connecter
            </button>
        </div>
    );
};

export default RemoteControl;