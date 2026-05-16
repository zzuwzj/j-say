import { useState } from 'react';
import { Form, Input, Button, Space, Card, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DragOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface QuestionEditorProps {
  part: number;
}

export function QuestionEditor({ part }: QuestionEditorProps) {
  return (
    <div>
      <Divider orientation="left">问题列表</Divider>

      <Form.List name="questions">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <Card key={key} size="small" style={{ marginBottom: 12 }} title={`问题 ${index + 1}`}
                extra={<Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />}
              >
                <Form.Item {...restField} name={name} rules={[{ required: true, message: '请输入问题' }]}>
                  <Input placeholder="输入问题文本" />
                </Form.Item>

                <Form.Item label="简单示例" name={[index, 'examples', index, 'simple']}>
                  <TextArea rows={2} placeholder="一句话简单示例" />
                </Form.Item>
                <Form.Item label="Band 7 示例" name={[index, 'examples', index, 'band7']}>
                  <TextArea rows={3} placeholder="7 分水平的示例回答" />
                </Form.Item>
              </Card>
            ))}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add('')}>
              添加问题
            </Button>
          </>
        )}
      </Form.List>

      {part === 2 && (
        <>
          <Divider orientation="left">Part 2 提示点</Divider>
          <Form.List name="prompts">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={name}>
                      <Input placeholder={`提示点 ${index + 1}`} style={{ width: 400 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add('')}>
                  添加提示点
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left">独白示例</Divider>
          <Form.Item label="简单示例" name={['part2Example', 'simple']}>
            <TextArea rows={2} placeholder="一句话简单独白示例" />
          </Form.Item>
          <Form.Item label="Band 7 示例" name={['part2Example', 'band7']}>
            <TextArea rows={4} placeholder="7 分水平的独白示例" />
          </Form.Item>
        </>
      )}
    </div>
  );
}