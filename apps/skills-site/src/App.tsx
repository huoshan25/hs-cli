import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Skill } from './pages/Skill';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skills/:id" element={<Skill />} />
      </Routes>
    </BrowserRouter>
  );
}
