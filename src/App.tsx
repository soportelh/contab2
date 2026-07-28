import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthGate } from '@/store/AuthStore'
import { AppStoreProvider } from '@/store/AppStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlanDeCuentasPage } from '@/pages/PlanDeCuentasPage'
import { LibroDiarioPage } from '@/pages/LibroDiarioPage'
import { VentasPage } from '@/pages/VentasPage'
import { ComprasPage } from '@/pages/ComprasPage'
import { ReportesPage } from '@/pages/ReportesPage'
import { EmpresaPage } from '@/pages/EmpresaPage'

export default function App() {
  return (
    <AuthGate>
      <AppStoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/plan-de-cuentas" element={<PlanDeCuentasPage />} />
              <Route path="/libro-diario" element={<LibroDiarioPage />} />
              <Route path="/ventas" element={<VentasPage />} />
              <Route path="/compras" element={<ComprasPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/empresa" element={<EmpresaPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppStoreProvider>
    </AuthGate>
  )
}
