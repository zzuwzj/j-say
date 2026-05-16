import { Empty, Result, Skeleton, Spin } from 'antd';
import type { ReactNode } from 'react';

export function LoadingView({
  rows = 4,
  height,
  variant = 'skeleton',
}: {
  rows?: number;
  height?: number | string;
  variant?: 'skeleton' | 'spin';
}) {
  if (variant === 'spin') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          minHeight: height,
        }}
      >
        <Spin />
      </div>
    );
  }
  return (
    <div style={{ padding: 16 }}>
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}

export function ErrorView({
  title = '加载失败',
  subTitle = '请稍后重试，或检查网络连接。',
  onRetry,
}: {
  title?: string;
  subTitle?: string;
  onRetry?: () => void;
}) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={subTitle}
      extra={
        onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              border: '1px solid var(--ant-color-border)',
              borderRadius: 8,
              padding: '4px 16px',
              cursor: 'pointer',
              background: 'transparent',
            }}
          >
            重试
          </button>
        )
      }
    />
  );
}

export function EmptyView({
  description = '暂无数据',
  action,
}: {
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div style={{ padding: '48px 16px' }}>
      <Empty description={description}>{action}</Empty>
    </div>
  );
}
