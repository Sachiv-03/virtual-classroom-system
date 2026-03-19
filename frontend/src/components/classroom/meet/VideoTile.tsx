import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Hand } from 'lucide-react';

interface VideoTileProps {
    stream: MediaStream | null;
    name: string;
    isLocal?: boolean;
    isMuted?: boolean;
    isSpeaking?: boolean;
    hasRaisedHand?: boolean;
    isPinned?: boolean;
    onPin?: () => void;
}

export const VideoTile: React.FC<VideoTileProps> = ({ stream, name, isLocal, isMuted, isSpeaking, hasRaisedHand, isPinned, onPin }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [speaking, setSpeaking] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Active Speaker Detection
    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) return;
        
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContextRef.current.createAnalyser();
            const microphone = audioContextRef.current.createMediaStreamSource(stream);
            const javascriptNode = audioContextRef.current.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(audioContextRef.current.destination);

            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;
                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += (array[i]);
                }
                const average = values / length;
                if (average > 20) { // Threshold for speaking
                    setSpeaking(true);
                } else {
                    setSpeaking(false);
                }
            };
        } catch (e) {
            console.error("Audio detection error", e);
        }

        return () => {
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
            }
        };
    }, [stream]);

    const activeRing = speaking || isSpeaking ? 'ring-4 ring-green-500' : 'ring-1 ring-border';

    if (!stream) {
        return (
            <div onClick={onPin} className={`relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center w-full h-full min-h-[200px] ${activeRing} group shadow-lg flex-1 cursor-pointer transition-all`}>
                 <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner">
                    <span className="text-4xl font-light text-zinc-500">{name.charAt(0).toUpperCase()}</span>
                 </div>
                 <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm truncate max-w-[80%] flex items-center gap-2">
                    {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                    <span>{name} {isLocal ? "(You)" : ""}</span>
                </div>
                {hasRaisedHand && (
                    <div className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur-md p-2 rounded-xl text-white shadow-lg animate-bounce">
                        <Hand className="w-5 h-5" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div onClick={onPin} className={`relative bg-black rounded-2xl overflow-hidden flex items-center justify-center w-full h-full flex-1 min-h-[200px] ${activeRing} group shadow-lg cursor-pointer transition-all`}>
            <video 
                playsInline 
                autoPlay 
                muted={isLocal} 
                ref={videoRef} 
                className="w-full h-full object-cover"
                style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
            />
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm truncate max-w-[80%] flex items-center gap-2">
                {isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                <span>{name} {isLocal ? "(You)" : ""}</span>
            </div>
            {hasRaisedHand && (
                <div className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur-md p-2 rounded-xl text-white shadow-lg animate-bounce">
                    <Hand className="w-5 h-5" />
                </div>
            )}
        </div>
    );
};
