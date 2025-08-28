import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Plus, 
  Eye, 
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'pending';
  userCount: number;
  createdBy: string;
  createdAt: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  totalUsers: number;
  completedProjects: number;
}

const AdminDashboard = () => {
  // Buscar projetos
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => api.get('/projects').then(res => res.data),
    refetchInterval: 30000,
  });

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/projects/stats').then(res => res.data),
    refetchInterval: 60000,
  });

  if (projectsLoading || statsLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard Admin</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Gerenciamento de projetos e usuários
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Skeleton className="h-4 w-24" />
                  </CardTitle>
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (projectsError) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="border-b border-border/50 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard Admin</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Gerenciamento de projetos e usuários
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive font-medium">Erro ao carregar dados</p>
            </div>
            <p className="text-destructive/80 mt-2">
              Não foi possível carregar os projetos. Tente novamente.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const projectStats: ProjectStats = stats || {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p: Project) => p.status === 'active').length || 0,
    totalUsers: projects?.reduce((acc: number, p: Project) => acc + p.userCount, 0) || 0,
    completedProjects: projects?.filter((p: Project) => p.status === 'completed').length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Concluído</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard Admin</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Gerenciamento de projetos e usuários
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/projects">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/users">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {projectStats.activeProjects} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Distribuídos nos projetos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">
                Finalizados com sucesso
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Projetos</h2>
            <Button asChild size="sm">
              <Link to="/projects">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Projeto
              </Link>
            </Button>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project: Project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Usuários:</span>
                        <span className="font-medium">{project.userCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Início:</span>
                        <span>{formatDate(project.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fim:</span>
                        <span>{formatDate(project.endDate)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/projects/${project.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/projects/${project.id}/users`}>
                          <Users className="h-4 w-4 mr-2" />
                          Usuários
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comece criando seu primeiro projeto para gerenciar usuários e recursos.
                </p>
                <Button asChild>
                  <Link to="/projects">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Projeto
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
