import Home from '@/pages/home';
import ListEditor from '@/pages/list-editor';
import { Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<ListEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
