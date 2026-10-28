import { BrowserRouter, Route, Routes } from 'react-router';
import { Shell } from './components/Shell';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
