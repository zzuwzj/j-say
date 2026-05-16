export const PART_LABELS: Record<number, string> = {
  1: 'Part 1',
  2: 'Part 2',
  3: 'Part 3',
};

export const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: 'green' },
  medium: { label: '中等', color: 'orange' },
  hard: { label: '困难', color: 'red' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'blue' },
  offline: { label: '已下架', color: 'default' },
};
