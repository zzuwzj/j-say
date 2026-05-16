import { useState, useEffect } from 'react';
import type { RecordingSegment } from '@/types';
import { practiceRepo } from '@/db/practice-repo';
import { PART_LABELS } from '@/types';

interface SegmentPlayerProps {
  segment: RecordingSegment;
}

export function SegmentPlayer({ segment }: SegmentPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = '';
    practiceRepo.getAudioBlob(segment.audioBlobId).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
      setLoading(false);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [segment.audioBlobId]);

  function togglePlay() {
    const audio = document.getElementById(`audio-${segment.id}`) as HTMLAudioElement | null;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(Math.floor(s) % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return <div className="animate-pulse h-12 bg-surface-3 rounded-md" />;
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-surface-2 border border-border rounded-lg">
      <div className="shrink-0 mt-0.5">
        <span className="text-xs font-medium text-fg-muted bg-surface-3 px-2 py-0.5 rounded-full">
          {PART_LABELS[segment.part]} Q{segment.questionIndex + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {audioUrl ? (
          <div>
            <audio
              id={`audio-${segment.id}`}
              src={audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? '暂停' : '播放'}
                className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 shrink-0 transition-colors"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1">
                <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{
                      width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-fg-subtle mt-0.5 tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-subtle">音频不可用</p>
        )}
        {segment.transcript && (
          <p className="mt-2 text-sm text-fg leading-relaxed">{segment.transcript}</p>
        )}
      </div>
    </div>
  );
}
