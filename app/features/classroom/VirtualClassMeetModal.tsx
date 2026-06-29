'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiLink, HiCheck, HiMinus, HiChevronUp, HiVideoCamera, HiStop } from 'react-icons/hi';

interface VirtualClassMeetModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomName: string;
    displayName: string;
}

const VirtualClassMeetModal: React.FC<VirtualClassMeetModalProps> = ({ isOpen, onClose, roomName, displayName }) => {
    const iframeRefRef = React.useRef<HTMLIFrameElement>(null);
    const [copied, setCopied] = React.useState(false);
    const [isMinimized, setIsMinimized] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);

    const [livekitToken, setLivekitToken] = React.useState<string>('');
    const [livekitError, setLivekitError] = React.useState<string>('');
    const [loadingToken, setLoadingToken] = React.useState<boolean>(false);

    const provider = process.env.NEXT_PUBLIC_VIDEO_PROVIDER || 'jitsi';

    React.useEffect(() => {
        if (!isOpen) {
            setLivekitToken('');
            setLivekitError('');
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen || provider !== 'livekit') return;

        const fetchToken = async () => {
            setLoadingToken(true);
            setLivekitError('');
            try {
                const response = await fetch(`/api/livekit/token?room=${roomName}&username=${encodeURIComponent(displayName)}`);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch token');
                }
                const data = await response.json();
                if (data.token) {
                    setLivekitToken(data.token);
                } else {
                    setLivekitError(data.error || 'Failed to fetch token');
                }
            } catch (err) {
                setLivekitError((err as Error).message || 'Failed to fetch video call token');
                console.error(err);
            } finally {
                setLoadingToken(false);
            }
        };

        fetchToken();
    }, [isOpen, roomName, displayName, provider]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30 } },
                audio: true
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm; codecs=vp9'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Class_Recording_${roomName}_${new Date().toLocaleDateString()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording failed:", err);
            alert("To record, please allow screen sharing permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 1. Script to hide Jitsi Watermarks inside the Iframe
    const hideWatermark = React.useCallback(() => {
        try {
            const iframe = iframeRefRef.current;
            if (!iframe) return;

            // Note: On meet.jit.si (cross-domain), this will be blocked by the browser.
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                const elements = doc.querySelectorAll('.leftwatermark, .watermark, .jitsi-watermark');
                elements.forEach((el) => {
                    const htmlEl = el as HTMLElement;
                    htmlEl.style.setProperty('display', 'none', 'important');
                    htmlEl.style.setProperty('background', 'none', 'important');
                    htmlEl.style.setProperty('visibility', 'hidden', 'important');
                });
            }
        } catch {
            // expected CORS restriction
        }
    }, []);

    React.useEffect(() => {
        if (!isOpen || provider !== 'jitsi') return;
        const interval = setInterval(hideWatermark, 1000); // Check every second
        return () => clearInterval(interval);
    }, [isOpen, hideWatermark, provider]);

    // 2. Browser Reload Confirmation Popup
    React.useEffect(() => {
        if (!isOpen) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Are you sure you want to leave the meeting? Your session will be closed.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isOpen]);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/classroom?room=${roomName}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseAttempt = () => {
        setShowConfirm(true);
    };

    const [participants, setParticipants] = React.useState<string[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleApiReady = useCallback((externalApi: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        externalApi.on('participantJoined', (data: any) => {
            const name = data.displayName || 'Anonymous Student';
            setParticipants(prev => Array.from(new Set([...prev, name])));
            console.log(`Class Attendance Update: ${name} joined.`);
        });

        externalApi.on('videoConferenceLeft', () => {
            onClose();
        });

        externalApi.on('chatUpdated', (data: { isOpen: boolean }) => {
            setIsChatOpen(data.isOpen);
            // Manually trigger the watermark cleaner when chat is toggled
            setTimeout(hideWatermark, 100);
            setTimeout(hideWatermark, 1000);
            setTimeout(hideWatermark, 2500);
        });

        externalApi.on('videoConferenceJoined', () => {
            externalApi.executeCommand('subject', 'Secure Virtual Class');
            externalApi.executeCommand('displayName', displayName);
        });
    }, [onClose, displayName, hideWatermark]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 1,
                        backgroundColor: isMinimized ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.6)',
                        backdropFilter: isMinimized ? 'blur(0px)' : 'blur(12px)'
                    }}
                    exit={{ opacity: 0 }}
                    className={`fixed z-[100] transition-all duration-500 ${isMinimized ? 'bottom-4 right-4 md:bottom-6 md:right-6 w-auto h-auto pointer-events-none' : 'inset-0 pointer-events-auto'}`}
                >
                    <motion.div
                        layout
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{
                            scale: 1,
                            y: 0,
                            width: isMinimized ? (isMobile ? '160px' : '380px') : '100%',
                            height: isMinimized ? (isMobile ? '100px' : '240px') : '100vh',
                        }}
                        exit={{ scale: 0.95, y: 20 }}
                        className={`bg-white overflow-hidden shadow-2xl border border-white/20 relative pointer-events-auto transition-all duration-500 ${isMinimized ? 'rounded-lg' : 'rounded-none'}`}
                    >
                        {/* Header Actions */}
                        <div className={`absolute top-4 right-4 z-[110] flex items-center gap-2 ${isMinimized ? 'opacity-0 hover:opacity-100 transition-opacity' : ''}`}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex items-center gap-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'} text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all font-bold text-sm shadow-lg ${isMinimized ? 'scale-75' : ''}`}
                            >
                                {isRecording ? <HiStop className="animate-pulse" /> : <HiVideoCamera className="text-red-400" />}
                                {!isMinimized && (isRecording ? 'Stop Recording' : 'Record Class')}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyLink}
                                className={`flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/20 transition-all font-bold text-sm shadow-lg ${isMinimized ? 'scale-75' : ''}`}
                            >
                                {copied ? <HiCheck className="text-green-400" /> : <HiLink className="text-blue-300" />}
                                {!isMinimized && (copied ? 'Copied URL!' : 'Share Meeting')}
                            </motion.button>

                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-lg"
                                title={isMinimized ? "Maximize" : "Minimize"}
                            >
                                {isMinimized ? <HiChevronUp className="text-xl" /> : <HiMinus className="text-xl" />}
                            </button>

                            <button
                                onClick={handleCloseAttempt}
                                className="w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-lg"
                                title="Close Meeting"
                            >
                                <HiX className="text-xl" />
                            </button>
                        </div>

                        {/* Leave Confirmation Overlay */}
                        <AnimatePresence>
                            {showConfirm && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center border border-gray-100"
                                    >
                                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <HiX className="text-3xl" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2 oswald-font capitalize tracking-wide">Leave Meeting?</h3>
                                        <p className="text-gray-500 text-sm mb-8">Are you sure you want to end or leave this classroom session?</p>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={onClose}
                                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-200"
                                            >
                                                Yes, Leave Meeting
                                            </button>
                                            <button
                                                onClick={() => setShowConfirm(false)}
                                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Jitsi Container */}
                        <div className="w-full h-full relative">
                            {/* Top Left Branding Overlay (In case Jitsi branding is disabled/overridden) */}
                            {!isMinimized && !isChatOpen && (
                                <div className="absolute top-8 left-6 z-[110] pointer-events-none flex items-center gap-3">
                                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg border border-white/40 flex items-center gap-2">
                                        <div className="w-6 h-6 relative">
                                            <Image src="/images/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                                        </div>
                                        <span className="oswald-font font-bold text-sm tracking-tight">
                                            <span className="text-[var(--color-primary)]">TEACHER</span>
                                            <span className="text-[var(--color-secondary)]">DESK</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {provider === 'livekit' ? (
                                <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative">
                                    {loadingToken ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                                            <p className="text-white text-sm font-medium">Connecting to secure video classroom...</p>
                                        </div>
                                    ) : livekitError ? (
                                        <div className="text-center p-6 bg-red-950/20 rounded-xl border border-red-500/30 max-w-sm w-full mx-4 shadow-xl">
                                            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <HiX className="text-2xl" />
                                            </div>
                                            <p className="text-red-400 font-bold mb-1">Connection Error</p>
                                            <p className="text-gray-400 text-xs mb-6 leading-relaxed">{livekitError}</p>
                                            <button
                                                onClick={onClose}
                                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-red-200"
                                            >
                                                Close Window
                                            </button>
                                        </div>
                                    ) : livekitToken ? (
                                        <LiveKitRoom
                                            video={true}
                                            audio={true}
                                            token={livekitToken}
                                            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                                            data-lk-theme="default"
                                            style={{ height: '100%', width: '100%' }}
                                            onDisconnected={onClose}
                                        >
                                            <VideoConference />
                                            <RoomAudioRenderer />
                                        </LiveKitRoom>
                                    ) : null}
                                </div>
                            ) : (
                                <JitsiMeeting
                                    domain="meet.jit.si"
                                    roomName={roomName}
                                    configOverwrite={{
                                        startWithAudioMuted: true,
                                        disableModeratorIndicator: false,
                                        startScreenSharing: true,
                                        enableEmailInStats: false,
                                        prejoinPageEnabled: false,
                                        enableRecording: true,
                                        fileRecordingsEnabled: true,
                                        fileRecordingsServiceEnabled: true,
                                        recordingServiceEnabled: true,
                                        localRecording: {
                                            enabled: true,
                                            disable: false,
                                            format: 'mp4',
                                        },
                                        whiteboard: {
                                            enabled: true
                                        },
                                        toolbarButtons: [
                                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording', 'local-recording',
                                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                            'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
                                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                                            'security', 'whiteboard'
                                        ],
                                        disableThirdPartyRequests: true,
                                        enableInsecureRoomNameWarning: false,
                                        giphy: {
                                            enabled: false
                                        },
                                        disableRecordAudioNotification: true,
                                        readOnlyName: true,
                                        chromeExtensionBanner: {
                                            disable: true,
                                        },
                                        disableDeepLinking: true,
                                        doNotStoreRoom: true,
                                        logoImageUrl: '',
                                        logoClickUrl: 'https://teachers-desk.app',
                                        defaultLocalDisplayName: 'Teacher',
                                        defaultRemoteDisplayName: 'Student',
                                        disableSelfViewSettings: true,
                                        brandingDataUrl: '',
                                        dynamicBrandingUrl: '',
                                        hideLander: true,
                                        branding: {
                                            logoUrl: '',
                                            logoClickUrl: 'https://teachers-desk.app',
                                        },
                                        disableRemoteControl: true,
                                        p2p: { enabled: true },
                                        conferenceInfo: {
                                            alwaysVisible: ['recording', 'local-recording'],
                                            autoHide: ['subject', 'participants-count']
                                        },
                                    }}
                                    interfaceConfigOverwrite={{
                                        APP_NAME: 'TeacherDesk',
                                        NATIVE_APP_NAME: 'TeacherDesk',
                                        SHOW_JITSI_WATERMARK: false,
                                        SHOW_WATERMARK_FOR_GUESTS: false,
                                        HIDE_WATERMARK_FOR_GUESTS: true,
                                        SHOW_BRAND_WATERMARK: false,
                                        SHOW_POWERED_BY: false,
                                        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
                                        HIDE_DEEP_LINKING_LOGO: true,
                                        MOBILE_APP_PROMO: false,
                                        ENABLE_FEEDBACK_ANIMATION: false,
                                        DISABLE_FOCUS_INDICATOR: true,
                                        VIDEO_QUALITY_LABEL_DISABLED: true,
                                        HIDE_INVITE_ON_WELCOME_PAGE: true,
                                        DISABLE_TRANSCRIPTION_SUBTITLES: true,
                                        ENABLE_DIAL_OUT: false,
                                        RECENT_LIST_ENABLED: false,
                                        GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
                                        DISPLAY_WELCOME_PAGE_CONTENT: false,
                                        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
                                        ENABLE_WATERMARK: false,
                                        HIDE_WATERMARK_ON_MOBILE: true,
                                        POLICY_LOGO_24DP: '',
                                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                                        SHOW_CHROME_EXTENSION_BANNER: false,
                                        SHOW_INVITE_TO_PARTICIPANTS_AD: false,
                                        DISABLE_PRESENCE_STATUS_DISPLAY: true,
                                        DEFAULT_LOGO_URL: '',
                                        JITSIMEET_LOGO_URL: '',
                                        WATERMARK_LOGO_URL: '',
                                        BRAND_WATERMARK_LINK: 'https://teachers-desk.app',
                                        JITSI_WATERMARK_LINK: 'https://teachers-desk.app',
                                        DYNAMIC_BRANDING_URL: '',
                                    }}
                                    userInfo={{
                                        displayName: displayName,
                                        email: '',
                                    }}
                                    onApiReady={handleApiReady}
                                    getIFrameRef={(iframeRef) => {
                                        iframeRef.style.height = '100%';
                                        iframeRef.style.width = '100%';
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (iframeRefRef as any).current = iframeRef;
                                    }}
                                />
                            )}
                        </div>

                        {/* Attendance Tracker Badge */}
                        <div className={`absolute bottom-20 left-6 z-[110] transition-opacity ${isMinimized || isChatOpen ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="bg-white/90 backdrop-blur-md rounded-lg p-3 shadow-lg border border-white/50 min-w-[180px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-gray-500 capitalize tracking-widest">Live Attendance</span>
                                </div>
                                <div className="max-h-24 overflow-y-auto sidebar-scroll pr-2">
                                    <p className="text-[11px] font-bold text-[var(--color-primary)] mb-1">Students ({participants.length}):</p>
                                    {participants.length === 0 ? (
                                        <p className="text-[10px] text-gray-400 italic">Waiting for students...</p>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {participants.map((p, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-bold">{p.charAt(0)}</div>
                                                    <span className="text-[10px] font-medium text-gray-700 truncate">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Branding Overlay */}
                        <div className={`absolute bottom-4 left-6 pointer-events-none transition-opacity ${isChatOpen ? 'opacity-0' : 'opacity-100'}`}>
                            <h2 className='text-sm oswald-font font-bold py-1 px-3 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/40'>
                                <span className='text-[var(--color-primary)]'>Teacher</span><span className='text-[var(--color-secondary)]'>Desk</span>
                                <span className="ml-2 text-gray-400 font-medium text-[10px] capitalize tracking-widest">Secure Room</span>
                            </h2>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VirtualClassMeetModal;
