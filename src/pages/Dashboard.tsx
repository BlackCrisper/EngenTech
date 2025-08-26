import { useEffect, useState } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Wrench 
} from "lucide-react";
import { dashboardService, DashboardMetrics } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão geral do progresso da obra em tempo real
            {metrics && (
              <span className="ml-2 text-xs">
                • Última atualização: {new Date(metrics.lastUpdated).toLocaleString('pt-BR')}
              </span>
            )}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Progresso Total"
            value={`${metrics?.progressTotal || 0}%`}
            subtitle="da obra concluída"
            icon={Activity}
            trend={{ value: 12, label: "este mês", isPositive: true }}
          />
          
          <MetricCard
            title="Equipamentos"
            value={metrics?.equipmentCount || 0}
            subtitle="cadastrados no sistema"
            icon={Wrench}
            trend={{ value: 8, label: "novos este mês", isPositive: true }}
          />
          
          <MetricCard
            title="Tarefas Concluídas"
            value={metrics?.completedTasks || 0}
            subtitle="de tarefas totais"
            icon={CheckCircle}
            trend={{ value: 15, label: "esta semana", isPositive: true }}
          />
          
          <MetricCard
            title="Áreas Ativas"
            value={metrics?.activeAreas || 0}
            subtitle="em progresso"
            icon={Clock}
            trend={{ value: 2, label: "novas áreas", isPositive: true }}
          />
          
          <MetricCard
            title="Alertas"
            value={metrics?.alerts || 0}
            subtitle="requerem atenção"
            icon={AlertTriangle}
            trend={{ value: 50, label: "redução", isPositive: true }}
          />
          
          <MetricCard
            title="Equipe Ativa"
            value={metrics?.activeTeam || 0}
            subtitle="técnicos trabalhando"
            icon={Users}
          />
        </div>

        {/* Progress Chart */}
        <ProgressChart />

        {/* Additional Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-card-foreground mb-2">
              Próximas Atividades
            </h3>
            <div className="space-y-3 text-sm">
              {activitiesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.progress >= 90 ? 'bg-success' :
                      activity.progress >= 70 ? 'bg-primary' :
                      activity.progress >= 50 ? 'bg-warning' : 'bg-destructive'
                    }`} />
                    <span className="text-muted-foreground">
                      {activity.equipmentTag} - {activity.discipline}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(activity.lastUpdated).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Nenhuma atividade pendente</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold text-card-foreground mb-2">
              Status do Sistema
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Última atualização</span>
                <span className="text-success font-medium">
                  {statusLoading ? 'Verificando...' : 'Agora mesmo'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sistema</span>
                <span className="text-success font-medium">
                  {systemStatus?.system || 'Online'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Banco de Dados</span>
                <span className="text-success font-medium">
                  {systemStatus?.database || 'Online'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Usuários ativos</span>
                <span className="font-medium">
                  {systemStatus?.activeUsers || metrics?.activeTeam || 0}
                </span>
              </div>
              {systemStatus?.uptime && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tempo ativo</span>
                  <span className="font-medium">
                    {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;