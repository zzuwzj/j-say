import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

export function SettingsPage() {
  const { ttsAccent, ttsEnabled, timerSoundEnabled, theme, updateSettings } = useSettingsStore();
  const { speak, isSpeaking } = useSpeechSynthesis();

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      note: 'Audio recordings are not included in export. Only metadata is exported.',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jsay-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearData() {
    if (!confirm('确定要删除所有练习数据吗?该操作不可撤销。')) return;
    if (!confirm('这将永久删除所有练习记录、录音和自定义话题。是否继续?')) return;
    indexedDB.deleteDatabase('JSayDB');
    localStorage.removeItem('jsay-settings');
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="设置" description="个性化练习体验，管理你的本地数据。" />

      <Card title="语音设置">
        <div className="space-y-5">
          <Row title="考官朗读" desc="使用 TTS 朗读问题">
            <Switch
              checked={ttsEnabled}
              onChange={(v) => updateSettings({ ttsEnabled: v })}
            />
          </Row>

          {ttsEnabled && (
            <Row title="口音" desc="选择考官口音">
              <Select
                value={ttsAccent}
                onChange={(e) =>
                  updateSettings({
                    ttsAccent: e.target.value as 'en-GB' | 'en-US' | 'en-IN' | 'en-AU',
                  })
                }
                size="sm"
                className="w-44"
              >
                <option value="en-GB">英式英语</option>
                <option value="en-US">美式英语</option>
                <option value="en-IN">印度英语</option>
                <option value="en-AU">澳洲英语</option>
              </Select>
            </Row>
          )}

          {ttsEnabled && (
            <Row title="试听语音" desc="播放一段示例">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  speak('Hello! Can you tell me a little bit about your hometown?')
                }
                disabled={isSpeaking}
              >
                {isSpeaking ? '播放中...' : '▶ 试听'}
              </Button>
            </Row>
          )}
        </div>
      </Card>

      <Card title="计时器">
        <Row title="提示音" desc="时间快结束时播放提示音">
          <Switch
            checked={timerSoundEnabled}
            onChange={(v) => updateSettings({ timerSoundEnabled: v })}
          />
        </Row>
      </Card>

      <Card title="外观">
        <Row title="主题" desc="选择浅色或深色">
          <Select
            value={theme}
            onChange={(e) =>
              updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })
            }
            size="sm"
            className="w-32"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </Select>
        </Row>
      </Card>

      <Card title="数据管理">
        <div className="space-y-4 divide-y divide-border">
          <Row title="导出数据" desc="导出练习记录(不含录音)">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              导出 JSON
            </Button>
          </Row>
          <div className="pt-4">
            <Row
              title={<span className="text-danger-600">清空所有数据</span>}
              desc="删除所有练习记录与录音"
            >
              <Button variant="danger" size="sm" onClick={handleClearData}>
                清空数据
              </Button>
            </Row>
          </div>
        </div>
      </Card>

      <Card title="关于">
        <div className="text-sm text-fg-muted space-y-1">
          <p>
            <strong className="text-fg">J-Say</strong> — 雅思口语练习
          </p>
          <p>版本 1.0.0</p>
          <p className="text-xs text-fg-subtle mt-2">
            所有数据都保存在你的浏览器本地，无需服务器。
          </p>
        </div>
      </Card>
    </div>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: React.ReactNode;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{title}</p>
        {desc && <p className="text-xs text-fg-muted mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
