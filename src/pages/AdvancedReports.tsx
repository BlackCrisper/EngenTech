import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Clock, 
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
  ChevronsRight,
  AlertTriangle
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

const COLORS = ['#333333', '#666666', '#999999', '#CCCCCC', '#E5E5E5', '#F5F5F5'];


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

  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: ['reports-by-equipment'],
    queryFn: reportsService.getByEquipment
  });

  const { data: userProductivity, isLoading: productivityLoading } = useQuery({
    queryKey: ['reports-user-productivity'],
    queryFn: reportsService.getUserProductivity
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



  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-gray-900 text-white';
      case 'high': return 'bg-gray-700 text-white';
      case 'normal': return 'bg-gray-500 text-white';
      case 'low': return 'bg-gray-300 text-gray-800';
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
    if (progress >= 100) return 'text-gray-900';
    if (progress >= 75) return 'text-gray-800';
    if (progress >= 50) return 'text-gray-700';
    if (progress >= 25) return 'text-gray-600';
    return 'text-gray-500';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 100) return '#333333';
    if (progress >= 75) return '#666666';
    if (progress >= 50) return '#999999';
    if (progress >= 25) return '#CCCCCC';
    return '#E5E5E5';
  };

  const handleExportReport = (type: string) => {
    // Implementar exportação de relatórios
    console.log(`Exportando relatório: ${type}`);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="equipment">Por Equipamento</TabsTrigger>
            <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {overviewLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
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
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   <Card className="border-l-4 border-l-gray-600 bg-gradient-to-r from-gray-50 to-white">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
                       <Target className="h-4 w-4 text-gray-600" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold text-gray-700">{equipmentData?.length || 0}</div>
                       <p className="text-xs text-muted-foreground">
                         equipamentos no projeto
                       </p>
                     </CardContent>
                   </Card>

                   <Card className="border-l-4 border-l-gray-700 bg-gradient-to-r from-gray-50 to-white">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Equipamentos 100%</CardTitle>
                       <CheckCircle className="h-4 w-4 text-gray-700" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold text-gray-800">
                         {equipmentData?.filter((equipment: any) => equipment.averageProgress >= 100).length || 0}
                       </div>
                       <p className="text-xs text-muted-foreground">
                         com progresso completo
                       </p>
                     </CardContent>
                   </Card>

                   <Card className="border-l-4 border-l-gray-800 bg-gradient-to-r from-gray-50 to-white">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                       <TrendingUp className="h-4 w-4 text-gray-800" />
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold text-gray-900">{progressOverview.averageProgress}%</div>
                       <Progress value={progressOverview.averageProgress} className="mt-2" />
                     </CardContent>
                   </Card>


                 </div>

                {/* Progresso por Tipo de Tarefa */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-gray-700" />
                      Progresso por Tipo de Tarefa
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Comparação do progresso entre diferentes tipos de atividades
                    </p>
                  </CardHeader>
                                     <CardContent>
                     <div className="space-y-8">
                       {/* Gráfico de Barras */}
                       <div>
                         <div className="h-80 bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-100">
                           <ResponsiveContainer width="100%" height="100%">
                             <BarChart
                               data={[
                                 {
                                   name: 'Civil',
                                   progress: progressOverview?.civilProgress || 0,
                                   tasks: progressOverview?.civilTasks || 0,
                                   completed: progressOverview?.civilCompleted || 0
                                 },
                                 {
                                   name: 'Elétrica',
                                   progress: progressOverview?.electricalProgress || 0,
                                   tasks: progressOverview?.electricalTasks || 0,
                                   completed: progressOverview?.electricalCompleted || 0
                                 },
                                 {
                                   name: 'Mecânica',
                                   progress: progressOverview?.mechanicalProgress || 0,
                                   tasks: progressOverview?.mechanicalTasks || 0,
                                   completed: progressOverview?.mechanicalCompleted || 0
                                 }
                               ]}
                               margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                             >
                               <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                               <XAxis 
                                 dataKey="name" 
                                 tick={{ fill: '#6B7280', fontSize: 12 }}
                                 axisLine={{ stroke: '#E5E7EB' }}
                               />
                               <YAxis 
                                 tick={{ fill: '#6B7280', fontSize: 12 }}
                                 axisLine={{ stroke: '#E5E7EB' }}
                                 tickLine={{ stroke: '#E5E7EB' }}
                               />
                               <Tooltip 
                                 formatter={(value, name) => [value + '%', 'Progresso']}
                                 labelFormatter={(label) => `${label}`}
                                 contentStyle={{
                                   backgroundColor: '#FFFFFF',
                                   border: '1px solid #E5E7EB',
                                   borderRadius: '8px',
                                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                 }}
                               />
                               <Bar dataKey="progress" fill="#666666" radius={[4, 4, 0, 0]} />
                             </BarChart>
                           </ResponsiveContainer>
                         </div>
                       </div>
                       
                       {/* Cards de detalhamento monocromáticos */}
                       <div>
                         <div className="text-sm text-muted-foreground mb-6">
                           <h4 className="font-semibold text-foreground text-lg">Detalhamento por Tipo</h4>
                           <p className="text-xs text-muted-foreground mt-1">
                             Análise detalhada de cada área
                           </p>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {/* Civil */}
                           <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-gray-600 rounded-lg">
                                   <Building className="h-5 w-5 text-white" />
                                 </div>
                                 <div>
                                   <span className="font-bold text-gray-900 text-lg">Civil</span>
                                   <div className="text-xs text-gray-600">Infraestrutura</div>
                                 </div>
                               </div>
                               <Badge className="bg-gray-600 text-white font-semibold">
                                 {progressOverview?.civilTasks || 0}
                               </Badge>
                             </div>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-gray-700">Progresso:</span>
                                 <span className="font-bold text-gray-900 text-xl">{progressOverview?.civilProgress || 0}%</span>
                               </div>
                               <Progress 
                                 value={progressOverview?.civilProgress || 0} 
                                 className="h-3 bg-gray-200" 
                                 style={{
                                   '--progress-background': '#666666'
                                 } as React.CSSProperties}
                               />
                               <div className="grid grid-cols-2 gap-2 mt-3">
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Tarefas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.civilTasks || 0}</div>
                                 </div>
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Concluídas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.civilCompleted || 0}</div>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Elétrica */}
                           <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-gray-700 rounded-lg">
                                   <Zap className="h-5 w-5 text-white" />
                                 </div>
                                 <div>
                                   <span className="font-bold text-gray-900 text-lg">Elétrica</span>
                                   <div className="text-xs text-gray-600">Sistemas Elétricos</div>
                                 </div>
                               </div>
                               <Badge className="bg-gray-700 text-white font-semibold">
                                 {progressOverview?.electricalTasks || 0}
                               </Badge>
                             </div>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-gray-700">Progresso:</span>
                                 <span className="font-bold text-gray-900 text-xl">{progressOverview?.electricalProgress || 0}%</span>
                               </div>
                               <Progress 
                                 value={progressOverview?.electricalProgress || 0} 
                                 className="h-3 bg-gray-200"
                                 style={{
                                   '--progress-background': '#666666'
                                 } as React.CSSProperties}
                               />
                               <div className="grid grid-cols-2 gap-2 mt-3">
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Tarefas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.electricalTasks || 0}</div>
                                 </div>
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Concluídas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.electricalCompleted || 0}</div>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Mecânica */}
                           <div className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                             <div className="flex items-center justify-between mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="p-2 bg-gray-800 rounded-lg">
                                   <Wrench className="h-5 w-5 text-white" />
                                 </div>
                                 <div>
                                   <span className="font-bold text-gray-900 text-lg">Mecânica</span>
                                   <div className="text-xs text-gray-600">Sistemas Mecânicos</div>
                                 </div>
                               </div>
                               <Badge className="bg-gray-800 text-white font-semibold">
                                 {progressOverview?.mechanicalTasks || 0}
                               </Badge>
                             </div>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <span className="text-sm font-medium text-gray-700">Progresso:</span>
                                 <span className="font-bold text-gray-900 text-xl">{progressOverview?.mechanicalProgress || 0}%</span>
                               </div>
                               <Progress 
                                 value={progressOverview?.mechanicalProgress || 0} 
                                 className="h-3 bg-gray-200"
                                 style={{
                                   '--progress-background': '#666666'
                                 } as React.CSSProperties}
                               />
                               <div className="grid grid-cols-2 gap-2 mt-3">
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Tarefas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.mechanicalTasks || 0}</div>
                                 </div>
                                 <div className="bg-gray-100 rounded-lg p-2 text-center">
                                   <div className="text-xs text-gray-600">Concluídas</div>
                                   <div className="font-bold text-gray-900">{progressOverview?.mechanicalCompleted || 0}</div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </CardContent>
                </Card>

                
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
                           {uniqueAreas.map((area: string) => (
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
                           <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                             <div className="font-semibold text-gray-700">{equipment.totalTasks}</div>
                             <div className="text-xs text-muted-foreground">Tarefas</div>
                           </div>
                           <div className="text-center p-2 bg-gray-100 rounded border border-gray-300">
                             <div className="font-semibold text-gray-800">{equipment.completedTasks}</div>
                             <div className="text-xs text-muted-foreground">Concluídas</div>
                           </div>
                         </div>
                         
                         {/* Horas */}
                         <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                           <div className="text-sm font-medium text-gray-700">
                             {equipment.totalActualHours}h / {equipment.totalEstimatedHours}h
                           </div>
                           <div className="text-xs text-gray-600">Horas Trabalhadas</div>
                         </div>
                        
                                                 {/* Status Badge */}
                         <div className="flex justify-center">
                           {equipment.averageProgress >= 100 ? (
                             <Badge className="bg-green-100 text-green-800 border-green-200">
                               <CheckCircle className="h-3 w-3 mr-1" />
                               Concluído
                             </Badge>
                           ) : equipment.averageProgress >= 75 ? (
                             <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                               <TrendingUp className="h-3 w-3 mr-1" />
                               Alto Progresso
                             </Badge>
                           ) : equipment.averageProgress >= 25 ? (
                             <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                               <Clock className="h-3 w-3 mr-1" />
                               Em Progresso
                             </Badge>
                           ) : (
                             <Badge className="bg-red-100 text-red-800 border-red-200">
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
                           <div className="text-2xl font-bold text-gray-800">{user.totalUpdates}</div>
                           <p className="text-sm text-muted-foreground">atualizações</p>
                         </div>
                      </div>
                      
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                         <div className="p-2 bg-gray-50 rounded border border-gray-200">
                           <span className="text-muted-foreground">Tarefas Atualizadas:</span>
                           <div className="font-medium text-gray-700">{user.tasksUpdated}</div>
                         </div>
                         <div className="p-2 bg-gray-100 rounded border border-gray-300">
                           <span className="text-muted-foreground">Progresso Adicionado:</span>
                           <div className="font-medium text-gray-800">{user.totalProgressAdded}%</div>
                         </div>
                         <div className="p-2 bg-gray-50 rounded border border-gray-200">
                           <span className="text-muted-foreground">Média por Update:</span>
                           <div className="font-medium text-gray-700">{user.averageProgressPerUpdate}%</div>
                         </div>
                         <div className="p-2 bg-gray-100 rounded border border-gray-300">
                           <span className="text-muted-foreground">Updates com Fotos:</span>
                           <div className="font-medium text-gray-800">{user.updatesWithPhotos}</div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </TabsContent>


        </Tabs>
      </div>
    </MainLayout>
  );
}
