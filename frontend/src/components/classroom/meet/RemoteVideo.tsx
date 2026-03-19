import React, { useState, useEffect } from 'react';
import { Instance as PeerInstance } from 'simple-peer';
import { VideoTile } from './VideoTile';

interface RemoteVideoProps {
    peer: PeerInstance;
    name: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    hasRaisedHand?: boolean;
    isPinned?: boolean;
    onPin?: () => void;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({ peer, name, isMuted, isVideoOff, hasRaisedHand, isPinned, onPin }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const handleStream = (remoteStream: MediaStream) => {
            setStream(remoteStream);
        };

        const handleClose = () => {
            setStream(null);
        };

        peer.on('stream', handleStream);
        peer.on('close', handleClose);
        peer.on('error', handleClose);

        return () => {
             // In simple-peer, you usually don't remove event listeners manually like this unless caching peers,
             // but it's safe to clean up if the component unmounts.
             // peer.removeListener('stream', handleStream);
        };
    }, [peer]);

    return (
        <VideoTile 
            stream={isVideoOff ? null : stream} 
            name={name} 
            isLocal={false} 
            isMuted={isMuted} 
            hasRaisedHand={hasRaisedHand} 
            isPinned={isPinned} 
            onPin={onPin} 
        />
    );
};
