import { create } from 'zustand';
import type {
  PracticeMode, PartNumber, SessionPhase, RecordingSegment,
  Part1TopicGroup, Part2CueCard, Part3Discussion,
} from '@/types';

interface PracticeState {
  mode: PracticeMode;
  phase: SessionPhase;
  currentPart: PartNumber;
  currentQuestionIndex: number;
  part1Topic: Part1TopicGroup | null;
  part2Topic: Part2CueCard | null;
  part3Topic: Part3Discussion | null;
  isRecording: boolean;
  segments: RecordingSegment[];
  currentTranscript: string;
  timeRemaining: number;
  isTimerRunning: boolean;
  sessionStartedAt: number;
  recordId: number | null;

  startSession: (mode: PracticeMode, topics: {
    part1?: Part1TopicGroup;
    part2?: Part2CueCard;
    part3?: Part3Discussion;
  }) => void;
  setPhase: (phase: SessionPhase) => void;
  nextQuestion: () => void;
  goToPart: (part: PartNumber) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addSegment: (segment: RecordingSegment) => void;
  setCurrentTranscript: (text: string) => void;
  setTimeRemaining: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  setRecordId: (id: number) => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeState>((set) => ({
  mode: 'full',
  phase: 'idle',
  currentPart: 1,
  currentQuestionIndex: 0,
  part1Topic: null,
  part2Topic: null,
  part3Topic: null,
  isRecording: false,
  segments: [],
  currentTranscript: '',
  timeRemaining: 0,
  isTimerRunning: false,
  sessionStartedAt: 0,
  recordId: null,

  startSession: (mode, topics) => {
    const initialPart: PartNumber = mode === 'part2' ? 2 : mode === 'part3' ? 3 : 1;
    const initialPhase: SessionPhase = mode === 'part2' ? 'part2-preparing'
      : mode === 'part3' ? 'part3-answering'
      : 'part1-answering';
    set({
      mode,
      phase: initialPhase,
      currentPart: initialPart,
      currentQuestionIndex: 0,
      part1Topic: topics.part1 ?? null,
      part2Topic: topics.part2 ?? null,
      part3Topic: topics.part3 ?? null,
      segments: [],
      currentTranscript: '',
      sessionStartedAt: Date.now(),
      isRecording: false,
      timeRemaining: 0,
      isTimerRunning: false,
      recordId: null,
    });
  },

  setPhase: (phase) => set({ phase }),

  nextQuestion: () => set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),

  goToPart: (part) => set({
    currentPart: part,
    currentQuestionIndex: 0,
    phase: part === 2 ? 'part2-preparing' : `part${part}-answering` as SessionPhase,
  }),

  startRecording: () => set({ isRecording: true, currentTranscript: '' }),
  stopRecording: () => set({ isRecording: false }),

  addSegment: (segment) => set((s) => ({ segments: [...s.segments, segment] })),
  setCurrentTranscript: (text) => set({ currentTranscript: text }),
  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  setTimerRunning: (running) => set({ isTimerRunning: running }),
  setRecordId: (id) => set({ recordId: id }),

  completeSession: () => set({ phase: 'completed', isRecording: false, isTimerRunning: false }),

  resetSession: () => set({
    phase: 'idle',
    currentPart: 1,
    currentQuestionIndex: 0,
    part1Topic: null,
    part2Topic: null,
    part3Topic: null,
    isRecording: false,
    segments: [],
    currentTranscript: '',
    timeRemaining: 0,
    isTimerRunning: false,
    sessionStartedAt: 0,
    recordId: null,
  }),
}));