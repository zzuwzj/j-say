import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Card, Form, Input, Select, Space, message } from 'antd';
import { vocabApi } from '../../api/vocabularies';
import { categoryApi } from '../../api/categories';
import { PageHeader } from '../../components/shared';

const { TextArea } = Input;
const { Option } = Select;

export function VocabEditPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryApi.list(false).then((res) => { if (res.success) setCategories(res.data); });
    if (isEdit) {
      vocabApi.getById(Number(id)).then((res) => {
        if (res.success) form.setFieldsValue(res.data);
      });
    }
  }, [id, isEdit, form]);

  const handleSubmit = async (values: any, status: 'draft' | 'published') => {
    setLoading(true);
    try {
      const data = { ...values, status, relatedTopicIds: values.relatedTopicIds || [] };
      if (isEdit) {
        await vocabApi.update(Number(id), data);
        message.success('更新成功');
      } else {
        await vocabApi.create(data);
        message.success('创建成功');
      }
      navigate('/vocabularies');
    } catch (e: any) {
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? '编辑词汇' : '新建词汇'}
        onBack
        extra={
          <Space>
            <Button
              onClick={() => form.validateFields().then((v) => handleSubmit(v, 'draft'))}
              loading={loading}
            >
              保存草稿
            </Button>
            <Button
              type="primary"
              onClick={() => form.validateFields().then((v) => handleSubmit(v, 'published'))}
              loading={loading}
            >
              发布
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" initialValues={{ status: 'draft' }}>
          <Form.Item label="单词/短语" name="word" rules={[{ required: true, message: '请输入单词' }]}>
            <Input placeholder="英文单词或短语" />
          </Form.Item>
          <Form.Item label="释义" name="definition" rules={[{ required: true, message: '请输入释义' }]}>
            <TextArea rows={2} placeholder="中文释义" />
          </Form.Item>
          <Form.Item label="例句" name="example">
            <TextArea rows={2} placeholder="英文例句（可选）" />
          </Form.Item>
          <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: '请选择分类' }]}>
            <Select style={{ width: 200 }}>
              {categories.map((c: any) => <Option key={c.id} value={c.id}>{c.nameZh} ({c.nameEn})</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}