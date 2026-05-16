import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Card, Form, Input, InputNumber, Select, Space, message } from 'antd';
import { topicApi } from '../../api/topics';
import { categoryApi } from '../../api/categories';
import { QuestionEditor } from '../../components/topic/QuestionEditor';
import { PageHeader } from '../../components/shared';

const { TextArea } = Input;
const { Option } = Select;

export function TopicEditPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [part, setPart] = useState<number>(1);

  useEffect(() => {
    categoryApi.list(false).then((res) => {
      if (res.success) setCategories(res.data);
    });

    if (isEdit) {
      topicApi.getById(Number(id)).then((res) => {
        if (res.success) {
          const d = res.data;
          form.setFieldsValue({
            part: d.part,
            categoryId: d.categoryId,
            title: d.title,
            content: d.content,
            difficulty: d.difficulty,
            status: d.status,
            prompts: d.prompts || [],
            questions: d.questions || [],
            examples: d.examples || [],
            part2Example: d.part2Example || { simple: '', band7: '' },
            relatedPart2Id: d.relatedPart2Id,
          });
          setPart(d.part);
        }
      });
    }
  }, [id, isEdit, form]);

  const handleSubmit = async (values: any, status: 'draft' | 'published') => {
    setLoading(true);
    try {
      const data = {
        ...values,
        status,
        prompts: values.prompts || [],
        questions: values.questions || [],
        examples: values.examples || [],
        part2Example: values.part2Example || undefined,
        relatedPart2Id: values.relatedPart2Id || null,
      };

      if (isEdit) {
        await topicApi.update(Number(id), data);
        message.success('更新成功');
      } else {
        await topicApi.create(data as any);
        message.success('创建成功');
      }
      navigate('/topics');
    } catch (e: any) {
      message.error(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? '编辑话题' : '新建话题'}
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
        <Form form={form} layout="vertical" initialValues={{ part: 1, difficulty: 'medium', status: 'draft', questions: [''], examples: [{ simple: '', band7: '' }], prompts: [] }}>
          <Space size="large" style={{ marginBottom: 16 }}>
            <Form.Item label="Part" name="part" rules={[{ required: true }]}>
              <Select style={{ width: 120 }} onChange={(v) => setPart(v)}>
                <Option value={1}>Part 1</Option>
                <Option value={2}>Part 2</Option>
                <Option value={3}>Part 3</Option>
              </Select>
            </Form.Item>
            <Form.Item label="分类" name="categoryId" rules={[{ required: true }]}>
              <Select style={{ width: 160 }}>
                {categories.map((c: any) => <Option key={c.id} value={c.id}>{c.nameZh}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item label="难度" name="difficulty" rules={[{ required: true }]}>
              <Select style={{ width: 120 }}>
                <Option value="easy">简单</Option>
                <Option value="medium">中等</Option>
                <Option value="hard">困难</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="话题标题" maxLength={200} />
          </Form.Item>

          <Form.Item label="内容描述" name="content" rules={[{ required: true, message: '请输入内容描述' }]}>
            <TextArea rows={3} placeholder="话题描述" />
          </Form.Item>

          <QuestionEditor part={part} />

          {part === 3 && (
            <Form.Item label="关联 Part 2 话题 ID" name="relatedPart2Id">
              <InputNumber style={{ width: '100%' }} placeholder="输入 Part 2 话题 ID" />
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
}