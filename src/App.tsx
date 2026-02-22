import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CardCatalogProvider } from './catalog';
import { AppShell } from './components/AppShell';
import { AccountPage } from './pages/AccountPage';
import { CollectionPage } from './pages/CollectionPage';
import { DecksPage } from './pages/DecksPage';
import { FormatsPage } from './pages/FormatsPage';
import { ListsPage } from './pages/ListsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NoticesPage } from './pages/NoticesPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { SearchPage } from './pages/SearchPage';

export function App() {
  return (
    <BrowserRouter basename="/otcp">
      <CardCatalogProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/search" replace />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="search/card/:id" element={<CardDetailPage />} />
            <Route path="formats" element={<FormatsPage />} />
            <Route path="decks" element={<DecksPage />} />
            <Route path="collection" element={<CollectionPage />} />
            <Route path="lists" element={<ListsPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </CardCatalogProvider>
    </BrowserRouter>
  );
}
