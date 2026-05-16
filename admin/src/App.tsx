import { useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { antdToken } from '@shared/design-tokens';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { TopicListPage } from './pages/Topics/TopicListPage';
import { TopicEditPage } from './pages/Topics/TopicEditPage';
import { TopicDetailPage } from './pages/Topics/TopicDetailPage';
import { VocabListPage } from './pages/Vocabularies/VocabListPage';
import { VocabEditPage } from './pages/Vocabularies/VocabEditPage';
import { VocabDetailPage } from './pages/Vocabularies/VocabDetailPage';
import { CategoryPage } from './pages/Categories/CategoryPage';
import { ImportExportPage } from './pages/ImportExport/ImportExportPage';
import { StatsPage } from './pages/Stats/StatsPage';
import { VersionPage } from './pages/Versions/VersionPage';
import { AuditLogPage } from './pages/Logs/AuditLogPage';
import { useAuthStore } from './stores/authStore';

export default function App() {
  const check = useAuthStore((s) => s.check);

  useEffect(() => {
    check();
  }, [check]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: antdToken,
        components: {
          Layout: {
            headerBg: 'var(--admin-header-bg, #ffffff)',
            siderBg: '#ffffff',
            bodyBg: '#f8fafc',
          },
          Menu: {
            itemHoverBg: '#eef4ff',
            itemSelectedBg: '#eef4ff',
            itemSelectedColor: '#2438ab',
          },
          Card: {
            headerBg: 'transparent',
          },
        },
      }}
    >
      <AntApp>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/topics" element={<TopicListPage />} />
            <Route path="/topics/create" element={<TopicEditPage />} />
            <Route path="/topics/:id/edit" element={<TopicEditPage />} />
            <Route path="/topics/:id" element={<TopicDetailPage />} />
            <Route path="/vocabularies" element={<VocabListPage />} />
            <Route path="/vocabularies/create" element={<VocabEditPage />} />
            <Route path="/vocabularies/:id/edit" element={<VocabEditPage />} />
            <Route path="/vocabularies/:id" element={<VocabDetailPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/import" element={<ImportExportPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/versions" element={<VersionPage />} />
            <Route path="/logs" element={<AuditLogPage />} />
          </Route>
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
}