import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CardCatalogProvider } from './catalog';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './shared/auth';
import { AccountPage } from './pages/AccountPage';
import { CollectionPage } from './pages/CollectionPage';
import { DeckEditorPage } from './pages/DeckEditorPage';
import { DecksPage } from './pages/DecksPage';
import { FormatsPage } from './pages/FormatsPage';
import { FormatDetailPage } from './pages/FormatDetailPage';
import { ListsPage } from './pages/ListsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AboutPage } from './pages/AboutPage';
import { CardDetailPage } from './pages/CardDetailPage';
import { SearchPage } from './pages/SearchPage';

export function App() {
  return (
    <BrowserRouter basename="/otcp">
      <AuthProvider>
        <CardCatalogProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/search" replace />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="search/card/:id" element={<CardDetailPage />} />
              <Route path="formats" element={<FormatsPage />} />
              <Route path="formats/:formatId" element={<FormatDetailPage />} />
              <Route path="decks" element={<DecksPage />} />
              <Route path="decks/edit/:draftId" element={<DeckEditorPage />} />
              <Route path="collection" element={<CollectionPage />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="notices" element={<Navigate to="/about" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CardCatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
