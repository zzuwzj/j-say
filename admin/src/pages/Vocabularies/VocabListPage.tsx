import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, Input, Popconfirm, Select, Space, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { vocabApi } from '../../api/vocabularies';
import { categoryApi } from '../../api/categories';
import { PageHeader, StatusTag } from '../../components/shared';

const { Option } = Select;

export function VocabListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await vocabApi.list({
        page, pageSize: pagination.pageSize,
        categoryId, keyword: keyword || undefined,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, keyword, pagination.pageSize]);

  useEffect(() => { fetchData(1); }, [categoryId]);
  useEffect(() => { categoryApi.list(false).then((res) => { if (res.success) setCategories(res.data); }); }, []);

  const handleDelete = async (id: number) => {
    await vocabApi.delete(id);
    message.success('删除成功');
    fetchData(pagination.page);
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    await vocabApi.batch({ action: 'delete', ids: selectedRowKeys });
    message.success(`已删除 ${selectedRowKeys.length} 条`);
    setSelectedRowKeys([]);
    fetchData(pagination.page);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '单词', dataIndex: 'word', width: 160 },
    { title: '释义', dataIndex: 'definition', ellipsis: true },
    {
      title: '分类', dataIndex: 'categoryId', width: 100,
      render: (id: number) => categories.find((c: any) => c.id === id)?.nameZh || id,
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
          <Button type="link" size="small" onClick={() => navigate(`/vocabularies/${record.id}`)}>查看</Button>
          <Button type="link" size="small" onClick={() => navigate(`/vocabularies/${record.id}/edit`)}>编辑</Button>
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
        title="词汇管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/vocabularies/create')}
          >
            新建词汇
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }} variant="borderless">
        <Space wrap>
          <Select
            placeholder="分类"
            allowClear
            style={{ width: 160 }}
            value={categoryId}
            onChange={setCategoryId}
          >
            {categories.map((c: any) => (
              <Option key={c.id} value={c.id}>
                {c.nameZh}
              </Option>
            ))}
          </Select>
          <Input.Search
            placeholder="搜索单词或释义"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={() => fetchData(1)}
            allowClear
          />
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }} variant="borderless">
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <Button icon={<DeleteOutlined />} danger onClick={handleBatchDelete}>
              批量删除
            </Button>
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
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => fetchData(p),
          }}
        />
      </Card>
    </div>
  );
}