import { useState, useEffect } from 'react';
import { Card, Col, Row, Space, Statistic, Table, Tag } from 'antd';
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statsApi } from '../../api/stats';
import {
  ErrorView,
  LoadingView,
  PageHeader,
  STATUS_LABELS,
  DIFFICULTY_LABELS,
} from '../../components/shared';

export function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await statsApi.getOverview();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView rows={6} />;
  if (error || !stats) return <ErrorView onRetry={loadStats} />;

  const categoryColumns = [
    { title: '分类', dataIndex: 'name', key: 'name' },
    {
      title: '话题数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
  ];

  const vocabCategoryColumns = [
    { title: '分类', dataIndex: 'name', key: 'name' },
    {
      title: '词汇数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
  ];

  const partData = Object.entries(stats.topics.byPart || {}).map(([part, count]) => ({
    name: `Part ${part}`,
    数量: count as number,
  }));

  return (
    <div>
      <PageHeader title="数据统计" description="语料库内容总体分布" />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="话题总数" value={stats.topics.total} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.topics.published}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="词汇总数" value={stats.vocabularies.total} prefix={<ReadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布词汇"
              value={stats.vocabularies.published}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#3a60ee' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="话题分布(按 Part)">
            {partData.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>暂无数据</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={partData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="数量" fill="#3a60ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="状态与难度">
            <p style={{ marginBottom: 8, color: '#64748b', fontSize: 13 }}>状态分布</p>
            <Space size={[8, 8]} wrap style={{ marginBottom: 16 }}>
              <Tag color={STATUS_LABELS.published.color}>
                {STATUS_LABELS.published.label}: {stats.topics.published}
              </Tag>
              <Tag color={STATUS_LABELS.draft.color}>
                {STATUS_LABELS.draft.label}: {stats.topics.draft}
              </Tag>
              <Tag color={STATUS_LABELS.offline.color}>
                {STATUS_LABELS.offline.label}: {stats.topics.offline}
              </Tag>
            </Space>
            <p style={{ marginBottom: 8, color: '#64748b', fontSize: 13 }}>难度分布</p>
            <Space size={[8, 8]} wrap>
              {Object.entries(stats.topics.byDifficulty || {}).map(([diff, count]) => {
                const meta = DIFFICULTY_LABELS[diff];
                return (
                  <Tag key={diff} color={meta?.color}>
                    {meta?.label || diff}: {count as number}
                  </Tag>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="话题分类分布">
            <Table
              columns={categoryColumns}
              dataSource={stats.topics.byCategory || []}
              rowKey="categoryId"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="词汇分类分布">
            <Table
              columns={vocabCategoryColumns}
              dataSource={stats.vocabularies.byCategory || []}
              rowKey="categoryId"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
