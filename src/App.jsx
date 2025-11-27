import React from 'react';
import './App.css';
import './components/css/Common.css';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import ScrollToTopButton from './components/ScrollToTopButton.jsx';
import Accueil from './pages/Accueil.jsx';
import PoserUnePlainte from './pages/PoserUnePlainte.jsx';
import PolitiqueAntiCorruption from './pages/PolitiqueAntiCorruption.jsx';
import About from './pages/About.jsx';
import SuiviSignalements from './pages/SuiviSignalements.jsx';
import Admin from './pages/Admin.jsx';

function App() {
  return (
    <div className="app">
      <Header />
      <div className="container">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/plainte" element={<PoserUnePlainte />} />
          <Route path="/politique-anti-corruption" element={<PolitiqueAntiCorruption />} />
          <Route path="/about" element={<About />} />
          <Route path="/suivi" element={<SuiviSignalements />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

export default App;