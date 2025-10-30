import Home from '@/pages/app-home';
import ImportListPage from '@/pages/import-list';
import ListEditor from '@/pages/list-editor';
import ListSelector from '@/pages/list-selector';
import Shopping from '@/pages/shopping';
import { Navigate, Route, Routes } from 'react-router-dom';
import ShoppingSelector from './pages/shopping-selector';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lists" element={<ListSelector />} />
        <Route path="/edit" element={<ListEditor />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/import" element={<ImportListPage />} />
        <Route path="/shopping-selector" element={<ShoppingSelector />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
