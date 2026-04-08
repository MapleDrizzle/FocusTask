import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import Timer from './pages/Timer'
import Stats from './pages/Stats'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Router>
  )
}

export default App
