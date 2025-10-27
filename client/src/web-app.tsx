import Home from '@/pages/app-home';
import ListEditor from '@/pages/list-editor';
import ListSelector from '@/pages/list-selector';
import { Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lists" element={<ListSelector />} />
      <Route path="/list" element={<ListEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
