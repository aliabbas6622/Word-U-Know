import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppStateProvider } from './context/AppStateContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import FirebaseStatus from './components/FirebaseStatus';
import LoadingSpinner from './components/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppStateProvider>
        <HashRouter>
        <div className="min-h-screen font-sans flex flex-col">
          <Header />
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex-grow">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/archive" element={<ArchivePage />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <FirebaseStatus />
        </div>
        </HashRouter>
        </AppStateProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;