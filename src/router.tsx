import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { PracticeLayout } from '@/components/layout/PracticeLayout';
import { HomePage } from '@/pages/Home/HomePage';
import { PracticeSetupPage } from '@/pages/Practice/PracticeSetupPage';
import { PracticeSessionPage } from '@/pages/Practice/PracticeSessionPage';
import { PracticeReviewPage } from '@/pages/Practice/PracticeReviewPage';
import { TopicListPage } from '@/pages/Topics/TopicListPage';
import { TopicDetailPage } from '@/pages/Topics/TopicDetailPage';
import { HistoryListPage } from '@/pages/History/HistoryListPage';
import { HistoryDetailPage } from '@/pages/History/HistoryDetailPage';
import { VocabListPage } from '@/pages/Vocabulary/VocabListPage';
import { Dashboard } from '@/pages/Stats/Dashboard';
import { SettingsPage } from '@/pages/Settings/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/topics', element: <TopicListPage /> },
      { path: '/topics/:id', element: <TopicDetailPage /> },
      { path: '/history', element: <HistoryListPage /> },
      { path: '/history/:id', element: <HistoryDetailPage /> },
      { path: '/vocabulary', element: <VocabListPage /> },
      { path: '/stats', element: <Dashboard /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    element: <PracticeLayout />,
    children: [
      { path: '/practice/setup', element: <PracticeSetupPage /> },
      { path: '/practice/session', element: <PracticeSessionPage /> },
      { path: '/practice/review/:id', element: <PracticeReviewPage /> },
    ],
  },
]);