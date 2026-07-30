import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute';
import MainPage from './pages/MainPage/MainPage';
import './App.css';
import { DEMO_MODE } from './config/api';

const LandscapeDesign = lazy(() => import('./pages/LandscapeDesign'));
const LandscapeConstructor = lazy(() => import('./pages/LandscapeConstructor'));
const Encyclopedia = lazy(() => import('./pages/Encyclopedia/Encyclopedia'));
const PlantRecognition = lazy(() => import('./pages/PlantRecognition/PlantRecognition'));
const DiseaseDetection = lazy(() => import('./pages/DiseaseDetection/DiseaseDetection'));
const OurTeam = lazy(() => import('./pages/OurTeam'));
const PrivateGarden = lazy(() => import('./pages/PrivateGarden'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Auth = lazy(() => import('./pages/Auth'));

const App: React.FC = () => {
  return (
    <Router>
      {DEMO_MODE && <div className="demo-mode-badge">Демо · без сервера</div>}
      <Header />
      <Suspense fallback={<div className="page-loader" role="status">Загружаем страницу…</div>}>
        <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/encyclopedia" element={<Encyclopedia />} />
        <Route path="/auth" element={<Auth />} />

        {/* Узнать по фото */}
        <Route
          path="/recognition1"
          element={
            <ProtectedRoute requiredFeature="plantRecognition">
              <PlantRecognition />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recognition2"
          element={
            <ProtectedRoute requiredFeature="diseaseDetection">
              <DiseaseDetection />
            </ProtectedRoute>
          }
        />

        {/* Мастерская ландшафта */}
        <Route
          path="/landscapedesign"
          element={
            <ProtectedRoute requiredFeature="landscapeDesigner">
              <LandscapeDesign />
            </ProtectedRoute>
          }
        />

        <Route
          path="/konstructor"
          element={
            <ProtectedRoute requiredFeature="landscapeConstructor">
              <LandscapeConstructor />
            </ProtectedRoute>
          }
        />

        {/* Остальные страницы */}
        <Route path="/ourteam" element={<OurTeam />} />
        <Route
          path="/privategarden"
          element={
            <ProtectedRoute requiredFeature="personalGarden">
              <PrivateGarden />
            </ProtectedRoute>
          }
        />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

        {/* Fallback маршрут */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
