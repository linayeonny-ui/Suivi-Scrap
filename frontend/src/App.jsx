import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ScanPage from './pages/ScanPage'
import AdminLogin from './pages/admin/Login'
import AdminLayout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import ScrapEntries from './pages/admin/ScrapEntries'
import QRCodes from './pages/admin/QRCodes'
import ReferenceData from './pages/admin/ReferenceData'
import WireMappings from './pages/admin/WireMappings'
import Users from './pages/admin/Users'
import OperatorCodes from './pages/admin/OperatorCodes'
import ExportPage from './pages/admin/ExportPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Operator scan route - no auth required */}
        <Route path="/scan/:code" element={<ScanPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scrap" element={<ScrapEntries />} />
          <Route path="qr-codes" element={<QRCodes />} />
          <Route path="reference" element={<ReferenceData />} />
          <Route path="wire-mappings" element={<WireMappings />} />
          <Route path="operator-codes" element={<OperatorCodes />} />
          <Route path="users" element={<Users />} />
          <Route path="export" element={<ExportPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
