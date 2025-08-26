import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Wrench,
  Calendar,
  Settings
} from "lucide-react";
import { dashboardService, DashboardMetrics } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  // Buscar métricas do dashboard
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardService.getMetrics,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar próximas atividades
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['upcoming-activities'],
    queryFn: dashboardService.getUpcomingActivities,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  // Buscar status do sistema
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: dashboardService.getSystemStatus,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar progresso por área
  const { data: progressByArea, isLoading: areaProgressLoading } = useQuery({
    queryKey: ['progress-by-area'],
    queryFn: dashboardService.getProgressByArea,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });



  if (metricsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Carregando dados em tempo real...
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (metricsError) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
            <p className="text-muted-foreground">
              Erro ao carregar dados do sistema
            </p>
          </div>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">
              Não foi possível conectar ao banco de dados. Verifique se o servidor está rodando.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calcular tendências baseadas nos dados
  const getTrendValue = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard Executivo</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Visão geral do progresso da obra em tempo real
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Última atualização</div>
              <div className="text-sm font-medium">
                {metrics ? new Date(metrics.lastUpdated).toLocaleString('pt-BR') : 'Carregando...'}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Progresso Total"
            value={`${metrics?.progressTotal || 0}%`}
            subtitle="da obra concluída"
            icon={Activity}
            trend={{ 
              value: metrics?.recentUpdates || 0, 
              label: "atualizações recentes", 
              isPositive: true 
            }}
          />
          
          <MetricCard
            title="Equipamentos"
            value={metrics?.equipmentCount || 0}
            subtitle={`${metrics?.activeEquipment || 0} ativos`}
            icon={Wrench}
            trend={{ 
              value: metrics?.maintenanceEquipment || 0, 
              label: "em manutenção", 
              isPositive: false 
            }}
          />
          
          <MetricCard
            title="Tarefas Concluídas"
            value={metrics?.completedTasks || 0}
            subtitle={`de ${metrics?.totalTasks || 0} totais`}
            icon={CheckCircle}
            trend={{ 
              value: getTrendValue(metrics?.completedTasks || 0, metrics?.totalTasks || 1), 
              label: "taxa de conclusão", 
              isPositive: true 
            }}
          />
          
          <MetricCard
            title="Áreas Ativas"
            value={metrics?.activeAreas || 0}
            subtitle={`de ${metrics?.totalAreas || 0} totais`}
            icon={Activity}
            trend={{ 
              value: metrics?.completedAreas || 0, 
              label: "concluídas", 
              isPositive: true 
            }}
          />
          
          <MetricCard
            title="Alertas"
            value={metrics?.alerts || 0}
            subtitle={`${metrics?.overdueTasks || 0} vencidas`}
            icon={AlertTriangle}
            trend={{ 
              value: metrics?.lowProgressTasks || 0, 
              label: "baixo progresso", 
              isPositive: false 
            }}
          />
          
          <MetricCard
            title="Equipe Ativa"
            value={metrics?.activeTeam || 0}
            subtitle={`de ${metrics?.totalUsers || 0} usuários`}
            icon={Users}
            trend={{ 
              value: metrics?.recentUpdates || 0, 
              label: "atividades recentes", 
              isPositive: true 
            }}
          />
        </div>



        {/* Progresso por Área */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Progresso por Área</h2>
            <p className="text-muted-foreground mt-1">Acompanhe o progresso detalhado de cada disciplina</p>
          </div>
          
          <div className="flex justify-center">
            {areaProgressLoading ? (
              <Card className="w-96 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="h-5 bg-muted animate-pulse rounded w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </CardContent>
              </Card>
            ) : progressByArea && progressByArea.length > 0 ? (
              progressByArea.map((area, index) => (
                <Card key={index} className="w-96 shadow-lg border-2 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{area.area}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Área de Produção</p>
                      </div>
                      <Badge 
                        variant={
                          area.areaStatus === 'completed' ? 'default' :
                          area.areaStatus === 'overdue' ? 'destructive' : 'secondary'
                        }
                        className="text-xs font-medium px-3 py-1"
                      >
                        {area.areaStatus === 'completed' ? 'Concluído' :
                         area.areaStatus === 'overdue' ? 'Atrasado' : 'No Prazo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    {/* Elétrica */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Elétrica</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{area.disciplines.electrical.progress}%</span>
                      </div>
                      <Progress value={area.disciplines.electrical.progress} className="h-3" />
                    </div>
                    
                    {/* Mecânica */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Mecânica</span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{area.disciplines.mechanical.progress}%</span>
                      </div>
                      <Progress value={area.disciplines.mechanical.progress} className="h-3" />
                    </div>
                    
                    {/* Civil */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">Civil</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{area.disciplines.civil.progress}%</span>
                      </div>
                      <Progress value={area.disciplines.civil.progress} className="h-3" />
                    </div>
                    
                    {/* Progresso Total */}
                    <div className="space-y-2 pt-4 border-t border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-foreground">Progresso Total</span>
                        <span className="text-lg font-bold text-primary">{area.totalProgress}%</span>
                      </div>
                      <Progress value={area.totalProgress} className="h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="w-96 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground mb-2">
                    <Activity className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-muted-foreground">Nenhuma área com dados disponível</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione áreas e tarefas para ver o progresso</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;