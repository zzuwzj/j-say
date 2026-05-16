import { useState, useEffect } from 'react';
import { Button, Card, Select, Space, Table, Tag } from 'antd';
import { auditLogApi } from '../../api/audit-logs';
import { PageHeader } from '../../components/shared';

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  publish: '发布',
  offline: '下架',
  import: '导入',
  batch_delete: '批量删除',
  batch_update_category: '批量改分类',
  batch_update_difficulty: '批量改难度',
  batch_update_status: '批量改状态',
  batch_publish: '批量发布',
  batch_offline: '批量下架',
  create_version: '创建版本',
  publish_version: '发布版本',
  rollback_version: '回滚版本',
  delete_version: '删除版本',
};

const targetTypeLabels: Record<string, string> = {
  topic: '话题',
  vocabulary: '词汇',
  category: '分类',
  version: '版本',
  system: '系统',
};

const actionColor: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  publish: 'cyan',
  offline: 'orange',
  import: 'purple',
  batch_delete: 'red',
  batch_publish: 'cyan',
  batch_offline: 'orange',
  create_version: 'geekblue',
  publish_version: 'green',
  rollback_version: 'volcano',
  delete_version: 'red',
};

export function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [targetTypeFilter, setTargetTypeFilter] = useState<string | undefined>();

  const loadLogs = async (page = 1) => {
    setLoading(true);
    try {
      const query: any = { page, pageSize: 20 };
      if (actionFilter) query.action = actionFilter;
      if (targetTypeFilter) query.targetType = targetTypeFilter;
      const res = await auditLogApi.list(query);
      if (res.success) {
        setLogs(res.data);
        setPagination(res.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: number) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 120,
      render: (a: string) => <Tag color={actionColor[a] || 'default'}>{actionLabels[a] || a}</Tag>,
    },
    {
      title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 100,
      render: (t: string) => targetTypeLabels[t] || t || '-',
    },
    {
      title: '目标ID', dataIndex: 'targetId', key: 'targetId', width: 80,
      render: (id: number) => id || '-',
    },
    {
      title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true,
      render: (detail: any) =>
        detail ? (
          <span style={{ fontSize: 12, color: '#64748b' }}>{JSON.stringify(detail)}</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="操作日志" description="管理员的全部操作记录" />

      <Card style={{ marginBottom: 16 }} variant="borderless">
        <Space wrap>
          <span>操作类型：</span>
          <Select
            value={actionFilter}
            onChange={setActionFilter}
            style={{ width: 160 }}
            allowClear
            placeholder="全部"
          >
            {Object.entries(actionLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>

          <span>目标类型：</span>
          <Select
            value={targetTypeFilter}
            onChange={setTargetTypeFilter}
            style={{ width: 120 }}
            allowClear
            placeholder="全部"
          >
            {Object.entries(targetTypeLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>

          <Button type="primary" onClick={() => loadLogs(1)}>查询</Button>
          <Button onClick={() => { setActionFilter(undefined); setTargetTypeFilter(undefined); loadLogs(1); }}>重置</Button>
        </Space>
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => loadLogs(page),
          }}
        />
      </Card>
    </div>
  );
}