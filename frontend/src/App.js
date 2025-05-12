import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MultiPageForm from './components/MultiPageForm';
import ConfirmationPage from './components/ConfirmationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MultiPageForm />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
