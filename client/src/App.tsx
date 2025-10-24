import { Route, Routes, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import ListEditor from '@/pages/ListEditor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<ListEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
