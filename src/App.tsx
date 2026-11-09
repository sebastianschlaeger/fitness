import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TabBar from './components/TabBar'
import { pullConfig } from './lib/sync'
import Dashboard from './pages/Dashboard'
import Training from './pages/Training'
import ExerciseDetail from './pages/ExerciseDetail'
import Weight from './pages/Weight'
import Walking from './pages/Walking'
import Plan from './pages/Plan'

function Shell() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text-primary pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/training" element={<Training />} />
          <Route path="/training/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/weight" element={<Weight />} />
          <Route path="/walking" element={<Walking />} />
          <Route path="/plan" element={<Plan />} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}

export default function App() {
  // Geräteübergreifenden Sync der Nutzer-Config beim Start anstoßen
  useEffect(() => { pullConfig() }, [])

  return (
    <Shell />
  )
}
