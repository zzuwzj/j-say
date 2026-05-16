import { useState, useEffect, useCallback } from 'react';
import { topicRepo } from '@/db/topic-repo';
import type { Topic, TopicCategory, PartNumber } from '@/types';

interface UseTopicsReturn {
  topics: Topic[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useTopics(filters?: {
  part?: PartNumber;
  category?: TopicCategory;
  favoritesOnly?: boolean;
}): UseTopicsReturn {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      let result: Topic[];
      if (filters?.favoritesOnly) {
        result = await topicRepo.favorites();
        if (filters.part) {
          result = result.filter((t) => t.part === filters.part);
        }
      } else {
        result = await topicRepo.list(filters?.part, filters?.category);
      }
      setTopics(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch topics'));
    } finally {
      setLoading(false);
    }
  }, [filters?.part, filters?.category, filters?.favoritesOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  return { topics, loading, error, refresh: fetch };
}