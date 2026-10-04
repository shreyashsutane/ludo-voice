import {useEffect,useRef,useState} from 'react';

// Analyzes audio volume for local and remote WebRTC streams
export function useAudioActivity(
  streams: Record<string, MediaStream>,
  localStream?: MediaStream | null,
  myId?: string,
  micOn?: boolean
): Record<string, boolean> {
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Map<string, { src: MediaStreamAudioSourceNode; analyser: AnalyserNode; track: MediaStreamTrack }>>(new Map());
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Collect all active streams: remote peers + local user (if mic is on)
    const activeStreams: Record<string, MediaStream> = { ...streams };
    if (micOn && localStream && myId) {
      activeStreams[myId] = localStream;
    }

    try {
      if (!ctxRef.current && (Object.keys(activeStreams).length > 0)) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch {}

    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const currentNodes = nodesRef.current;
    const activeKeys = new Set(Object.keys(activeStreams));

    // Remove defunct nodes
    for (const [key, node] of currentNodes.entries()) {
      if (!activeKeys.has(key)) {
        try { node.src.disconnect(); } catch {}
        currentNodes.delete(key);
      }
    }

    // Attach nodes for new streams
    for (const [key, stream] of Object.entries(activeStreams)) {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || !audioTrack.enabled) {
        if (currentNodes.has(key)) {
          try { currentNodes.get(key)!.src.disconnect(); } catch {}
          currentNodes.delete(key);
        }
        continue;
      }

      const existing = currentNodes.get(key);
      if (existing && existing.track === audioTrack) continue;

      try {
        if (existing) existing.src.disconnect();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.4;
        src.connect(analyser);
        currentNodes.set(key, { src, analyser, track: audioTrack });
      } catch (err) {
        console.warn('AudioAnalyser connect error:', err);
      }
    }

    // Periodic volume measurement
    clearInterval(timerRef.current);
    const buf = new Uint8Array(32);

    timerRef.current = setInterval(() => {
      if (currentNodes.size === 0) {
        setSpeaking(prev => Object.keys(prev).length === 0 ? prev : {});
        return;
      }

      const nextSpeaking: Record<string, boolean> = {};
      let hasAny = false;

      for (const [key, node] of currentNodes.entries()) {
        try {
          node.analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          const avg = sum / buf.length;
          // Threshold for human speech vs quiet background noise
          const isTalking = avg > 14;
          if (isTalking) {
            nextSpeaking[key] = true;
            hasAny = true;
          }
        } catch {}
      }

      setSpeaking(prev => {
        // Quick shallow diff check to avoid unnecessary re-renders
        const prevKeys = Object.keys(prev).filter(k => prev[k]);
        const nextKeys = Object.keys(nextSpeaking);
        if (prevKeys.length === nextKeys.length && nextKeys.every(k => prev[k])) {
          return prev;
        }
        return nextSpeaking;
      });
    }, 90);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [streams, localStream, myId, micOn]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      for (const node of nodesRef.current.values()) {
        try { node.src.disconnect(); } catch {}
      }
      nodesRef.current.clear();
      if (ctxRef.current) {
        try { ctxRef.current.close(); } catch {}
        ctxRef.current = null;
      }
    };
  }, []);

  return speaking;
}
