import { Tag } from 'antd';
import { STATUS_LABELS } from './labels';

interface StatusTagProps {
  status: string;
}

export function StatusTag({ status }: StatusTagProps) {
  const meta = STATUS_LABELS[status];
  if (!meta) return <Tag>{status}</Tag>;
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
