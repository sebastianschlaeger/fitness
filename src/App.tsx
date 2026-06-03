import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import FloatingTimer from './components/FloatingTimer'
import { TimerProvider, useTimer } from './lib/timer'
import Dashboard from './pages/Dashboard'
import Training from './pages/Training'
import ExerciseDetail from './pages/ExerciseDetail'
import Weight from './pages/Weight'
import Walking from './pages/Walking'
import Plan from './pages/Plan'

function Shell() {
  const { isRunning } = useTimer()
  // Mehr Platz nach unten, wenn die schwebende Timer-Leiste sichtbar ist,
  // damit sie die untersten Buttons nicht verdeckt.
  return (
    <BrowserRouter>
      <div className={`min-h-screen bg-bg text-text-primary ${isRunning ? 'pb-40' : 'pb-16'}`}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/walking" element={<Walking />} />
          <Route path="/plan" element={<Plan />} />
        </Routes>
        <FloatingTimer />
        <TabBar />
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <TimerProvider>
      <Shell />
    </TimerProvider>
  )
}
