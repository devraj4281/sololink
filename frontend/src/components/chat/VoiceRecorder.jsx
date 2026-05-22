import { useState, useRef, useEffect } from "react";
import { Mic, Square, X, Send } from "lucide-react";

/**
 * Voice message recorder.
 * onSend(blob, durationSecs) — called with recorded audio blob
 * onCancel — called when user dismisses recording
 */
function VoiceRecorder({ onSend, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const blobRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Release mic
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      startTimer();
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow access and try again.");
      } else {
        setError("Could not access microphone.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const handleSend = () => {
    if (blobRef.current) {
      onSend(blobRef.current, duration);
    }
  };

  const handleCancel = () => {
    stopTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    onCancel();
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl" style={{ background: "var(--surface-high)", color: "var(--error, #ef4444)" }}>
        <span className="text-sm flex-1">{error}</span>
        <button onClick={handleCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl animate-in fade-in" style={{ background: "var(--surface-high)" }}>
      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        style={{ color: "var(--on-surface-variant)" }}
        title="Cancel"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Waveform + timer */}
      <div className="flex-1 flex items-center gap-2">
        {isRecording && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
        )}
        <WaveformBars active={isRecording} />
        <span className="text-sm font-mono font-medium shrink-0" style={{ color: "var(--on-surface)", minWidth: "2.75rem" }}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Stop / Send */}
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
          title="Stop recording"
        >
          <Square className="w-4 h-4 text-white fill-white" />
        </button>
      ) : hasRecording ? (
        <button
          onClick={handleSend}
          className="w-9 h-9 flex items-center justify-center rounded-full shadow-sm transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)", color: "var(--on-primary)" }}
          title="Send voice message"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      ) : null}
    </div>
  );
}

function WaveformBars({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-6 flex-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full flex-1"
          style={{
            background: "var(--primary)",
            opacity: active ? 0.7 + Math.random() * 0.3 : 0.3,
            height: active ? `${20 + Math.random() * 60}%` : "30%",
            transition: "height 0.15s ease",
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default VoiceRecorder;
