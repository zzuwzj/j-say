import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  DownloadOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { importExportApi } from '../../api/import-export';
import { PageHeader } from '../../components/shared';

const { Dragger } = Upload;
const { Text } = Typography;

export function ImportExportPage() {
  const [importStep, setImportStep] = useState(0);
  const [importData, setImportData] = useState<any>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [strategy, setStrategy] = useState<'skip' | 'overwrite' | 'keep_both'>('skip');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const [exportStatus, setExportStatus] = useState<'draft' | 'published' | 'offline' | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  // Parse uploaded JSON file
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(data);
        setImportStep(1);

        // Auto-preview
        const res = await importExportApi.preview(data);
        if (res.success) {
          setPreviewResult(res.data);
          setImportStep(2);
        }
      } catch {
        message.error('JSON 文件解析失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
    return false; // prevent auto upload
  };

  // Execute import
  const handleImport = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      const res = await importExportApi.execute(importData, strategy);
      if (res.success) {
        setImportResult(res.data);
        setImportStep(3);
        message.success('导入成功');
      }
    } catch {
      message.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // Export data
  const handleExport = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (exportStatus) params.status = exportStatus;
      const res = await importExportApi.exportData(params);
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `j-say-corpus-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('导出成功');
      }
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const resetImport = () => {
    setImportStep(0);
    setImportData(null);
    setPreviewResult(null);
    setImportResult(null);
    setStrategy('skip');
  };

  const previewColumns = [
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '总数', dataIndex: 'total', key: 'total' },
    { title: '有效', dataIndex: 'valid', key: 'valid', render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: '重复', dataIndex: 'duplicate', key: 'duplicate', render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : <Tag>{v}</Tag> },
    { title: '无效', dataIndex: 'invalid', key: 'invalid', render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag>{v}</Tag> },
  ];

  const previewData = previewResult ? [
    { key: 'topics', type: '话题', ...previewResult.topics },
    { key: 'vocabs', type: '词汇', ...previewResult.vocabularies },
  ] : [];

  return (
    <div>
      <PageHeader title="导入导出" description="批量导入/导出话题与词汇数据" />

      <Steps
        current={importStep}
        style={{ marginBottom: 32 }}
        items={[
          { title: '上传文件' },
          { title: '预览数据' },
          { title: '选择策略' },
          { title: '导入完成' },
        ]}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="导入语料" style={{ marginBottom: 24 }}>
            {importStep === 0 && (
              <Dragger accept=".json" showUploadList={false} beforeUpload={handleFileUpload}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p>点击或拖拽 JSON 文件到此处</p>
                <p style={{ color: '#94a3b8', fontSize: 12 }}>
                  支持包含 topics 和/或 vocabularies 数组的 JSON 文件
                </p>
              </Dragger>
            )}

            {importStep >= 2 && previewResult && (
              <>
                <Alert
                  style={{ marginBottom: 16 }}
                  type={previewResult.topics.invalid > 0 || previewResult.vocabularies.invalid > 0 ? 'warning' : 'info'}
                  message="预览结果"
                  description={`共 ${previewResult.topics.total + previewResult.vocabularies.total} 条数据，其中有效 ${previewResult.topics.valid + previewResult.vocabularies.valid} 条，重复 ${previewResult.topics.duplicate + previewResult.vocabularies.duplicate} 条，无效 ${previewResult.topics.invalid + previewResult.vocabularies.invalid} 条`}
                />

                <Table columns={previewColumns} dataSource={previewData} pagination={false} size="small" style={{ marginBottom: 16 }} />

                {previewResult.topics.duplicates.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="warning">重复话题: </Text>
                    <Text>{previewResult.topics.duplicates.map((d: any) => `${d.title}(Part${d.part})`).join(', ')}</Text>
                  </div>
                )}

                {previewResult.vocabularies.duplicates.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text type="warning">重复词汇: </Text>
                    <Text>{previewResult.vocabularies.duplicates.map((d: any) => d.word).join(', ')}</Text>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <Text>重复数据处理策略：</Text>
                  <Select value={strategy} onChange={setStrategy} style={{ width: 200, marginLeft: 8 }}>
                    <Select.Option value="skip">跳过重复项</Select.Option>
                    <Select.Option value="overwrite">覆盖已有数据</Select.Option>
                    <Select.Option value="keep_both">保留两者</Select.Option>
                  </Select>
                </div>

                <Space>
                  <Button type="primary" onClick={handleImport} loading={importing}>
                    执行导入
                  </Button>
                  <Button onClick={resetImport}>重新上传</Button>
                </Space>
              </>
            )}

            {importStep === 3 && importResult && (
              <>
                <Alert
                  type="success"
                  icon={<CheckCircleOutlined />}
                  message="导入完成"
                  description={
                    <div>
                      <div>话题：导入 {importResult.topicsImported} 条，跳过 {importResult.topicsSkipped} 条</div>
                      <div>词汇：导入 {importResult.vocabsImported} 条，跳过 {importResult.vocabsSkipped} 条</div>
                    </div>
                  }
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Button onClick={resetImport}>继续导入</Button>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="导出语料">
            <div style={{ marginBottom: 16 }}>
              <Text>按状态筛选（可选）：</Text>
              <Select
                value={exportStatus}
                onChange={setExportStatus}
                style={{ width: 200, marginLeft: 8 }}
                allowClear
                placeholder="全部状态"
              >
                <Select.Option value="published">已发布</Select.Option>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="offline">已下架</Select.Option>
              </Select>
            </div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exporting}
            >
              导出 JSON
            </Button>
            <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 12 }}>
              导出文件包含话题、词汇和分类数据，格式与 J-Say 前端兼容
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}