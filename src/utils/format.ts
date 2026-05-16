/** 格式化秒数为 mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** 格式化时长为人类可读 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** 格式化日期 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/** 格式化日期时间 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}