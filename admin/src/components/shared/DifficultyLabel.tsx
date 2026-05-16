import { Tag } from 'antd';
import { DIFFICULTY_LABELS } from './labels';

interface DifficultyLabelProps {
  difficulty: string;
}

export function DifficultyLabel({ difficulty }: DifficultyLabelProps) {
  const meta = DIFFICULTY_LABELS[difficulty];
  if (!meta) return <Tag>{difficulty}</Tag>;
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
