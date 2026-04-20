import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TVDisplay from './components/tv/TVDisplay';
import RemoteControl from './components/smartphone/RemoteControl'; // Crée ce fichier s'il n'existe pas

function App() {
  return (
    <Router>
      <Routes>
        {/* La route principale : L'écran de la Télévision */}
        <Route path="/" element={<TVDisplay />} />

        {/* La route pour le smartphone : Le contrôleur */}
        <Route path="/remote" element={<RemoteControl />} />

        {/* Optionnel : Redirection si la route n'existe pas */}
        <Route path="*" element={<div>Page non trouvée - 404</div>} />
      </Routes>
    </Router>
  );
}

export default App;