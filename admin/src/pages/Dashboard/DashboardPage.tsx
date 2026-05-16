import { useState, useEffect } from 'react';
import { Card, Col, Row, Space, Statistic, Tag } from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  ReadOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statsApi } from '../../api/stats';
import { LoadingView, PageHeader } from '../../components/shared';

const STATUS_COLORS = ['#10b981', '#f59e0b', '#94a3b8'];

export function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await statsApi.getOverview();
      if (res.success) {
        setStats(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView rows={6} />;

  const topicStats = stats?.topics ?? { total: 0, published: 0, draft: 0, offline: 0 };
  const vocabStats = stats?.vocabularies ?? { total: 0, published: 0 };
  const catStats = stats?.categories ?? { total: 0, enabled: 0 };
  const byPart = topicStats.byPart || {};

  const partData = [1, 2, 3].map((p) => ({
    name: `Part ${p}`,
    数量: byPart[p] ?? 0,
  }));

  const statusData = [
    { name: '已发布', value: topicStats.published },
    { name: '草稿', value: topicStats.draft },
    { name: '已下架', value: topicStats.offline },
  ];

  return (
    <div>
      <PageHeader title="仪表盘" description="语料库总体概览" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="话题总数" value={topicStats.total} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布话题"
              value={topicStats.published}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="词汇总数" value={vocabStats.total} prefix={<ReadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布词汇"
              value={vocabStats.published}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#3a60ee' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="话题分布(按 Part)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={partData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="数量" fill="#3a60ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="话题状态分布">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card title="状态明细" size="small">
            <Space size={[8, 8]} wrap>
              <Tag color="green">已发布 {topicStats.published}</Tag>
              <Tag color="orange">草稿 {topicStats.draft}</Tag>
              <Tag>已下架 {topicStats.offline}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card title="分类" size="small">
            <Space size={[8, 8]} wrap>
              <Tag>总分类 {catStats.total}</Tag>
              <Tag color="blue">启用 {catStats.enabled}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
