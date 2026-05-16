import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, Descriptions, Divider, Space, Typography, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { topicApi } from '../../api/topics';
import { categoryApi } from '../../api/categories';
import {
  DifficultyLabel,
  LoadingView,
  PageHeader,
  PART_LABELS,
  StatusTag,
} from '../../components/shared';

export function TopicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      topicApi.getById(Number(id)).then((res) => {
        if (res.success) setTopic(res.data);
      });
    }
    categoryApi.list(false).then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, [id]);

  const handleStatusChange = async (status: 'published' | 'offline') => {
    if (!id) return;
    await topicApi.updateStatus(Number(id), status);
    message.success(status === 'published' ? '已发布' : '已下架');
    topicApi.getById(Number(id)).then((res) => {
      if (res.success) setTopic(res.data);
    });
  };

  if (!topic) return <LoadingView rows={5} />;

  const categoryName =
    categories.find((c: any) => c.id === topic.categoryId)?.nameZh || topic.categoryId;

  const actions: React.ReactNode[] = [];
  if (topic.status === 'draft') {
    actions.push(
      <Button key="pub" type="primary" onClick={() => handleStatusChange('published')}>
        发布
      </Button>,
    );
  }
  if (topic.status === 'published') {
    actions.push(
      <Button key="off" onClick={() => handleStatusChange('offline')}>
        下架
      </Button>,
    );
  }
  if (topic.status === 'offline') {
    actions.push(
      <Button key="repub" type="primary" onClick={() => handleStatusChange('published')}>
        重新发布
      </Button>,
    );
  }
  actions.push(
    <Button key="edit" icon={<EditOutlined />} onClick={() => navigate(`/topics/${id}/edit`)}>
      编辑
    </Button>,
  );

  return (
    <div>
      <PageHeader title={`话题详情 #${topic.id}`} onBack extra={<Space>{actions}</Space>} />

      <Card>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Part">
            {PART_LABELS[topic.part] ?? `Part ${topic.part}`}
          </Descriptions.Item>
          <Descriptions.Item label="分类">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="难度">
            <DifficultyLabel difficulty={topic.difficulty} />
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag status={topic.status} />
          </Descriptions.Item>
          <Descriptions.Item label="版本">v{topic.version}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(topic.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Typography.Title level={4}>{topic.title}</Typography.Title>
        <Typography.Paragraph>{topic.content}</Typography.Paragraph>

        {topic.prompts?.length > 0 && (
          <>
            <Divider orientation="left">提示点</Divider>
            <ul>{topic.prompts.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
          </>
        )}

        <Divider orientation="left">问题列表</Divider>
        {topic.questions?.map((q: string, i: number) => (
          <Card key={i} size="small" style={{ marginBottom: 8 }}>
            <Typography.Text strong>Q{i + 1}: {q}</Typography.Text>
            {topic.examples?.[i] && (
              <div style={{ marginTop: 8, paddingLeft: 16 }}>
                <Typography.Text type="secondary">简单: {topic.examples[i].simple}</Typography.Text><br />
                <Typography.Text type="secondary">Band 7: {topic.examples[i].band7}</Typography.Text>
              </div>
            )}
          </Card>
        ))}

        {topic.part2Example && (
          <>
            <Divider orientation="left">独白示例</Divider>
            <Card size="small">
              <Typography.Text type="secondary">简单: {topic.part2Example.simple}</Typography.Text><br />
              <Typography.Text type="secondary">Band 7: {topic.part2Example.band7}</Typography.Text>
            </Card>
          </>
        )}

        {topic.relatedPart2Id && (
          <Descriptions style={{ marginTop: 16 }}>
            <Descriptions.Item label="关联 Part 2 话题 ID">{topic.relatedPart2Id}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}