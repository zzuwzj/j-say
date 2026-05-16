import { useState, useRef, useCallback, useEffect } from 'react';

export type SpeechRecognitionError =
  | { type: 'not_supported' }
  | { type: 'no_speech' }
  | { type: 'audio_capture' }
  | { type: 'not_allowed' }
  | { type: 'network' }
  | { type: 'aborted' };

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: SpeechRecognitionError | null;
}

const SpeechRecognition = (window as any).SpeechRecognition
  || (window as any).webkitSpeechRecognition;

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechRecognitionError | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const isStoppingRef = useRef(false);

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    isStoppingRef.current = false;
    const recognition = new SpeechRecognition();
    recognition.lang = options?.lang ?? 'en-US';
    recognition.continuous = options?.continuous ?? true;
    recognition.interimResults = options?.interimResults ?? true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      const errorMap: Record<string, SpeechRecognitionError['type']> = {
        'no-speech': 'no_speech',
        'audio-capture': 'audio_capture',
        'not-allowed': 'not_allowed',
        'network': 'network',
        'aborted': 'aborted',
      };
      const errType = errorMap[event.error] ?? 'aborted';
      setError({ type: errType });

      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        shouldRestartRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening and not manually stopping
      if (shouldRestartRef.current && !isStoppingRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          shouldRestartRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch {
      setError({ type: 'aborted' });
    }
  }, [isSupported, isListening, options]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      isStoppingRef.current = true;
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}