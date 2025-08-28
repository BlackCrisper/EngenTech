import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle,
  Download,
  FileText,
  Calendar,
  Target,
  CheckCircle,
  XCircle,
  Zap,
  Wrench,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MainLayout } from '@/components/layout/MainLayout';
import { reportsService } from '@/services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const DISCIPLINE_COLORS = {
  electrical: '#3B82F6',
  mechanical: '#F59E0B', 
  civil: '#10B981'
};

const DISCIPLINE_ICONS = {
  electrical: Zap,
  mechanical: Wrench,
  civil: Building
};

export default function AdvancedReports() {
  const [activeTab, setActiveTab] = useState('overview');

  // Buscar dados dos relatórios
  const { data: progressOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['reports-progress-overview'],
    queryFn: reportsService.getProgressOverview
  });

  const { data: disciplineData, isLoading: disciplineLoading } = useQuery({
    queryKey: ['reports-by-discipline'],
    queryFn: reportsService.getByDiscipline
  });

  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ['reports-by-equipment'],
    queryFn: reportsService.getByEquipment
  });

  const { data: userProductivity, isLoading: productivityLoading } = useQuery({
    queryKey: ['reports-user-productivity'],
    queryFn: reportsService.getUserProductivity
  });

  const { data: overdueTasks, isLoading: overdueLoading } = useQuery({
    queryKey: ['reports-overdue-tasks'],
    queryFn: reportsService.getOverdueTasks
  });

  const getDisciplineLabel = (discipline: string) => {
    switch (discipline) {
      case 'electrical': return 'Elétrica';
      case 'mechanical': return 'Mecânica';
      case 'civil': return 'Civil';
      default: return discipline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const handleExportReport = (type: string) => {
    // Implementar exportação de relatórios
    console.log(`Exportando relatório: ${type}`);
  };

  // Preparar dados para gráficos de pizza por disciplina
  const prepareDisciplinePieData = (discipline: any) => {
    const completed = discipline.completedTasks;
    const inProgress = discipline.totalTasks - discipline.completedTasks - (discipline.pendingTasks || 0);
    const pending = discipline.pendingTasks || 0;
    
    return [
      { name: 'Concluídas', value: completed, color: '#10B981' },
      { name: 'Em Progresso', value: inProgress, color: '#3B82F6' },
      { name: 'Pendentes', value: pending, color: '#6B7280' }
    ].filter(item => item.value > 0);
  };

  // Preparar dados para gráfico geral de status
  const prepareOverallStatusData = () => {
    if (!progressOverview) return [];
    
    return [
      { name: 'Concluídas', value: progressOverview.completedTasks, color: '#10B981' },
      { name: 'Em Progresso', value: progressOverview.inProgressTasks, color: '#3B82F6' },
      { name: 'Pendentes', value: progressOverview.pendingTasks, color: '#6B7280' }
    ].filter(item => item.value > 0);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
            <p className="text-muted-foreground">
              Análise detalhada do progresso e produtividade do projeto
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportReport('all')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Todos
            </Button>
            <Button variant="outline" onClick={() => handleExportReport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="discipline">Por Disciplina</TabsTrigger>
            <TabsTrigger value="equipment">Por Equipamento</TabsTrigger>
            <TabsTrigger value="productivity">Produtividade</TabsTrigger>
            <TabsTrigger value="overdue">Tarefas Vencidas</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {overviewLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : progressOverview ? (
              <>
                {/* Cards de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
                      <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{progressOverview.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">
                        {progressOverview.completionRate}% concluídas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{progressOverview.completedTasks}</div>
                      <p className="text-xs text-muted-foreground">
                        {progressOverview.inProgressTasks} em progresso
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{progressOverview.averageProgress}%</div>
                      <Progress value={progressOverview.averageProgress} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Horas Trabalhadas</CardTitle>
                      <Clock className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{progressOverview.totalActualHours}h</div>
                      <p className="text-xs text-muted-foreground">
                        de {progressOverview.totalEstimatedHours}h estimadas
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico geral de status das tarefas */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-blue-600" />
                      Status Geral das Tarefas
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Distribuição geral do status de todas as tarefas do projeto
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Gráfico de Pizza */}
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={prepareOverallStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent, value }) => 
                                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                              }
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prepareOverallStatusData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [value, name]}
                              labelFormatter={(label) => `${label}`}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Legenda e estatísticas */}
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          <h4 className="font-semibold text-foreground mb-3">Resumo do Status</h4>
                        </div>
                        
                        {prepareOverallStatusData().map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{item.value}</div>
                              <div className="text-xs text-muted-foreground">
                                {((item.value / progressOverview.totalTasks) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxa de Conclusão:</span>
                            <span className="font-semibold">{progressOverview.completionRate}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Eficiência:</span>
                            <span className="font-semibold">
                              {progressOverview.totalEstimatedHours > 0 
                                ? ((progressOverview.totalActualHours / progressOverview.totalEstimatedHours) * 100).toFixed(1)
                                : 0
                              }%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráficos por disciplina */}
                {disciplineData && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Status por Disciplina</h3>
                      <p className="text-sm text-muted-foreground">
                        Análise detalhada do progresso de cada disciplina
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {disciplineData.map((discipline: any) => {
                        const IconComponent = DISCIPLINE_ICONS[discipline.discipline as keyof typeof DISCIPLINE_ICONS];
                        const pieData = prepareDisciplinePieData(discipline);
                        
                        return (
                          <Card key={discipline.discipline} className="shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader className="pb-4">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <IconComponent className="h-5 w-5" style={{ color: DISCIPLINE_COLORS[discipline.discipline as keyof typeof DISCIPLINE_COLORS] }} />
                                {getDisciplineLabel(discipline.discipline)}
                              </CardTitle>
                              <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold" style={{ color: DISCIPLINE_COLORS[discipline.discipline as keyof typeof DISCIPLINE_COLORS] }}>
                                  {discipline.averageProgress}%
                                </span>
                                <Badge variant="outline">
                                  {discipline.totalTasks} tarefas
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {/* Gráfico de Pizza */}
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => 
                                        percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''
                                      }
                                      outerRadius={60}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value, name) => [value, name]}
                                      labelFormatter={(label) => `${label}`}
                                    />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Estatísticas detalhadas */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Concluídas:</span>
                                  <span className="font-medium text-green-600">{discipline.completedTasks}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Em Progresso:</span>
                                  <span className="font-medium text-blue-600">
                                    {discipline.totalTasks - discipline.completedTasks - (discipline.pendingTasks || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Pendentes:</span>
                                  <span className="font-medium text-gray-600">{discipline.pendingTasks || 0}</span>
                                </div>
                                <div className="pt-2 border-t">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Horas:</span>
                                    <span className="font-medium">
                                      {discipline.totalActualHours}h / {discipline.totalEstimatedHours}h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </TabsContent>

          {/* Por Disciplina */}
          <TabsContent value="discipline" className="space-y-6">
            {disciplineLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : disciplineData ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso por Disciplina</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={disciplineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="discipline" tickFormatter={getDisciplineLabel} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="averageProgress" fill="#3B82F6" name="Progresso Médio (%)" />
                        <Bar dataKey="completionRate" fill="#10B981" name="Taxa de Conclusão (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {disciplineData.map((discipline: any) => (
                    <Card key={discipline.discipline}>
                      <CardHeader>
                        <CardTitle className="text-lg">{getDisciplineLabel(discipline.discipline)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progresso</span>
                            <span>{discipline.averageProgress}%</span>
                          </div>
                          <Progress value={discipline.averageProgress} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tarefas:</span>
                            <div className="font-medium">{discipline.totalTasks}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Concluídas:</span>
                            <div className="font-medium">{discipline.completedTasks}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-muted-foreground">Horas:</span>
                          <div className="font-medium">
                            {discipline.totalActualHours}h / {discipline.totalEstimatedHours}h
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* Por Equipamento */}
          <TabsContent value="equipment" className="space-y-6">
            {equipmentLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : equipmentData ? (
              <div className="space-y-4">
                {equipmentData.map((equipment: any) => (
                  <Card key={equipment.equipmentTag}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{equipment.equipmentTag}</h3>
                          <p className="text-sm text-muted-foreground">{equipment.equipmentName}</p>
                          <p className="text-xs text-muted-foreground">Área: {equipment.areaName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{equipment.averageProgress}%</div>
                          <p className="text-sm text-muted-foreground">
                            {equipment.completedTasks}/{equipment.totalTasks} tarefas
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progresso Geral</span>
                            <span>{equipment.averageProgress}%</span>
                          </div>
                          <Progress value={equipment.averageProgress} />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Tarefas:</span>
                            <div className="font-medium">{equipment.totalTasks}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Concluídas:</span>
                            <div className="font-medium">{equipment.completedTasks}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Horas:</span>
                            <div className="font-medium">{equipment.totalActualHours}h</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>

          {/* Produtividade */}
          <TabsContent value="productivity" className="space-y-6">
            {productivityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userProductivity ? (
              <div className="space-y-4">
                {userProductivity.map((user: any) => (
                  <Card key={user.userName}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{user.userName}</h3>
                          <Badge variant="outline">{user.role}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{user.totalUpdates}</div>
                          <p className="text-sm text-muted-foreground">atualizações</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tarefas Atualizadas:</span>
                          <div className="font-medium">{user.tasksUpdated}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progresso Adicionado:</span>
                          <div className="font-medium">{user.totalProgressAdded}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Média por Update:</span>
                          <div className="font-medium">{user.averageProgressPerUpdate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Updates com Fotos:</span>
                          <div className="font-medium">{user.updatesWithPhotos}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>

          {/* Tarefas Vencidas */}
          <TabsContent value="overdue" className="space-y-6">
            {overdueLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : overdueTasks ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Tarefas Vencidas ({overdueTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overdueTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma tarefa vencida!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {overdueTasks.map((task: any) => (
                          <Card key={task.id} className="border-red-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{task.taskName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {task.equipmentTag} - {task.equipmentName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-red-100 text-red-800">
                                    {task.daysOverdue} dias vencida
                                  </Badge>
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Disciplina:</span>
                                  <div className="font-medium">{getDisciplineLabel(task.discipline)}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Progresso:</span>
                                  <div className="font-medium">{task.currentProgress}%</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Vencimento:</span>
                                  <div className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</div>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Área:</span>
                                  <div className="font-medium">{task.areaName}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
