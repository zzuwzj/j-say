/** 生成音频 Blob 的 Object URL */
export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/** 释放音频 Object URL */
export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/** 获取音频时长（秒） */
export function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio'));
    };
  });
}