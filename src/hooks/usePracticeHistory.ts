import { useState, useEffect, useCallback } from 'react';
import { practiceRepo } from '@/db/practice-repo';
import type { PracticeRecord } from '@/types';

interface UsePracticeHistoryReturn {
  records: PracticeRecord[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  loadMore: () => void;
  refresh: () => void;
}

export function usePracticeHistory(pageSize = 20): UsePracticeHistoryReturn {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        practiceRepo.listRecords(p, pageSize),
        practiceRepo.countRecords(),
      ]);
      if (p === 1) {
        setRecords(list);
      } else {
        setRecords((prev) => [...prev, ...list]);
      }
      setTotal(count);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => { fetch(1); }, [fetch]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetch(nextPage);
  }, [page, fetch]);

  const refresh = useCallback(() => {
    setPage(1);
    fetch(1);
  }, [fetch]);

  return { records, total, loading, page, pageSize, loadMore, refresh };
}