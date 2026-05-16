import { useState, useEffect } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoryApi } from '../../api/categories';
import { PageHeader } from '../../components/shared';

export function CategoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list(true);
      if (res.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = () => {
    setEditItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditItem(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editItem) {
      await categoryApi.update(editItem.id, values);
      message.success('更新成功');
    } else {
      await categoryApi.create(values);
      message.success('创建成功');
    }
    setModalOpen(false);
    fetchData();
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await categoryApi.update(id, { enabled });
    message.success(enabled ? '已启用' : '已禁用');
    fetchData();
  };

  const handleDelete = async (id: number) => {
    const res = await categoryApi.delete(id);
    if (res.success) {
      message.success('删除成功');
      fetchData();
    } else {
      message.error((res as any).error?.message || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '标识符', dataIndex: 'slug', width: 120 },
    { title: '中文名称', dataIndex: 'nameZh', width: 120 },
    { title: '英文名称', dataIndex: 'nameEn', width: 120 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    { title: '话题数', dataIndex: 'topicCount', width: 80 },
    { title: '词汇数', dataIndex: 'vocabCount', width: 80 },
    {
      title: '启用', dataIndex: 'enabled', width: 80,
      render: (v: boolean, record: any) => <Switch checked={v} size="small" onChange={(checked) => handleToggle(record.id, checked)} />,
    },
    {
      title: '系统', dataIndex: 'isSystem', width: 60,
      render: (v: boolean) => v ? '是' : '否',
    },
    {
      title: '操作', width: 120, render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {!record.isSystem && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="分类管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建分类
          </Button>
        }
      />

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal title={editItem ? '编辑分类' : '新建分类'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="标识符 (slug)" name="slug" rules={[{ required: true, message: '请输入标识符' }]}>
            <Input placeholder="如 person, experience" disabled={!!editItem} />
          </Form.Item>
          <Form.Item label="中文名称" name="nameZh" rules={[{ required: true, message: '请输入中文名称' }]}>
            <Input placeholder="人物" />
          </Form.Item>
          <Form.Item label="英文名称" name="nameEn" rules={[{ required: true, message: '请输入英文名称' }]}>
            <Input placeholder="Person" />
          </Form.Item>
          <Form.Item label="排序权重" name="sortOrder">
            <Input type="number" placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}