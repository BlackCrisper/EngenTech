import React, { useState, useMemo } from 'react';
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
  Building,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const ITEMS_PER_PAGE = 12;

export default function AdvancedReports() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para filtros e paginação
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filtrar e paginar dados de equipamentos
  const filteredEquipmentData = useMemo(() => {
    if (!equipmentData) return [];
    
    let filtered = equipmentData;
    
    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((equipment: any) =>
        equipment.equipmentTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.areaName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
         // Filtro por área
     if (areaFilter && areaFilter !== 'all') {
       filtered = filtered.filter((equipment: any) => equipment.areaName === areaFilter);
     }
     
     // Filtro por progresso
     if (progressFilter && progressFilter !== 'all') {
       switch (progressFilter) {
         case 'completed':
           filtered = filtered.filter((equipment: any) => equipment.averageProgress >= 100);
           break;
         case 'in-progress':
           filtered = filtered.filter((equipment: any) => equipment.averageProgress > 0 && equipment.averageProgress < 100);
           break;
         case 'pending':
           filtered = filtered.filter((equipment: any) => equipment.averageProgress === 0);
           break;
         case 'high-progress':
           filtered = filtered.filter((equipment: any) => equipment.averageProgress >= 75);
           break;
         case 'low-progress':
           filtered = filtered.filter((equipment: any) => equipment.averageProgress < 25);
           break;
       }
     }
    
    return filtered;
  }, [equipmentData, searchTerm, areaFilter, progressFilter]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredEquipmentData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEquipmentData = filteredEquipmentData.slice(startIndex, endIndex);

  // Obter áreas únicas para o filtro
  const uniqueAreas = useMemo(() => {
    if (!equipmentData) return [];
    return [...new Set(equipmentData.map((equipment: any) => equipment.areaName))].sort();
  }, [equipmentData]);

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

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return '#10B981';
    if (progress >= 75) return '#3B82F6';
    if (progress >= 50) return '#F59E0B';
    if (progress >= 25) return '#F97316';
    return '#EF4444';
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

  // Funções de paginação
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAreaFilter('all');
    setProgressFilter('all');
    setCurrentPage(1);
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : equipmentData ? (
              <>
                {/* Filtros e Controles */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtros e Busca
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Busca */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar equipamento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                                             {/* Filtro por Área */}
                       <Select value={areaFilter} onValueChange={setAreaFilter}>
                         <SelectTrigger>
                           <SelectValue placeholder="Todas as áreas" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todas as áreas</SelectItem>
                           {uniqueAreas.map((area) => (
                             <SelectItem key={area} value={area}>{area}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       
                       {/* Filtro por Progresso */}
                       <Select value={progressFilter} onValueChange={setProgressFilter}>
                         <SelectTrigger>
                           <SelectValue placeholder="Todos os status" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos os status</SelectItem>
                           <SelectItem value="completed">Concluídos (100%)</SelectItem>
                           <SelectItem value="high-progress">Alto Progresso (≥75%)</SelectItem>
                           <SelectItem value="in-progress">Em Progresso (1-99%)</SelectItem>
                           <SelectItem value="low-progress">Baixo Progresso (&lt;25%)</SelectItem>
                           <SelectItem value="pending">Pendentes (0%)</SelectItem>
                         </SelectContent>
                       </Select>
                      
                      {/* Botão Reset */}
                      <Button 
                        variant="outline" 
                        onClick={resetFilters}
                        className="w-full"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                    
                    {/* Estatísticas dos filtros */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>
                          Mostrando {paginatedEquipmentData.length} de {filteredEquipmentData.length} equipamentos
                        </span>
                        <span>
                          Página {currentPage} de {totalPages}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grid de Equipamentos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedEquipmentData.map((equipment: any) => (
                    <Card key={equipment.equipmentTag} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold truncate">
                              {equipment.equipmentTag}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate">
                              {equipment.equipmentName}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {equipment.areaName}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Progresso Principal */}
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getProgressColor(equipment.averageProgress)}`}>
                            {equipment.averageProgress}%
                          </div>
                          <Progress 
                            value={equipment.averageProgress} 
                            className="mt-2 h-2"
                            style={{
                              '--progress-background': getProgressBarColor(equipment.averageProgress)
                            } as React.CSSProperties}
                          />
                        </div>
                        
                        {/* Estatísticas */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-blue-600">{equipment.totalTasks}</div>
                            <div className="text-xs text-muted-foreground">Tarefas</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-semibold text-green-600">{equipment.completedTasks}</div>
                            <div className="text-xs text-muted-foreground">Concluídas</div>
                          </div>
                        </div>
                        
                        {/* Horas */}
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-sm font-medium text-blue-800">
                            {equipment.totalActualHours}h / {equipment.totalEstimatedHours}h
                          </div>
                          <div className="text-xs text-blue-600">Horas Trabalhadas</div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex justify-center">
                          {equipment.averageProgress >= 100 ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Concluído
                            </Badge>
                          ) : equipment.averageProgress >= 75 ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Alto Progresso
                            </Badge>
                          ) : equipment.averageProgress >= 25 ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Em Progresso
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Baixo Progresso
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <Card className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredEquipmentData.length)} de {filteredEquipmentData.length} equipamentos
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                                                     <div className="flex items-center gap-1">
                             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                               const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                               return (
                                 <Button
                                   key={`page-${page}`}
                                   variant={currentPage === page ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => goToPage(page)}
                                   className="w-8 h-8"
                                 >
                                   {page}
                                 </Button>
                               );
                             })}
                           </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
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
