import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, Input, Popconfirm, Select, Space, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { topicApi } from '../../api/topics';
import { categoryApi } from '../../api/categories';
import {
  DifficultyLabel,
  PageHeader,
  PartLabel,
  PART_LABELS,
  StatusTag,
} from '../../components/shared';

const { Option } = Select;

export function TopicListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  // 筛选条件
  const [part, setPart] = useState<number | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [difficulty, setDifficulty] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await topicApi.list({
        page, pageSize: pagination.pageSize,
        part: part as any, categoryId, difficulty: difficulty as any, status: status as any,
        keyword: keyword || undefined,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [part, categoryId, difficulty, status, keyword, pagination.pageSize]);

  const fetchCategories = useCallback(async () => {
    const res = await categoryApi.list(false);
    if (res.success) setCategories(res.data);
  }, []);

  useEffect(() => { fetchData(1); }, [part, categoryId, difficulty, status]);
  useEffect(() => { fetchCategories(); }, []);

  const handleDelete = async (id: number) => {
    await topicApi.delete(id);
    message.success('删除成功');
    fetchData(pagination.page);
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await topicApi.batch({ action: 'delete', ids: selectedRowKeys });
    message.success(`已删除 ${selectedRowKeys.length} 条`);
    setSelectedRowKeys([]);
    fetchData(pagination.page);
  };

  const handleBatchPublish = async () => {
    if (selectedRowKeys.length === 0) return;
    await topicApi.batch({ action: 'publish', ids: selectedRowKeys });
    message.success(`已发布 ${selectedRowKeys.length} 条`);
    setSelectedRowKeys([]);
    fetchData(pagination.page);
  };

  const handleBatchOffline = async () => {
    if (selectedRowKeys.length === 0) return;
    await topicApi.batch({ action: 'offline', ids: selectedRowKeys });
    message.success(`已下架 ${selectedRowKeys.length} 条`);
    setSelectedRowKeys([]);
    fetchData(pagination.page);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Part',
      dataIndex: 'part',
      width: 80,
      render: (v: number) => PART_LABELS[v] ?? <PartLabel part={v} />,
    },
    {
      title: '分类', dataIndex: 'categoryId', width: 100,
      render: (id: number) => categories.find((c: any) => c.id === id)?.nameZh || id,
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 90,
      render: (v: string) => <DifficultyLabel difficulty={v} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <StatusTag status={v} />,
    },
    {
      title: '更新时间', dataIndex: 'updatedAt', width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作', width: 150, render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => navigate(`/topics/${record.id}`)}>查看</Button>
          <Button type="link" size="small" onClick={() => navigate(`/topics/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="话题管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/topics/create')}>
            新建话题
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }} variant="borderless">
        <Space wrap>
          <Select placeholder="Part" allowClear style={{ width: 120 }} value={part} onChange={setPart}>
            <Option value={1}>Part 1</Option>
            <Option value={2}>Part 2</Option>
            <Option value={3}>Part 3</Option>
          </Select>
          <Select placeholder="分类" allowClear style={{ width: 140 }} value={categoryId} onChange={setCategoryId}>
            {categories.map((c: any) => <Option key={c.id} value={c.id}>{c.nameZh}</Option>)}
          </Select>
          <Select placeholder="难度" allowClear style={{ width: 120 }} value={difficulty} onChange={setDifficulty}>
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
          <Select placeholder="状态" allowClear style={{ width: 120 }} value={status} onChange={setStatus}>
            <Option value="draft">草稿</Option>
            <Option value="published">已发布</Option>
            <Option value="offline">已下架</Option>
          </Select>
          <Input.Search
            placeholder="搜索标题"
            style={{ width: 200 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => fetchData(1)}
            allowClear
          />
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button icon={<DeleteOutlined />} danger onClick={handleBatchDelete}>批量删除</Button>
            <Button type="primary" onClick={handleBatchPublish}>批量发布</Button>
            <Button onClick={handleBatchOffline}>批量下架</Button>
          </Space>
        </Card>
      )}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page) => fetchData(page),
          }}
        />
      </Card>
    </div>
  );
}