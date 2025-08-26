import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Edit, 
  Camera, 
  Upload,
  Save,
  X,
  Building2,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { areasService, equipmentService, progressService, Area, Equipment, Progress as ProgressType } from '@/services/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

interface TaskUpdateData {
  equipmentId: number;
  discipline: 'electrical' | 'mechanical' | 'civil';
  currentProgress: number;
  observations?: string;
  photos?: File[];
}

interface EquipmentWithChildren extends Equipment {
  children?: Equipment[];
  expanded?: boolean;
}

export default function AreaDetails() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserSector, canUpdateTaskProgress } = usePermissions();
  const queryClient = useQueryClient();

  // Mapeamento de setores para disciplinas de equipamentos
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

  // Forçar invalidação das queries para garantir dados atualizados
  React.useEffect(() => {
    if (areaId) {
      queryClient.invalidateQueries({ queryKey: ['equipment', areaId] });
      queryClient.invalidateQueries({ queryKey: ['area', areaId] });
    }
  }, [areaId, queryClient]);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isTaskSelectionModalOpen, setIsTaskSelectionModalOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [updateData, setUpdateData] = useState<TaskUpdateData>({
    equipmentId: 0,
    discipline: 'electrical',
    currentProgress: 0,
    observations: '',
    photos: []
  });
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Buscar área específica
  const { data: area, isLoading: areaLoading } = useQuery({
    queryKey: ['area', areaId],
    queryFn: () => areasService.getById(parseInt(areaId!)),
    enabled: !!areaId
  });

  // Buscar equipamentos da área
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment', areaId],
    queryFn: () => equipmentService.getAll({ area: areaId }),
    enabled: !!areaId
  });

  // Organizar equipamentos em hierarquia (pais e filhos)
  const organizedEquipment = React.useMemo(() => {
    const parents: EquipmentWithChildren[] = [];
    const childrenMap = new Map<string, Equipment[]>();

    equipment.forEach((eq: Equipment) => {
      if (eq.isParent) {
        parents.push({ ...eq, children: [], expanded: false });
      } else if (eq.parentTag) {
        if (!childrenMap.has(eq.parentTag)) {
          childrenMap.set(eq.parentTag, []);
        }
        childrenMap.get(eq.parentTag)!.push(eq);
      }
    });

    // Adicionar filhos aos pais
    parents.forEach(parent => {
      parent.children = childrenMap.get(parent.equipmentTag) || [];
    });

    return parents;
  }, [equipment]);

  // Buscar progresso dos equipamentos
  const { data: progressData = [] } = useQuery({
    queryKey: ['progress', areaId],
    queryFn: () => progressService.getByArea(parseInt(areaId!)),
    enabled: !!areaId
  });

  // Buscar tarefas do equipamento selecionado
  const { data: equipmentTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['equipment-tasks', selectedEquipment?.id, user?.sector],
    queryFn: async () => {
      const allTasks = await progressService.getEquipmentTasks(selectedEquipment!.id);
      
      // Filtrar tarefas baseado no setor do usuário
      const allowedDisciplines = getUserAllowedDisciplines();
      const filteredTasks = allTasks.filter((task: any) => 
        allowedDisciplines.includes(task.discipline)
      );
      
      return filteredTasks;
    },
    enabled: !!selectedEquipment?.id && !!user
  });

  // Usar diretamente as tarefas filtradas pela query
  const filteredTasks = equipmentTasks;

  // Mutação para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: progressService.updateProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', areaId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', areaId] });
      queryClient.invalidateQueries({ queryKey: ['area', areaId] });
      toast.success('Progresso atualizado com sucesso!');
      setIsUpdateModalOpen(false);
      setSelectedEquipment(null);
      setUpdateData({
        equipmentId: 0,
        discipline: 'electrical',
        currentProgress: 0,
        observations: '',
        photos: []
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar progresso');
    }
  });

  const toggleParentExpansion = (parentId: number) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const handleUpdateTask = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setIsTaskSelectionModalOpen(true);
  };

  const handleTaskSelection = (task: any) => {
    setSelectedTask(task);
    setUpdateData({
      equipmentId: selectedEquipment!.id,
      discipline: task.discipline,
      currentProgress: task.currentProgress,
      observations: task.description || '',
      photos: []
    });
    setIsTaskSelectionModalOpen(false);
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = () => {
    if (!selectedEquipment) return;

    // Validar se o progresso é um número válido entre 0 e 100
    const progress = Number(updateData.currentProgress);
    
    if (isNaN(progress) || progress < 0 || progress > 100) {
      toast.error('Progresso deve ser um número entre 0 e 100');
      return;
    }

    const mutationData = {
      equipmentId: selectedEquipment.id,
      discipline: updateData.discipline,
      currentProgress: progress,
      observations: updateData.observations || '',
      photos: updateData.photos || []
    };

    updateProgressMutation.mutate(mutationData);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDisciplineLabel = (discipline: string) => {
    switch (discipline) {
      case 'electrical': return 'Elétrica';
      case 'mechanical': return 'Mecânica';
      case 'civil': return 'Civil';
      default: return discipline;
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'electrical': return 'bg-blue-100 text-blue-800';
      case 'mechanical': return 'bg-orange-100 text-orange-800';
      case 'civil': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in-progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (areaLoading || equipmentLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!area) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Área não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A área que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => navigate('/areas')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Áreas
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/areas')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{area.name}</h1>
              <p className="text-gray-600">{area.description}</p>
            </div>
          </div>
          <Badge className={area.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {area.status === 'active' ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>

        {/* Métricas da Área */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                  <p className={`text-2xl font-bold ${getProgressColor(area.averageProgress)}`}>
                    {area.averageProgress}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <Progress 
                value={area.averageProgress} 
                className="mt-2 h-2"
                style={{
                  '--progress-background': getProgressBarColor(area.averageProgress)
                } as React.CSSProperties}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipamentos</p>
                  <p className="text-2xl font-bold">{area.equipmentCount}</p>
                </div>
                <Wrench className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round((area.averageProgress / 100) * area.equipmentCount)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-red-600">
                    {area.equipmentCount - Math.round((area.averageProgress / 100) * area.equipmentCount)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Equipamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipamentos da Área
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizedEquipment.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum equipamento encontrado nesta área.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {organizedEquipment.map((parent) => (
                  <div key={parent.id} className="border rounded-lg">
                    {/* Equipamento Pai */}
                    <div className="p-4 bg-gray-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleParentExpansion(parent.id)}
                          >
                            {expandedParents.has(parent.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <h3 className="font-semibold">{parent.equipmentTag}</h3>
                            <p className="text-sm text-muted-foreground">{parent.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Progresso Médio</p>
                            <p className={`font-semibold ${getProgressColor(parent.averageProgress)}`}>
                              {parent.averageProgress}%
                            </p>
                          </div>
                          <Progress 
                            value={parent.averageProgress} 
                            className="w-20 h-2"
                            style={{
                              '--progress-background': getProgressBarColor(parent.averageProgress)
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Equipamentos Filhos */}
                    {expandedParents.has(parent.id) && parent.children && (
                      <div className="p-4 space-y-3">
                        {parent.children.map((child) => (
                          <div key={child.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium">{child.equipmentTag}</h4>
                                  <p className="text-sm text-muted-foreground">{child.name}</p>
                                  {child.primaryDiscipline && (
                                    <Badge className={`mt-1 ${getDisciplineColor(child.primaryDiscipline)}`}>
                                      {getDisciplineLabel(child.primaryDiscipline)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Progresso</p>
                                <p className={`font-semibold ${getProgressColor(child.averageProgress)}`}>
                                  {child.averageProgress}%
                                </p>
                              </div>
                              <Progress 
                                value={child.averageProgress} 
                                className="w-20 h-2"
                                style={{
                                  '--progress-background': getProgressBarColor(child.averageProgress)
                                } as React.CSSProperties}
                              />
                              {canUpdateTaskProgress() && (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateTask(child)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Atualizar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Seleção de Tarefa */}
        <Dialog open={isTaskSelectionModalOpen} onOpenChange={setIsTaskSelectionModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Selecionar Tarefa para Atualizar
              </DialogTitle>
              <DialogDescription>
                Escolha a tarefa do equipamento {selectedEquipment?.equipmentTag} que deseja atualizar
              </DialogDescription>
            </DialogHeader>

            {selectedEquipment && (
              <div className="space-y-4">
                {/* Informações do Equipamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Equipamento: {selectedEquipment.equipmentTag}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedEquipment.description}</p>
                  </CardContent>
                </Card>

                {/* Lista de Tarefas */}
                {tasksLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Carregando tarefas...</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Este equipamento não possui tarefas cadastradas ou a disciplina principal não corresponde.
                    </p>
                    <Button onClick={() => setIsTaskSelectionModalOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Fechar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Tarefas Disponíveis:</h3>
                      {user?.sector && user.sector !== 'all' && (
                        <Badge className={getDisciplineColor(user.sector)}>
                          Filtrado por: {getDisciplineLabel(user.sector)}
                        </Badge>
                      )}
                    </div>
                    {filteredTasks.map((task) => (
                      <Card 
                        key={task.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTaskSelection(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getDisciplineColor(task.discipline)}>
                                  {getDisciplineLabel(task.discipline)}
                                </Badge>
                                <Badge className={getStatusColor(task.status)}>
                                  {getStatusLabel(task.status)}
                                </Badge>
                              </div>
                              <h4 className="font-medium mb-1">{task.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Progresso Atual</p>
                                  <p className={`font-semibold ${getProgressColor(task.currentProgress)}`}>
                                    {task.currentProgress}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Horas Estimadas</p>
                                  <p className="font-semibold">{task.estimatedHours}h</p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Progress 
                                value={task.currentProgress} 
                                className="w-20 h-2"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Atualização de Tarefa */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Atualizar Progresso do Equipamento
              </DialogTitle>
              <DialogDescription>
                Atualize o progresso das tarefas do equipamento {selectedEquipment?.equipmentTag}
              </DialogDescription>
            </DialogHeader>

            {selectedEquipment && selectedTask && (
              <div className="space-y-6">
                {/* Informações do Equipamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Equipamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tag</Label>
                        <p className="text-sm text-muted-foreground">{selectedEquipment.equipmentTag}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Nome</Label>
                        <p className="text-sm text-muted-foreground">{selectedEquipment.name}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Descrição</Label>
                      <p className="text-sm text-muted-foreground">{selectedEquipment.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações da Tarefa Selecionada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tarefa Selecionada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getDisciplineColor(selectedTask.discipline)}>
                        {getDisciplineLabel(selectedTask.discipline)}
                      </Badge>
                      <Badge className={getStatusColor(selectedTask.status)}>
                        {getStatusLabel(selectedTask.status)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Nome da Tarefa</Label>
                      <p className="text-sm text-muted-foreground">{selectedTask.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Descrição</Label>
                      <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Progresso Atual</Label>
                        <p className={`text-sm font-semibold ${getProgressColor(selectedTask.currentProgress)}`}>
                          {selectedTask.currentProgress}%
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Horas Estimadas</Label>
                        <p className="text-sm font-semibold">{selectedTask.estimatedHours}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Formulário de Atualização */}
                <div className="space-y-4">

                  <div>
                    <Label htmlFor="progress">Novo Progresso: {updateData.currentProgress}%</Label>
                    <Slider
                      value={[updateData.currentProgress]}
                      onValueChange={(value) => setUpdateData({ ...updateData, currentProgress: value[0] })}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={updateData.observations}
                      onChange={(e) => setUpdateData({ ...updateData, observations: e.target.value })}
                      placeholder="Descreva as atividades realizadas, observações importantes..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="photos">Fotos/Documentos</Label>
                    <div className="mt-2">
                      <Button variant="outline" className="w-full">
                        <Camera className="w-4 h-4 mr-2" />
                        Tirar Foto ou Anexar Arquivo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveUpdate}
                    disabled={updateProgressMutation.isPending}
                    className="flex-1"
                  >
                    {updateProgressMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Atualização
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsUpdateModalOpen(false)}
                    disabled={updateProgressMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
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
