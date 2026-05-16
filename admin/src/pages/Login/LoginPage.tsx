import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Input, Button, message, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!password) {
      message.warning('请输入密码');
      return;
    }
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      message.error('密码错误');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eef4ff 0%, #f8fafc 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400, boxShadow: '0 12px 24px -8px rgb(15 23 42 / 0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, lineHeight: 1 }} aria-hidden>
            🗣️
          </div>
          <Typography.Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>
            J-Say 管理后台
          </Typography.Title>
          <Typography.Text type="secondary">登录以管理语料库内容</Typography.Text>
        </div>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入管理密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleSubmit}
          size="large"
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" block size="large" loading={loading} onClick={handleSubmit}>
          登录
        </Button>
      </Card>
    </div>
  );
}