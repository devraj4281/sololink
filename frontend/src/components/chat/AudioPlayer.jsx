import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

/**
 * Audio player for voice messages.
 * audioUrl: string URL to the audio
 * duration: number (seconds, optional hint)
 */
function AudioPlayer({ audioUrl, duration: hintDuration }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(hintDuration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setTotalDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * totalDuration;
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const progress = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[240px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        {isPlaying
          ? <Pause className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5 ml-0.5" />
        }
      </button>

      {/* Progress + timer */}
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform-style progress bar */}
        <div
          className="h-1.5 rounded-full cursor-pointer overflow-hidden"
          style={{ background: "rgba(255,255,255,0.2)" }}
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: "rgba(255,255,255,0.85)" }}
          />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: "0.625rem", opacity: 0.7 }}>{formatTime(currentTime)}</span>
          <span style={{ fontSize: "0.625rem", opacity: 0.7 }}>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
