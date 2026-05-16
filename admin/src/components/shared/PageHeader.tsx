import { Button, Space, theme, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  onBack?: boolean | (() => void);
  extra?: ReactNode;
}

export function PageHeader({ title, description, onBack, extra }: PageHeaderProps) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else navigate(-1);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: token.marginLG,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
        {onBack && (
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginTop: 2 }}>
            返回
          </Button>
        )}
        <div style={{ minWidth: 0 }}>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {description && (
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {description}
            </Text>
          )}
        </div>
      </div>
      {extra && <Space wrap>{extra}</Space>}
    </div>
  );
}
