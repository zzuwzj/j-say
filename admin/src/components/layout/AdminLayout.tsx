import { useEffect, useMemo, useState } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router';
import {
  Avatar,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
  theme,
} from 'antd';
import {
  BarChartOutlined,
  BookOutlined,
  BranchesOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ImportOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/topics', icon: <BookOutlined />, label: '话题管理' },
  { key: '/vocabularies', icon: <ReadOutlined />, label: '词汇管理' },
  { key: '/categories', icon: <TagsOutlined />, label: '分类管理' },
  { key: '/import', icon: <ImportOutlined />, label: '导入导出' },
  { key: '/stats', icon: <BarChartOutlined />, label: '数据统计' },
  { key: '/versions', icon: <BranchesOutlined />, label: '版本管理' },
  { key: '/logs', icon: <FileTextOutlined />, label: '操作日志' },
];

const breadcrumbMap: Record<string, string> = {
  '/': '仪表盘',
  '/topics': '话题管理',
  '/topics/create': '新建话题',
  '/vocabularies': '词汇管理',
  '/vocabularies/create': '新建词汇',
  '/categories': '分类管理',
  '/import': '导入导出',
  '/stats': '数据统计',
  '/versions': '版本管理',
  '/logs': '操作日志',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 992 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

function selectedKey(pathname: string): string {
  const direct = menuItems.find((m) => m.key === pathname);
  if (direct) return direct.key;
  const prefixMatch = menuItems
    .filter((m) => m.key !== '/')
    .find((m) => pathname.startsWith(m.key));
  return prefixMatch?.key ?? '/';
}

export function AdminLayout() {
  const { authenticated, loading, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const items = [{ title: <a onClick={() => navigate('/')}>首页</a> }];
    let path = '';
    for (const seg of segments) {
      path += `/${seg}`;
      const label = breadcrumbMap[path];
      if (label) items.push({ title: <span>{label}</span> } as never);
    }
    return items;
  }, [location.pathname, navigate]);

  if (loading) return null;
  if (!authenticated) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SiderInner = (
    <>
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 20px',
          fontWeight: 700,
          fontSize: 16,
          color: token.colorPrimary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20 }} aria-hidden>
          🗣️
        </span>
        {!collapsed && <span>J-Say 管理后台</span>}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey(location.pathname)]}
        items={menuItems}
        onClick={({ key }) => {
          navigate(key);
          if (isMobile) setDrawerOpen(false);
        }}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          width={220}
          collapsedWidth={72}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          trigger={null}
          style={{
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          {SiderInner}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{ body: { padding: 0 } }}
          closable={false}
        >
          {SiderInner}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Space size={12}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))}
              aria-label="切换菜单"
            />
            <Breadcrumb items={breadcrumbItems} />
          </Space>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                管理员
              </Text>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: isMobile ? 12 : 20,
            padding: isMobile ? 16 : 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowSecondary,
            minHeight: 'calc(100vh - 64px - 40px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
