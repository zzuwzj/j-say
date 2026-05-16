import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { practiceRepo } from '@/db/practice-repo';
import type { PracticeRecord } from '@/types';
import { PRACTICE_MODE_LABELS } from '@/types';

export function HomePage() {
  const navigate = useNavigate();
  const [recentRecords, setRecentRecords] = useState<PracticeRecord[]>([]);
  const [totalPractices, setTotalPractices] = useState(0);
  const [weekDuration, setWeekDuration] = useState(0);

  useEffect(() => {
    practiceRepo.listRecords(1, 5).then(setRecentRecords);
    practiceRepo.countRecords().then(setTotalPractices);
    practiceRepo.statsByDate(7).then((stats) => {
      setWeekDuration(stats.reduce((sum, s) => sum + s.totalDuration, 0));
    });
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const avgScore = (r: PracticeRecord) => {
    if (!r.scores) return '--';
    return (
      (r.scores.fluency + r.scores.lexical + r.scores.grammar + r.scores.pronunciation) /
      4
    ).toFixed(1);
  };

  const quickStarts = [
    {
      mode: 'full',
      icon: '🎯',
      title: '完整模考',
      desc: 'Part 1 → 2 → 3 全流程',
    },
    {
      mode: 'part',
      icon: '📝',
      title: '分项练习',
      desc: '针对某个 Part 聚焦训练',
    },
    {
      mode: 'random',
      icon: '🎲',
      title: '随机抽题',
      desc: '随机话题，立即开练',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-surface border border-brand-100 px-6 py-7 sm:px-8 sm:py-9 dark:from-brand-900/40 dark:border-brand-700/30">
        <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
          欢迎来到 J-Say
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-fg-muted">
          随时随地练习雅思口语，跟踪你的成长。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickStarts.map((q) => (
          <Card
            key={q.mode}
            variant="default"
            onClick={() =>
              navigate(`/practice/setup${q.mode === 'full' ? '?mode=full' : `?mode=${q.mode}`}`)
            }
          >
            <div className="text-center py-3">
              <div className="text-3xl mb-2" aria-hidden="true">
                {q.icon}
              </div>
              <h3 className="font-semibold text-fg">{q.title}</h3>
              <p className="text-sm text-fg-muted mt-1">{q.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="最近练习">
          {recentRecords.length === 0 ? (
            <EmptyState
              icon="🎙️"
              title="还没有练习记录"
              description="完成第一次练习后，最近记录会出现在这里。"
            />
          ) : (
            <ul className="space-y-1">
              {recentRecords.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/history/${r.id}`)}
                    className="w-full flex items-center justify-between gap-4 py-2.5 px-2 -mx-2 rounded-md text-left hover:bg-surface-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg truncate">
                        {PRACTICE_MODE_LABELS[r.mode]}
                      </p>
                      <p className="text-xs text-fg-subtle mt-0.5">
                        {new Date(r.startedAt).toLocaleDateString()} · {formatDuration(r.duration)}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        r.scores ? 'text-brand-600' : 'text-fg-subtle'
                      }`}
                    >
                      {avgScore(r)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="本周概览">
          <div className="grid grid-cols-2 gap-4 py-1">
            <div className="text-center">
              <p className="text-3xl font-bold text-brand-600 tabular-nums">{totalPractices}</p>
              <p className="text-sm text-fg-muted mt-0.5">总练习次数</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success-600 tabular-nums">
                {formatDuration(weekDuration)}
              </p>
              <p className="text-sm text-fg-muted mt-0.5">本周时长</p>
            </div>
          </div>
          {totalPractices === 0 && (
            <p className="text-sm text-fg-subtle text-center mt-4">
              开始练习后，统计就会显示在这里。
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
