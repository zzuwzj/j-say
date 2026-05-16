import { useState, useEffect, useCallback } from 'react';
import { practiceRepo } from '@/db/practice-repo';

interface UseStatsReturn {
  dailyActivity: Array<{ date: string; count: number; totalDuration: number }>;
  scoreTrend: Array<{ date: string; avgScore: number }>;
  topicCoverage: Array<{ category: string; count: number }>;
  totalPractices: number;
  totalDuration: number;
  loading: boolean;
  refresh: () => void;
}

export function useStats(days = 30): UseStatsReturn {
  const [dailyActivity, setDailyActivity] = useState<UseStatsReturn['dailyActivity']>([]);
  const [scoreTrend, setScoreTrend] = useState<UseStatsReturn['scoreTrend']>([]);
  const [topicCoverage, setTopicCoverage] = useState<UseStatsReturn['topicCoverage']>([]);
  const [totalPractices, setTotalPractices] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const [activity, trend, coverage, count, duration] = await Promise.all([
        practiceRepo.statsByDate(days),
        practiceRepo.avgScoreTrend(days),
        practiceRepo.topicCoverage(),
        practiceRepo.countRecords(),
        practiceRepo.totalDuration(),
      ]);
      setDailyActivity(activity);
      setScoreTrend(trend);
      setTopicCoverage(coverage);
      setTotalPractices(count);
      setTotalDuration(duration);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetch(); }, [fetch]);

  return { dailyActivity, scoreTrend, topicCoverage, totalPractices, totalDuration, loading, refresh: fetch };
}