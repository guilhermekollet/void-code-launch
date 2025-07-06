
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EmailConfirmation from "./pages/EmailConfirmation";
import Dashboard from "./pages/Dashboard";
import Transacoes from "./pages/Transacoes";
import Cartoes from "./pages/Cartoes";
import Recorrentes from "./pages/Recorrentes";
import Categorias from "./pages/Categorias";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Assinatura from "./pages/Assinatura";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/email-confirmation" element={<EmailConfirmation />} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/transacoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Transacoes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/cartoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Cartoes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/recorrentes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Recorrentes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/categorias"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Categorias />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Relatorios />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Configuracoes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/assinatura"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Assinatura />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </Router>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
