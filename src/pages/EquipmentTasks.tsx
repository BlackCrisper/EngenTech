import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Zap, 
  Wrench, 
  Building, 
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  History,
  Camera,
  Save,
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { tasksService, equipmentService, EquipmentTask, StandardTask } from '@/services/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  CreateGuard, 
  UpdateGuard, 
  DeleteGuard 
} from '@/components/auth/PermissionGuard';

export default function EquipmentTasks() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { canViewTasks, canManageTasks, getUserSector } = usePermissions();
  
  const [selectedTask, setSelectedTask] = useState<EquipmentTask | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
     const [filters, setFilters] = useState({
     discipline: 'all',
     status: 'all',
     priority: 'all'
   });
  const [progressData, setProgressData] = useState({
    currentProgress: 0,
    observations: '',
    actualHours: 0
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProgressWithPhotosDialogOpen, setIsProgressWithPhotosDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Mapeamento de setores para disciplinas
  const sectorToDisciplineMap: { [key: string]: string[] } = {
    'electrical': ['electrical'],
    'mechanical': ['mechanical'],
    'civil': ['civil'],
    'instrumentation': ['instrumentation'],
    'automation': ['automation'],
    'all': ['electrical', 'mechanical', 'civil', 'instrumentation', 'automation'],
    'other': ['electrical', 'mechanical', 'civil', 'instrumentation', 'automation']
  };

  // Obter disciplinas permitidas para o usuário atual
  const getUserAllowedDisciplines = (): string[] => {
    const userSector = getUserSector();
    return sectorToDisciplineMap[userSector] || sectorToDisciplineMap['other'];
  };

  // Buscar dados do equipamento
  const { data: equipment } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentService.getById(parseInt(equipmentId!)),
    enabled: !!equipmentId
  });

  // Buscar tarefas do equipamento
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['equipment-tasks', equipmentId, currentUser?.sector],
    queryFn: async () => {
      const allTasks = await tasksService.getEquipmentTasks(parseInt(equipmentId!));
      
      // Filtrar tarefas baseado no setor do usuário
      const allowedDisciplines = getUserAllowedDisciplines();
      const filteredTasks = allTasks.filter((task: EquipmentTask) => 
        allowedDisciplines.includes(task.discipline)
      );
      
      return filteredTasks;
    },
    enabled: !!equipmentId && !!currentUser
  });

  // Filtrar tarefas baseado nos filtros aplicados
  const getFilteredTasks = () => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    let filteredTasks = tasks;

    // Aplicar filtros de disciplina, status e prioridade
    filteredTasks = filteredTasks.filter((task: EquipmentTask) => {
      const matchesDiscipline = filters.discipline === 'all' || task.discipline === filters.discipline;
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      
      return matchesDiscipline && matchesStatus && matchesPriority;
    });

    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  // Buscar tarefas padrão
  const { data: standardTasks = [] } = useQuery({
    queryKey: ['standard-tasks', currentUser?.sector],
    queryFn: async () => {
      const allStandardTasks = await tasksService.getStandardTasks();
      
      // Filtrar tarefas padrão baseado no setor do usuário
      const allowedDisciplines = getUserAllowedDisciplines();
      const filteredStandardTasks = allStandardTasks.filter((task: StandardTask) => 
        allowedDisciplines.includes(task.discipline)
      );
      
      return filteredStandardTasks;
    },
    enabled: !!currentUser
  });

  // Gerar tarefas
  const generateTasksMutation = useMutation({
    mutationFn: (disciplines: string[]) => tasksService.generateTasks(parseInt(equipmentId!), disciplines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-tasks', equipmentId] });
      toast.success('Tarefas geradas com sucesso!');
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao gerar tarefas');
    }
  });

  // Criar tarefa personalizada
  const createCustomTaskMutation = useMutation({
    mutationFn: (taskData: any) => tasksService.createCustomTask(parseInt(equipmentId!), taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-tasks', equipmentId] });
      toast.success('Tarefa personalizada criada com sucesso!');
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar tarefa');
    }
  });

  // Atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: (data: any) => tasksService.updateTaskProgress(selectedTask!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-tasks', equipmentId] });
      toast.success('Progresso atualizado com sucesso!');
      setIsProgressDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar progresso');
    }
  });

  // Atualizar progresso com fotos
  const updateProgressWithPhotosMutation = useMutation({
    mutationFn: (formData: FormData) => tasksService.updateTaskProgressWithPhotos(selectedTask!.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-tasks', equipmentId] });
      toast.success('Progresso atualizado com fotos com sucesso!');
      setIsProgressWithPhotosDialogOpen(false);
      setSelectedTask(null);
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar progresso com fotos');
    }
  });

  // Deletar tarefa
  const deleteTaskMutation = useMutation({
    mutationFn: tasksService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-tasks', equipmentId] });
      toast.success('Tarefa deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar tarefa');
    }
  });

  const handleGenerateTasks = (disciplines: string[]) => {
    generateTasksMutation.mutate(disciplines);
  };

  const handleCreateCustomTask = (taskData: any) => {
    createCustomTaskMutation.mutate(taskData);
  };

  const handleUpdateProgress = () => {
    if (!selectedTask) return;
    updateProgressMutation.mutate(progressData);
  };

  const handleUpdateProgressWithPhotos = () => {
    if (!selectedTask) return;
    
    const formData = new FormData();
    formData.append('currentProgress', progressData.currentProgress.toString());
    formData.append('observations', progressData.observations);
    formData.append('actualHours', progressData.actualHours.toString());
    
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });
    
    updateProgressWithPhotosMutation.mutate(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteTask = (task: EquipmentTask) => {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${task.name}"?`)) {
      deleteTaskMutation.mutate(task.id);
    }
  };



  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'electrical': return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'mechanical': return <Wrench className="h-4 w-4 text-blue-500" />;
      case 'civil': return <Building className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getDisciplineLabel = (discipline: string) => {
    switch (discipline) {
      case 'electrical': return 'Elétrica';
      case 'mechanical': return 'Mecânica';
      case 'civil': return 'Civil';
      default: return discipline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in-progress': return 'Em Progresso';
      case 'pending': return 'Pendente';
      case 'on-hold': return 'Em Pausa';
      default: return status;
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

  const getSectorLabel = (sector: string) => {
    switch (sector) {
      case 'electrical': return 'Elétrica';
      case 'mechanical': return 'Mecânica';
      case 'civil': return 'Civil';
      case 'instrumentation': return 'Instrumentação';
      case 'automation': return 'Automação';
      default: return sector;
    }
  };

  if (!equipment) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando equipamento...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => navigate('/equipment')} className="mb-2">
              ← Voltar aos Equipamentos
            </Button>
            <h1 className="text-3xl font-bold">Tarefas do Equipamento</h1>
            <p className="text-muted-foreground">
              {equipment.equipmentTag} - {equipment.name}
            </p>
          </div>
          
          <CreateGuard resource="tasks">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerenciar Tarefas
                </Button>
              </DialogTrigger>
                             <DialogContent className="max-w-md">
                 <DialogHeader>
                   <DialogTitle>Gerenciar Tarefas</DialogTitle>
                   <DialogDescription>
                     Gere tarefas padrão ou crie tarefas personalizadas
                   </DialogDescription>
                 </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Gerar Tarefas Padrão</Label>
                    <div className="space-y-2 mt-2">
                      {getUserAllowedDisciplines().map((discipline) => (
                        <Button
                          key={discipline}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleGenerateTasks([discipline])}
                          disabled={generateTasksMutation.isPending}
                        >
                          {getDisciplineIcon(discipline)}
                          <span className="ml-2">Gerar Tarefas {getDisciplineLabel(discipline)}</span>
                        </Button>
                      ))}
                      {getUserAllowedDisciplines().length > 1 && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleGenerateTasks(getUserAllowedDisciplines())}
                          disabled={generateTasksMutation.isPending}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Gerar Todas as Tarefas Disponíveis
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label>Criar Tarefa Personalizada</Label>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        // Implementar criação de tarefa personalizada
                        toast.info('Funcionalidade em desenvolvimento');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa Personalizada
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CreateGuard>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            {/* Indicador de filtro por setor */}
            {currentUser?.sector && currentUser.sector !== 'all' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Mostrando apenas tarefas do setor: <strong>{getSectorLabel(currentUser.sector)}</strong>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Você só pode visualizar tarefas relacionadas ao seu setor de atuação.
                </p>
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Disciplina</Label>
                <Select value={filters.discipline} onValueChange={(value) => setFilters({...filters, discipline: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {getUserAllowedDisciplines().map((discipline) => (
                      <SelectItem key={discipline} value={discipline}>
                        {getDisciplineLabel(discipline)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                                 <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                   <SelectTrigger>
                     <SelectValue placeholder="Todos os status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os status</SelectItem>
                     <SelectItem value="pending">Pendente</SelectItem>
                     <SelectItem value="in-progress">Em Progresso</SelectItem>
                     <SelectItem value="completed">Concluída</SelectItem>
                     <SelectItem value="on-hold">Em Pausa</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
              <div className="flex-1">
                <Label>Prioridade</Label>
                                 <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                   <SelectTrigger>
                     <SelectValue placeholder="Todas as prioridades" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todas as prioridades</SelectItem>
                     <SelectItem value="low">Baixa</SelectItem>
                     <SelectItem value="normal">Normal</SelectItem>
                     <SelectItem value="high">Alta</SelectItem>
                     <SelectItem value="critical">Crítica</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Tarefas */}
        {isLoading ? (
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
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task: EquipmentTask) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getDisciplineIcon(task.discipline)}
                      <div>
                        <h3 className="font-semibold text-lg">{task.name}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso</span>
                        <span>{task.currentProgress}%</span>
                      </div>
                      <Progress value={task.currentProgress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Horas Estimadas:</span>
                        <span className="ml-2 font-medium">{task.estimatedHours}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horas Reais:</span>
                        <span className="ml-2 font-medium">{task.actualHours}h</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                                             <UpdateGuard resource="tasks">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedTask(task);
                               setProgressData({
                                 currentProgress: task.currentProgress,
                                 observations: '',
                                 actualHours: task.actualHours
                               });
                               setIsProgressDialogOpen(true);
                             }}
                           >
                             <Edit className="w-4 h-4 mr-1" />
                             Atualizar
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setSelectedTask(task);
                               setProgressData({
                                 currentProgress: task.currentProgress,
                                 observations: '',
                                 actualHours: task.actualHours
                               });
                               setSelectedFiles([]);
                               setIsProgressWithPhotosDialogOpen(true);
                             }}
                           >
                             <Camera className="w-4 h-4 mr-1" />
                             Com Fotos
                           </Button>
                         </UpdateGuard>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsHistoryDialogOpen(true);
                      }}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Histórico
                    </Button>
                    
                    <DeleteGuard resource="tasks">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task)}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                    </DeleteGuard>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma tarefa encontrada para este equipamento
              </p>
              <CreateGuard resource="tasks">
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </CreateGuard>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Atualização de Progresso */}
        <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atualizar Progresso</DialogTitle>
              <DialogDescription>
                Atualize o progresso da tarefa selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <Label>Tarefa</Label>
                  <p className="text-sm text-muted-foreground">{selectedTask.name}</p>
                </div>
                
                <div>
                  <Label htmlFor="progress">Progresso (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={progressData.currentProgress}
                    onChange={(e) => setProgressData({
                      ...progressData,
                      currentProgress: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="hours">Horas Reais</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={progressData.actualHours}
                    onChange={(e) => setProgressData({
                      ...progressData,
                      actualHours: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    placeholder="Descreva o trabalho realizado..."
                    value={progressData.observations}
                    onChange={(e) => setProgressData({
                      ...progressData,
                      observations: e.target.value
                    })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpdateProgress}
                    disabled={updateProgressMutation.isPending}
                  >
                    {updateProgressMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Histórico */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico da Tarefa</DialogTitle>
              <DialogDescription>
                Visualize o histórico de alterações da tarefa
              </DialogDescription>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <Label>Tarefa</Label>
                  <p className="text-sm text-muted-foreground">{selectedTask.name}</p>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Histórico em desenvolvimento...
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
                 </Dialog>

                  {/* Dialog de Atualização de Progresso com Fotos */}
          <Dialog open={isProgressWithPhotosDialogOpen} onOpenChange={setIsProgressWithPhotosDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Atualizar Progresso com Fotos</DialogTitle>
                <DialogDescription>
                  Atualize o progresso da tarefa e adicione fotos do trabalho realizado
                </DialogDescription>
              </DialogHeader>
             {selectedTask && (
               <div className="space-y-4">
                 <div>
                   <Label>Tarefa</Label>
                   <p className="text-sm text-muted-foreground">{selectedTask.name}</p>
                 </div>

                 <div>
                   <Label htmlFor="progress-photos">Progresso (%)</Label>
                   <Input
                     id="progress-photos"
                     type="number"
                     min="0"
                     max="100"
                     value={progressData.currentProgress}
                     onChange={(e) => setProgressData({
                       ...progressData,
                       currentProgress: parseInt(e.target.value) || 0
                     })}
                   />
                 </div>

                 <div>
                   <Label htmlFor="hours-photos">Horas Reais</Label>
                   <Input
                     id="hours-photos"
                     type="number"
                     min="0"
                     step="0.5"
                     value={progressData.actualHours}
                     onChange={(e) => setProgressData({
                       ...progressData,
                       actualHours: parseFloat(e.target.value) || 0
                     })}
                   />
                 </div>

                 <div>
                   <Label htmlFor="observations-photos">Observações</Label>
                   <Textarea
                     id="observations-photos"
                     placeholder="Descreva o trabalho realizado..."
                     value={progressData.observations}
                     onChange={(e) => setProgressData({
                       ...progressData,
                       observations: e.target.value
                     })}
                   />
                 </div>

                 <div>
                   <Label>Fotos</Label>
                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <Input
                         type="file"
                         accept="image/*"
                         multiple
                         onChange={handleFileSelect}
                         className="flex-1"
                       />
                       <Button variant="outline" size="sm">
                         <Upload className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     {selectedFiles.length > 0 && (
                       <div className="space-y-2">
                         <p className="text-sm text-muted-foreground">Arquivos selecionados:</p>
                         {selectedFiles.map((file, index) => (
                           <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                             <span className="text-sm truncate">{file.name}</span>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleRemoveFile(index)}
                             >
                               <X className="w-4 h-4" />
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="flex justify-end space-x-2">
                   <Button variant="outline" onClick={() => setIsProgressWithPhotosDialogOpen(false)}>
                     Cancelar
                   </Button>
                   <Button
                     onClick={handleUpdateProgressWithPhotos}
                     disabled={updateProgressWithPhotosMutation.isPending}
                   >
                     {updateProgressWithPhotosMutation.isPending ? 'Salvando...' : 'Salvar com Fotos'}
                   </Button>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>
       </div>
     </MainLayout>
   );
 }
