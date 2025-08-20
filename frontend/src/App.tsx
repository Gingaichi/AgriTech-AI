import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ChatPage from './pages/ChatPage'
import FieldManagement from './pages/FieldManagement'
import AIPredictions from './pages/AIPredictions'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/field-management" element={<FieldManagement />} />
          <Route path="/ai-predictions" element={<AIPredictions />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
