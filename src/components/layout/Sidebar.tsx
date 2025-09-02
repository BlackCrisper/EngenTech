import { 
  BarChart3, 
  Building2, 
  Cog, 
  Home, 
  MapPin, 
  Settings, 
  Users, 
  Wrench,
  X,
  FileText,
  PieChart,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/", resource: "dashboard" },
  { icon: BarChart3, label: "Dashboard Admin", href: "/admin-dashboard", resource: "admin-dashboard" },
  { icon: Building2, label: "Projetos", href: "/projects", resource: "projects" },
  { icon: MapPin, label: "Áreas", href: "/areas", resource: "areas" },
  { icon: Wrench, label: "Equipamentos", href: "/equipment", resource: "equipment" },
  { icon: Shield, label: "SESMT", href: "/sesmt", resource: "sesmt" },
  { icon: FileText, label: "Relatórios", href: "/reports", resource: "reports" },
  { icon: PieChart, label: "Relatórios Avançados", href: "/advanced-reports", resource: "reports" },
  { icon: Users, label: "Usuários", href: "/users", resource: "users" },
  { icon: Settings, label: "Configurações", href: "/settings", resource: "settings" },
];

// Itens de navegação específicos para operadores
const operatorNavigationItems = [
  { icon: Home, label: "Dashboard", href: "/", resource: "dashboard" },
  { icon: MapPin, label: "Áreas do Projeto", href: "/operator/areas", resource: "operator-areas" },
  { icon: FileText, label: "Relatórios", href: "/reports", resource: "reports" },
  { icon: PieChart, label: "Relatórios Avançados", href: "/advanced-reports", resource: "reports" },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:z-30",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  <rect x="9.5" y="9" width="1.5" height="3" fill="white"/>
                  <rect x="11.25" y="8" width="1.5" height="5" fill="white"/>
                  <rect x="13" y="7" width="1.5" height="7" fill="white"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">EngTech</h2>
                <p className="text-xs text-sidebar-foreground/70">Sistema Industrial</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {(() => {
              // Se for operador, mostrar apenas as opções de operador
              if (user?.role === 'operator') {
                return operatorNavigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      location.pathname === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground"
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ));
              }

              // Se for admin, mostrar apenas as opções de admin
              if (user?.role === 'admin') {
                const adminItems = [
                  { icon: BarChart3, label: "Dashboard Admin", href: "/admin-dashboard", resource: "admin-dashboard" },
                  { icon: Building2, label: "Projetos", href: "/projects", resource: "projects" },
                  { icon: Users, label: "Usuários", href: "/users", resource: "users" },
                  { icon: Settings, label: "Configurações", href: "/settings", resource: "settings" },
                ];

                return adminItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      location.pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                ));
              }

              // Para outros usuários, usar a lógica original
              return navigationItems.map((item) => {
                // Verificação específica para itens de admin
                if (item.label === "Dashboard Admin" || item.label === "Projetos" || item.label === "Configurações") {
                  if (user?.role !== 'admin') {
                    return null; // Ocultar o item
                  }
                }
                
                // Verificação específica para Usuários (apenas admin/supervisor)
                if (item.label === "Usuários") {
                  const isAdminOrSupervisor = user?.role === 'admin' || user?.role === 'supervisor';
                  if (!isAdminOrSupervisor) {
                    return null; // Ocultar o item
                  }
                }
                
                // Verificação específica para Equipamentos (apenas engenheiro+)
                if (item.label === "Equipamentos") {
                  const isEngineerOrAbove = ['engineer', 'supervisor', 'admin'].includes(user?.role || '');
                  if (!isEngineerOrAbove) {
                    return null; // Ocultar o item
                  }
                }
                
                // Verificação específica para SESMT (apenas segurança+)
                if (item.label === "SESMT") {
                  const isSecurityOrAbove = ['sesmt', 'supervisor', 'admin'].includes(user?.role || '');
                  if (!isSecurityOrAbove) {
                    return null; // Ocultar o item
                  }
                }
                
                // Verificação baseada apenas na role do usuário
                const userRole = user?.role || '';
                
                // Verificar se o usuário tem acesso baseado na role
                const hasAccess = () => {
                  switch (item.resource) {
                    case 'dashboard':
                      return true; // Todos podem acessar dashboard
                    case 'admin-dashboard':
                      return userRole === 'admin';
                    case 'projects':
                      return userRole === 'admin';
                    case 'areas':
                      return true; // Todos podem visualizar áreas
                    case 'equipment':
                      return ['engineer', 'supervisor', 'admin'].includes(userRole);
                    case 'sesmt':
                      return ['sesmt', 'supervisor', 'admin'].includes(userRole);
                    case 'reports':
                      return true; // Todos podem acessar relatórios
                    case 'users':
                      return ['supervisor', 'admin'].includes(userRole);
                    case 'settings':
                      return userRole === 'admin';
                    default:
                      return true;
                  }
                };
                
                if (!hasAccess()) {
                  return null;
                }
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      location.pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              });
            })()}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/60 text-center">
              <p>EngTech v1.0</p>
              <p>Mizu Cimentos</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};