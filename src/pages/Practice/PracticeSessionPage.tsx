import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { usePracticeStore } from '@/stores/practiceStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTimer } from '@/hooks/useTimer';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { practiceRepo } from '@/db/practice-repo';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Timer } from '@/components/ui/Timer';
import { PART_LABELS } from '@/types';
import type { RecordingSegment, QuestionExample } from '@/types';

const EXAMINER_COUNT = 20;

const ACCENT_OPTIONS: { value: 'en-GB' | 'en-US' | 'en-IN' | 'en-AU'; label: string }[] = [
  { value: 'en-GB', label: '英式' },
  { value: 'en-US', label: '美式' },
  { value: 'en-AU', label: '澳式' },
  { value: 'en-IN', label: '印度' },
];

function getRandomExaminer(): string {
  const idx = Math.floor(Math.random() * EXAMINER_COUNT) + 1;
  return `/examiners/${String(idx).padStart(2, '0')}.jpg`;
}

export function PracticeSessionPage() {
  const navigate = useNavigate();
  const store = usePracticeStore();
  const { speak, accent, setAccent } = useSpeechSynthesis();
  const [showExamples, setShowExamples] = useState(false);
  const examinerImg = useMemo(() => getRandomExaminer(), []);

  const recorder = useAudioRecorder({
    onStop: (blob, duration) => {
      handleRecordingComplete(blob, duration);
    },
  });

  const recognition = useSpeechRecognition({ lang: 'en-US' });

  const timer = useTimer({
    onComplete: () => {
      if (store.phase === 'part2-preparing') {
        store.setPhase('part2-speaking');
        timer.start(120);
      } else if (store.phase === 'part2-speaking') {
        if (recorder.isRecording) recorder.stop();
        handlePartTransition();
      }
    },
    warningThreshold: 15,
  });

  const segmentBufferRef = useRef<{ blob: Blob; duration: number; transcript: string } | null>(
    null,
  );

  useEffect(() => {
    const question = getCurrentQuestion();
    if (question && store.phase !== 'idle' && store.phase !== 'completed') {
      speak(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.currentPart, store.currentQuestionIndex, store.phase, speak]);

  function handleReplay() {
    const question = getCurrentQuestion();
    if (question) {
      speak(question);
    }
  }

  useEffect(() => {
    if (store.phase === 'part2-preparing') {
      timer.start(60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  function getCurrentQuestion(): string | null {
    if (store.phase === 'idle' || store.phase === 'completed') return null;
    if (store.currentPart === 1 && store.part1Topic) {
      return store.part1Topic.topic.questions[store.currentQuestionIndex] ?? null;
    }
    if (store.currentPart === 2 && store.part2Topic) {
      if (store.phase === 'part2-preparing') {
        return `You have 1 minute to prepare. ${store.part2Topic.topic.title}`;
      }
      return store.part2Topic.topic.title;
    }
    if (store.currentPart === 3 && store.part3Topic) {
      return store.part3Topic.topic.questions[store.currentQuestionIndex] ?? null;
    }
    return null;
  }

  function getCurrentTopicTitle(): string {
    if (store.currentPart === 1 && store.part1Topic) return store.part1Topic.topic.title;
    if (store.currentPart === 2 && store.part2Topic) return store.part2Topic.topic.title;
    if (store.currentPart === 3 && store.part3Topic) return store.part3Topic.topic.title;
    return '';
  }

  function getTotalQuestions(): number {
    if (store.currentPart === 1 && store.part1Topic)
      return store.part1Topic.topic.questions.length;
    if (store.currentPart === 3 && store.part3Topic)
      return store.part3Topic.topic.questions.length;
    return 1;
  }

  function getCurrentExample(): QuestionExample | null {
    if (store.currentPart === 1 && store.part1Topic) {
      const examples = store.part1Topic.topic.examples;
      return examples?.[store.currentQuestionIndex] ?? null;
    }
    if (store.currentPart === 2 && store.part2Topic) {
      return store.part2Topic.topic.part2Example ?? null;
    }
    if (store.currentPart === 3 && store.part3Topic) {
      const examples = store.part3Topic.topic.examples;
      return examples?.[store.currentQuestionIndex] ?? null;
    }
    return null;
  }

  function handleRecordingComplete(blob: Blob, duration: number) {
    const transcript = recognition.transcript;
    segmentBufferRef.current = { blob, duration, transcript };
    recognition.resetTranscript();
  }

  async function saveCurrentSegment() {
    if (!segmentBufferRef.current || !store.recordId) return;
    const { blob, duration, transcript } = segmentBufferRef.current;
    const segId = await practiceRepo.saveSegment(
      store.recordId,
      store.currentPart,
      store.currentQuestionIndex,
      blob,
      transcript,
      duration,
    );
    const segment: RecordingSegment = {
      id: segId,
      practiceRecordId: store.recordId,
      part: store.currentPart,
      questionIndex: store.currentQuestionIndex,
      audioBlobId: 0,
      transcript,
      duration,
      createdAt: Date.now(),
    };
    store.addSegment(segment);
    segmentBufferRef.current = null;
  }

  function handleStartAnswering() {
    store.startRecording();
    recorder.start();
    recognition.resetTranscript();
    recognition.startListening();
  }

  function handleStopAnswering() {
    recorder.stop();
    recognition.stopListening();
    store.stopRecording();
  }

  function handleNext() {
    const total = getTotalQuestions();
    if (store.currentQuestionIndex < total - 1) {
      store.nextQuestion();
      setTimeout(() => handleStartAnswering(), 500);
    } else {
      handlePartTransition();
    }
  }

  async function handlePartTransition() {
    await saveCurrentSegment();
    if (store.mode === 'full') {
      if (store.currentPart === 1) {
        store.goToPart(2);
      } else if (store.currentPart === 2) {
        store.goToPart(3);
      } else {
        await handleComplete();
      }
    } else {
      await handleComplete();
    }
  }

  async function handleComplete() {
    store.completeSession();
    if (store.recordId) {
      await practiceRepo.updateScoresAndNotes(
        store.recordId,
        { fluency: 0, lexical: 0, grammar: 0, pronunciation: 0 },
        '',
      );
    }
    navigate(`/practice/review/${store.recordId}`);
  }

  function handleFinishPart2Preparation() {
    timer.reset();
    store.setPhase('part2-speaking');
    timer.start(120);
  }

  useEffect(() => {
    if (store.phase !== 'idle' && !store.recordId) {
      const topicIds: number[] = [];
      if (store.part1Topic) topicIds.push(store.part1Topic.topic.id);
      if (store.part2Topic) topicIds.push(store.part2Topic.topic.id);
      if (store.part3Topic) topicIds.push(store.part3Topic.topic.id);

      practiceRepo
        .createRecord({
          mode: store.mode,
          topicIds,
          startedAt: store.sessionStartedAt,
          completedAt: 0,
          duration: 0,
          scores: null,
          notes: '',
          createdAt: Date.now(),
        })
        .then((id) => store.setRecordId(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.phase]);

  useHotkeys(
    {
      ' ': () => {
        if (recorder.isRecording) handleStopAnswering();
        else if (store.phase !== 'idle' && store.phase !== 'completed') handleStartAnswering();
      },
      Enter: () => {
        if (!recorder.isRecording && store.phase !== 'idle') handleNext();
      },
      Escape: () => {
        if (confirm('确定要退出本次练习?')) {
          store.resetSession();
          navigate('/');
        }
      },
    },
    store.phase !== 'idle' && store.phase !== 'completed',
  );

  if (store.phase === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="text-center">
          <p className="text-fg-muted">没有正在进行的练习。</p>
          <Button className="mt-4" onClick={() => navigate('/practice/setup')}>
            设置练习
          </Button>
        </div>
      </div>
    );
  }

  const question = getCurrentQuestion();
  const example = getCurrentExample();

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <header className="bg-surface border-b border-border px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <button
          onClick={() => {
            if (confirm('退出练习?')) {
              store.resetSession();
              navigate('/');
            }
          }}
          className="text-sm text-fg-muted hover:text-fg transition-colors shrink-0"
        >
          ← 退出
        </button>
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
          <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            {PART_LABELS[store.currentPart]} / {store.mode === 'full' ? '3' : '1'}
          </span>
          <span className="text-sm text-fg-muted truncate hidden sm:inline">
            {getCurrentTopicTitle()}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={accent}
            onChange={(e) =>
              setAccent(e.target.value as 'en-GB' | 'en-US' | 'en-IN' | 'en-AU')
            }
            className="bg-surface-2 text-fg text-xs border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
          >
            {ACCENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleReplay}
            className="text-fg-muted hover:text-fg transition-colors p-1.5 rounded-md hover:bg-surface-3 cursor-pointer"
            aria-label="重放问题"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {(store.phase === 'part2-preparing' || store.phase === 'part2-speaking') && (
            <Timer
              timeLeft={timer.timeLeft}
              totalTime={timer.totalTime}
              isWarning={timer.isWarning}
              isRunning={timer.isRunning}
              label={store.phase === 'part2-preparing' ? '准备' : '作答'}
            />
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[420px] shrink-0 bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-6 relative">
          <div className="relative w-full max-w-[280px] lg:max-w-none aspect-[3/4] max-h-[40vh] lg:max-h-[70vh] rounded-2xl overflow-hidden bg-neutral-900 shadow-soft-xl">
            <img
              src={examinerImg}
              alt="IELTS 考官"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full bg-success-500 animate-pulse"
                aria-hidden="true"
              />
              <span className="text-white text-sm font-medium drop-shadow">考官</span>
            </div>
            <div className="absolute top-3 right-3 bg-danger-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
              LIVE
            </div>
          </div>
          {(store.phase === 'part1-answering' || store.phase === 'part3-answering') && (
            <div className="mt-3 text-center">
              <span className="text-xs text-neutral-400">
                问题 {store.currentQuestionIndex + 1} / {getTotalQuestions()}
              </span>
            </div>
          )}
          {store.phase === 'part2-preparing' && (
            <div className="mt-3 text-center">
              <span className="text-xs text-warning-500 font-medium">准备时间</span>
            </div>
          )}
          {store.phase === 'part2-speaking' && (
            <div className="mt-3 text-center">
              <span className="text-xs text-success-500 font-medium">作答时间</span>
            </div>
          )}
        </div>

        <div className="flex-1 bg-surface flex flex-col overflow-y-auto">
          <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 flex flex-col">
            {(store.phase === 'part1-answering' || store.phase === 'part3-answering') &&
              question && (
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <div className="bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-700/30 rounded-2xl p-6 sm:p-8 flex items-start sm:items-center gap-3">
                    <p className="text-lg sm:text-xl text-fg leading-relaxed flex-1">
                      {question}
                    </p>
                    <button
                      onClick={handleReplay}
                      className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-brand-100 hover:bg-brand-200 text-brand-700 transition-colors cursor-pointer"
                      aria-label="重放问题"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.536l4.033 3.796A.75.75 0 0010 16.25V3.75z" />
                        <path d="M14.28 5.72a.75.75 0 10-1.06 1.06 3.5 3.5 0 010 4.94.75.75 0 101.06 1.06 5 5 0 000-7.06z" />
                        <path d="M16.364 3.636a.75.75 0 10-1.06 1.06 7 7 0 010 9.9.75.75 0 001.06 1.06 8.5 8.5 0 000-12.02z" />
                      </svg>
                    </button>
                  </div>

                  <RecorderPanel
                    isRecording={recorder.isRecording}
                    duration={recorder.duration}
                    audioLevel={recorder.audioLevel}
                    transcript={recognition.transcript}
                    interim={recognition.interimTranscript}
                    onToggle={() =>
                      recorder.isRecording ? handleStopAnswering() : handleStartAnswering()
                    }
                    idleHint="点击开始录音"
                  />

                  <div className="flex justify-center gap-4">
                    {!recorder.isRecording && segmentBufferRef.current && (
                      <Button size="lg" variant="secondary" onClick={handleNext}>
                        {store.currentQuestionIndex < getTotalQuestions() - 1
                          ? '下一题'
                          : '下一 Part'}
                      </Button>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Switch checked={showExamples} onChange={setShowExamples} label="显示示例答案" />
                  </div>

                  {showExamples && example && <ExampleBlock example={example} />}
                </div>
              )}

            {store.currentPart === 2 && store.part2Topic && (
              <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="bg-warning-50 dark:bg-warning-700/20 border border-warning-500/30 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-start gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-fg flex-1">
                      {store.part2Topic.topic.title}
                    </h2>
                    <button
                      onClick={handleReplay}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-warning-500/20 hover:bg-warning-500/30 text-warning-700 transition-colors cursor-pointer"
                      aria-label="重放"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h1.536l4.033 3.796A.75.75 0 0010 16.25V3.75z" />
                        <path d="M14.28 5.72a.75.75 0 10-1.06 1.06 3.5 3.5 0 010 4.94.75.75 0 101.06 1.06 5 5 0 000-7.06z" />
                        <path d="M16.364 3.636a.75.75 0 10-1.06 1.06 7 7 0 010 9.9.75.75 0 001.06 1.06 8.5 8.5 0 000-12.02z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-fg-muted mb-4">{store.part2Topic.topic.content}</p>
                  {store.part2Topic.topic.prompts.length > 0 && (
                    <ul className="space-y-2">
                      {store.part2Topic.topic.prompts.map((prompt, i) => (
                        <li key={i} className="flex items-start gap-2 text-fg">
                          <span className="text-warning-600 mt-0.5">•</span>
                          <span>{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm text-fg-subtle mt-4">建议作答 1–2 分钟。</p>
                </div>

                {store.phase === 'part2-preparing' && (
                  <div className="text-center space-y-4">
                    <p className="text-fg-muted">花点时间准备答案。</p>
                    <Button size="lg" onClick={handleFinishPart2Preparation}>
                      我准备好了，开始作答
                    </Button>
                  </div>
                )}

                {store.phase === 'part2-speaking' && (
                  <div className="space-y-6">
                    <RecorderPanel
                      isRecording={recorder.isRecording}
                      duration={recorder.duration}
                      audioLevel={recorder.audioLevel}
                      transcript={recognition.transcript}
                      interim={recognition.interimTranscript}
                      onToggle={() =>
                        recorder.isRecording ? handleStopAnswering() : handleStartAnswering()
                      }
                      idleHint="点击开始作答"
                    />
                    <div className="flex justify-center gap-4">
                      {!recorder.isRecording && segmentBufferRef.current && (
                        <Button size="lg" variant="secondary" onClick={handlePartTransition}>
                          结束 Part 2
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <Switch checked={showExamples} onChange={setShowExamples} label="显示示例答案" />
                    </div>
                    {showExamples && example && <ExampleBlock example={example} />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-surface border-t border-border px-4 sm:px-6 py-2 text-center shrink-0 hidden sm:block">
        <p className="text-xs text-fg-subtle">
          按{' '}
          <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-fg-muted text-[10px] border border-border">
            空格
          </kbd>{' '}
          录音 ·{' '}
          <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-fg-muted text-[10px] border border-border">
            Enter
          </kbd>{' '}
          下一题 ·{' '}
          <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-fg-muted text-[10px] border border-border">
            Esc
          </kbd>{' '}
          退出
        </p>
      </footer>
    </div>
  );
}

function RecorderPanel({
  isRecording,
  duration,
  audioLevel,
  transcript,
  interim,
  onToggle,
  idleHint,
}: {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  transcript: string;
  interim: string;
  onToggle: () => void;
  idleHint: string;
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            aria-label={isRecording ? '停止录音' : '开始录音'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${
                isRecording
                  ? 'bg-danger-500 hover:bg-danger-600 shadow-soft-md ring-4 ring-danger-500/20'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-soft-md ring-4 ring-brand-500/15'
              }`}
          >
            {isRecording ? (
              <div className="w-5 h-5 bg-white rounded-sm" />
            ) : (
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            {isRecording ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-500/75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-danger-500" />
                </span>
                <span className="text-sm text-danger-600 font-medium">正在录音</span>
                <span className="text-sm text-fg-muted font-mono tabular-nums">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ) : (
              <span className="text-sm text-fg-muted">{idleHint}</span>
            )}
            {isRecording && (
              <div className="mt-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-success-500 rounded-full transition-all duration-75"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
        {(transcript || interim) && (
          <div className="bg-surface-2 border border-border rounded-lg p-3 text-sm">
            <p className="text-fg">{transcript}</p>
            {interim && <p className="text-fg-subtle italic">{interim}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ExampleBlock({ example }: { example: QuestionExample }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-3 shadow-soft-sm">
      <div>
        <span className="text-xs font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
          简单版
        </span>
        <p className="mt-1.5 text-sm text-fg">{example.simple}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
          Band 7
        </span>
        <p className="mt-1.5 text-sm text-fg">{example.band7}</p>
      </div>
    </div>
  );
}
