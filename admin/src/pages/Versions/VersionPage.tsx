import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  DiffOutlined,
  PlusOutlined,
  RocketOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { versionApi } from '../../api/versions';
import { PageHeader } from '../../components/shared';

const { Text } = Typography;

export function VersionPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [form] = Form.useForm();
  const [diffForm] = Form.useForm();

  const loadVersions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await versionApi.list(page, 20);
      if (res.success) {
        setVersions(res.data);
        setPagination(res.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVersions(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const res = await versionApi.create(values);
      if (res.success) {
        message.success('版本创建成功');
        setCreateOpen(false);
        form.resetFields();
        loadVersions();
      }
    } catch {
      // validation error
    }
  };

  const handlePublish = async (id: number) => {
    try {
      const res = await versionApi.publish(id);
      if (res.success) {
        message.success('版本发布成功');
        loadVersions();
      }
    } catch {
      message.error('发布失败');
    }
  };

  const handleRollback = async (id: number) => {
    try {
      const res = await versionApi.rollback(id);
      if (res.success) {
        message.success('版本回滚成功');
        loadVersions();
      }
    } catch {
      message.error('回滚失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await versionApi.delete(id);
      if (res.success) {
        message.success('版本已删除');
        loadVersions();
      }
    } catch {
      message.error('删除失败，无法删除已发布的版本');
    }
  };

  const handleDiff = async () => {
    try {
      const values = await diffForm.validateFields();
      const res = await versionApi.diff(values.fromId, values.toId);
      if (res.success) {
        setDiffResult(res.data);
      }
    } catch {
      // validation error
    }
  };

  const statusColor: Record<string, string> = {
    published: 'green',
    unpublished: 'default',
    archived: 'orange',
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '版本号', dataIndex: 'version', key: 'version', render: (v: string) => <Text strong>{v}</Text> },
    { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true },
    { title: '话题数', dataIndex: 'topicCount', key: 'topicCount', width: 80 },
    { title: '词汇数', dataIndex: 'vocabCount', key: 'vocabCount', width: 80 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s === 'published' ? '已发布' : s === 'archived' ? '已归档' : '未发布'}</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: number) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '操作', key: 'actions', width: 240,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status !== 'published' && (
            <Popconfirm title="确定发布此版本？发布后客户端将同步此版本数据" onConfirm={() => handlePublish(record.id)}>
              <Button size="small" type="link" icon={<RocketOutlined />}>发布</Button>
            </Popconfirm>
          )}
          {record.status !== 'published' && record.snapshot && (
            <Popconfirm title="确定回滚到此版本？将恢复该版本快照中的已发布语料" onConfirm={() => handleRollback(record.id)}>
              <Button size="small" type="link" icon={<RollbackOutlined />}>回滚</Button>
            </Popconfirm>
          )}
          {record.status !== 'published' && (
            <Popconfirm title="确定删除此版本？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="版本管理"
        extra={
          <Space>
            <Button icon={<DiffOutlined />} onClick={() => setDiffOpen(true)}>
              版本对比
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              创建版本
            </Button>
          </Space>
        }
      />

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => loadVersions(page),
          }}
        />
      </Card>

      {/* Create Version Modal */}
      <Modal
        title="创建版本"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}>
            <Input placeholder="例如: 1.1.0" />
          </Form.Item>
          <Form.Item name="summary" label="版本摘要">
            <Input.TextArea rows={3} placeholder="描述此版本的变更内容" />
          </Form.Item>
        </Form>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
          创建版本将快照当前所有已发布的话题和词汇数据
        </div>
      </Modal>

      {/* Diff Modal */}
      <Modal
        title="版本对比"
        open={diffOpen}
        onOk={handleDiff}
        onCancel={() => { setDiffOpen(false); setDiffResult(null); diffForm.resetFields(); }}
        width={600}
      >
        <Form form={diffForm} layout="vertical">
          <Form.Item name="fromId" label="源版本 ID" rules={[{ required: true, message: '请输入源版本 ID' }]}>
            <Input type="number" placeholder="输入版本 ID" />
          </Form.Item>
          <Form.Item name="toId" label="目标版本 ID" rules={[{ required: true, message: '请输入目标版本 ID' }]}>
            <Input type="number" placeholder="输入版本 ID" />
          </Form.Item>
        </Form>

        {diffResult && (
          <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }}>
            <Descriptions.Item label="新增话题">{diffResult.addedTopics}</Descriptions.Item>
            <Descriptions.Item label="删除话题">{diffResult.removedTopics}</Descriptions.Item>
            <Descriptions.Item label="修改话题">{diffResult.modifiedTopics}</Descriptions.Item>
            <Descriptions.Item label="新增词汇">{diffResult.addedVocabs}</Descriptions.Item>
            <Descriptions.Item label="删除词汇">{diffResult.removedVocabs}</Descriptions.Item>
            <Descriptions.Item label="修改词汇">{diffResult.modifiedVocabs}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}