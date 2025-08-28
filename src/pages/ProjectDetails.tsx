import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  MapPin, 
  Wrench, 
  Calendar,
  ArrowLeft,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/services/api";
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
  totalUsers: number;
  totalAreas: number;
  totalEquipment: number;
  totalTasks: number;
}

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Buscar detalhes do projeto
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(res => res.data.data),
    enabled: !!projectId,
  });

  // Buscar estatísticas do projeto
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => api.get(`/projects/${projectId}/stats`).then(res => res.data.data),
    enabled: !!projectId,
  });

  if (projectLoading || statsLoading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (projectError) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
          
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">
              Erro ao carregar projeto. Tente novamente.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const projectData: Project = project;
  const projectStats: ProjectStats = stats || {
    totalUsers: projectData?.userCount || 0,
    totalAreas: 0,
    totalEquipment: 0,
    totalTasks: 0,
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  {projectData.name}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {projectData.description}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {getStatusBadge(projectData.status)}
              <Button asChild>
                <Link to={`/projects/${projectId}/users`}>
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
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Ativos no projeto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Áreas</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalAreas}</div>
              <p className="text-xs text-muted-foreground">
                Áreas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipamentos</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalEquipment}</div>
              <p className="text-xs text-muted-foreground">
                Equipamentos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                Tarefas cadastradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Project Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(projectData.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data de Início:</span>
                  <span>{formatDate(projectData.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data de Fim:</span>
                  <span>{formatDate(projectData.endDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Criado por:</span>
                  <span>{projectData.createdBy}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data de Criação:</span>
                  <span>{formatDate(projectData.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to={`/projects/${projectId}/users`}>
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/areas">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Áreas
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/equipment">
                  <Wrench className="h-4 w-4 mr-2" />
                  Ver Equipamentos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/reports">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectDetails;
