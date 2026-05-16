import { Tag } from 'antd';
import { PART_LABELS } from './labels';

interface PartLabelProps {
  part: number;
  asTag?: boolean;
}

export function PartLabel({ part, asTag = false }: PartLabelProps) {
  const label = PART_LABELS[part] ?? `Part ${part}`;
  if (asTag) return <Tag color="blue">{label}</Tag>;
  return <span>{label}</span>;
}
