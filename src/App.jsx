import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FoodPage from './pages/FoodPage';
import WorkoutPage from './pages/WorkoutPage';
import ProgressPage from './pages/ProgressPage';
import PlanPage from './pages/PlanPage';
import SupplementsPage from './pages/SupplementsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen pb-24 md:pb-0" style={{ background: '#f8fafc' }}>
        <Navbar />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/supplements" element={<SupplementsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
