import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, Descriptions, Space, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { vocabApi } from '../../api/vocabularies';
import { categoryApi } from '../../api/categories';
import { LoadingView, PageHeader, StatusTag } from '../../components/shared';

export function VocabDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vocab, setVocab] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (id)
      vocabApi.getById(Number(id)).then((res) => {
        if (res.success) setVocab(res.data);
      });
    categoryApi.list(false).then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, [id]);

  const handleStatusChange = async (status: 'published' | 'offline') => {
    if (!id) return;
    await vocabApi.updateStatus(Number(id), status);
    message.success(status === 'published' ? '已发布' : '已下架');
    vocabApi.getById(Number(id)).then((res) => {
      if (res.success) setVocab(res.data);
    });
  };

  if (!vocab) return <LoadingView rows={4} />;

  const categoryName =
    categories.find((c: any) => c.id === vocab.categoryId)?.nameZh || vocab.categoryId;

  const actions: React.ReactNode[] = [];
  if (vocab.status === 'draft') {
    actions.push(
      <Button key="pub" type="primary" onClick={() => handleStatusChange('published')}>
        发布
      </Button>,
    );
  }
  if (vocab.status === 'published') {
    actions.push(
      <Button key="off" onClick={() => handleStatusChange('offline')}>
        下架
      </Button>,
    );
  }
  if (vocab.status === 'offline') {
    actions.push(
      <Button key="repub" type="primary" onClick={() => handleStatusChange('published')}>
        重新发布
      </Button>,
    );
  }
  actions.push(
    <Button
      key="edit"
      icon={<EditOutlined />}
      onClick={() => navigate(`/vocabularies/${id}/edit`)}
    >
      编辑
    </Button>,
  );

  return (
    <div>
      <PageHeader title={`词汇详情 #${vocab.id}`} onBack extra={<Space>{actions}</Space>} />
      <Card>
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="单词">{vocab.word}</Descriptions.Item>
          <Descriptions.Item label="分类">{categoryName}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag status={vocab.status} />
          </Descriptions.Item>
          <Descriptions.Item label="版本">v{vocab.version}</Descriptions.Item>
          <Descriptions.Item label="释义" span={2}>
            {vocab.definition}
          </Descriptions.Item>
          {vocab.example && (
            <Descriptions.Item label="例句" span={2}>
              {vocab.example}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}
