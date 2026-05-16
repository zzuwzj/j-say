import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useEffect } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onTranscriptUpdate?: (text: string) => void;
  autoStart?: boolean;
  maxDuration?: number;
}

export function AudioRecorder({ onRecordingComplete, onTranscriptUpdate, autoStart, maxDuration }: AudioRecorderProps) {
  const recorder = useAudioRecorder({
    onStop: (blob, duration) => {
      onRecordingComplete(blob, duration);
    },
  });

  const recognition = useSpeechRecognition({ lang: 'en-US' });

  // Auto-start recording when component mounts
  useEffect(() => {
    if (autoStart) {
      handleStart();
    }
  }, [autoStart]);

  // Sync transcript to parent
  useEffect(() => {
    const text = recognition.transcript + recognition.interimTranscript;
    if (text) onTranscriptUpdate?.(text);
  }, [recognition.transcript, recognition.interimTranscript]);

  // Auto-stop at max duration
  useEffect(() => {
    if (maxDuration && recorder.duration >= maxDuration && recorder.isRecording) {
      handleStop();
    }
  }, [recorder.duration, maxDuration, recorder.isRecording]);

  function handleStart() {
    recorder.start();
    recognition.resetTranscript();
    recognition.startListening();
  }

  function handleStop() {
    recorder.stop();
    recognition.stopListening();
  }

  function handleToggle() {
    if (recorder.isRecording) {
      handleStop();
    } else {
      handleStart();
    }
  }

  return (
    <div className="space-y-4">
      {/* Recording indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
            ${recorder.isRecording
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
        >
          {recorder.isRecording ? (
            <div className="w-5 h-5 bg-white rounded-sm" />
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          {recorder.isRecording ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-sm text-red-600 font-medium">Recording</span>
              <span className="text-sm text-gray-500 font-mono">
                {Math.floor(recorder.duration / 60)}:{(recorder.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Click to start recording</span>
          )}

          {/* Audio level bar */}
          {recorder.isRecording && (
            <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-75"
                style={{ width: `${recorder.audioLevel * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {(recognition.transcript || recognition.interimTranscript) && (
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="text-gray-800">{recognition.transcript}</p>
          {recognition.interimTranscript && (
            <p className="text-gray-400 italic">{recognition.interimTranscript}</p>
          )}
        </div>
      )}

      {/* Error */}
      {recorder.error && (
        <p className="text-sm text-red-600">
          {recorder.error.type === 'permission_denied' && 'Microphone permission denied. Please allow access in your browser settings.'}
          {recorder.error.type === 'not_supported' && 'Audio recording is not supported in this browser.'}
          {recorder.error.type === 'device_not_found' && 'No microphone found. Please connect a microphone.'}
        </p>
      )}
      {!recognition.isSupported && recorder.isRecording && (
        <p className="text-xs text-amber-600">
          Speech recognition is not available in this browser. Recording only.
        </p>
      )}
    </div>
  );
}