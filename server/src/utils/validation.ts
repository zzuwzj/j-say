interface TopicCreateRequest {
  part: 1|2|3; categoryId: number; title: string; content: string;
  prompts?: string[]; questions: string[]; examples: Array<{simple:string;band7:string}>;
  part2Example?: {simple:string;band7:string}; relatedPart2Id?: number;
  difficulty: 'easy'|'medium'|'hard'; status?: 'draft'|'published';
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTopicCreate(data: TopicCreateRequest): ValidationResult {
  const errors: string[] = [];

  if (!data.part || ![1, 2, 3].includes(data.part)) {
    errors.push('Part 必须为 1、2 或 3');
  }
  if (!data.categoryId) {
    errors.push('分类不能为空');
  }
  if (!data.title?.trim()) {
    errors.push('标题不能为空');
  }
  if (!data.content?.trim()) {
    errors.push('内容不能为空');
  }
  if (!data.questions?.length) {
    errors.push('至少需要一个问题');
  }
  if (!data.difficulty || !['easy', 'medium', 'hard'].includes(data.difficulty)) {
    errors.push('难度必须为 easy、medium 或 hard');
  }
  if (data.part === 2) {
    if (!data.prompts?.length) {
      errors.push('Part 2 话题至少需要一个提示点');
    }
  }
  if (data.examples?.length) {
    for (let i = 0; i < data.examples.length; i++) {
      const ex = data.examples[i];
      if (!ex.simple?.trim() || !ex.band7?.trim()) {
        errors.push(`示例 ${i + 1} 的 simple 和 band7 字段不能为空`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateVocabCreate(data: { word: string; definition: string; categoryId: number }): ValidationResult {
  const errors: string[] = [];

  if (!data.word?.trim()) {
    errors.push('单词不能为空');
  }
  if (!data.definition?.trim()) {
    errors.push('释义不能为空');
  }
  if (!data.categoryId) {
    errors.push('分类不能为空');
  }

  return { valid: errors.length === 0, errors };
}