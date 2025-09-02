import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Wrench, 
  TrendingUp, 
  ArrowLeft, 
  ChevronRight,
  Filter,
  Camera,
  Image,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Building2,
  History
} from "lucide-react";
import { equipmentService, tasksService, progressService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { UpdateProgressModal } from "@/components/tasks/UpdateProgressModal";
import TaskHistoryModal from "@/components/tasks/TaskHistoryModal";

const OperatorTasks = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Buscar dados do equipamento
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['operator-equipment-detail', equipmentId],
    queryFn: () => equipmentService.getById(Number(equipmentId)),
    enabled: !!equipmentId,
  });

  // Buscar tarefas do equipamento
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['operator-equipment-tasks', equipmentId],
    queryFn: () => tasksService.getEquipmentTasks(Number(equipmentId)),
    enabled: !!equipmentId,
  });

  // Buscar progresso atual do equipamento
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['operator-equipment-progress', equipmentId],
    queryFn: () => progressService.getById(Number(equipmentId)),
    enabled: !!equipmentId,
  });

  // Filtrar tarefas baseado no setor do usuário e busca
  const filteredTasks = tasks?.filter(task => {
    // Filtrar por setor do usuário (apenas tarefas da disciplina do usuário)
    const userDiscipline = user?.sector;
    if (userDiscipline && userDiscipline !== 'all' && task.discipline !== userDiscipline) {
      return false;
    }

    // Filtrar por busca
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  }) || [];

  const handleBackClick = () => {
    // Voltar para a lista de equipamentos da área
    if (equipment?.areaId) {
      navigate(`/operator/areas/${equipment.areaId}/equipment`);
    } else {
      navigate("/operator/areas");
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsUpdateModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-muted text-muted-foreground border-border';
      case 'on-hold': return 'bg-muted/50 text-muted-foreground border-border/50';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Play className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'on-hold': return <Pause className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-primary/20 text-primary border-primary/30';
      case 'high': return 'bg-primary/15 text-primary border-primary/25';
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (equipmentLoading || tasksLoading || progressLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" disabled>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 bg-muted animate-pulse rounded w-64" />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!equipment) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Equipamentos
          </Button>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <p className="text-destructive">
              Equipamento não encontrado.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header com navegação */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={handleBackClick} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {equipment.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Tarefas disponíveis para atualização
                </p>
              </div>
            </div>
          </div>
          
          {/* Informações do equipamento em cards organizados */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono bg-primary text-primary-foreground px-3 py-2 rounded-lg text-base font-bold">
                    {equipment.equipmentTag}
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">Tag</p>
                    <p className="text-sm font-medium text-foreground">Equipamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Controles de busca e filtros */}
        <div className="space-y-4">
          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Lista de Tarefas */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tarefas Disponíveis</h2>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma tarefa encontrada
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Tente ajustar os termos de busca."
                  : "Este equipamento não possui tarefas disponíveis para seu setor."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
                    "border-2 hover:border-primary/30",
                    "bg-gradient-to-r from-background to-muted/20",
                    task.status === 'completed' && "border-primary/30 bg-primary/5",
                    task.status === 'in-progress' && "border-primary/30 bg-primary/5",
                    task.status === 'on-hold' && "border-muted/50 bg-muted/10"
                  )}
                  onClick={() => handleTaskClick(task)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 flex-1">
                        {task.name}
                      </CardTitle>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className={cn("text-xs", getStatusColor(task.status))}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">
                            {task.status === 'completed' ? 'Concluída' :
                             task.status === 'in-progress' ? 'Em Andamento' :
                             task.status === 'pending' ? 'Pendente' : 'Em Pausa'}
                          </span>
                        </Badge>
                        
                        <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                          {task.priority === 'critical' ? 'Crítica' :
                           task.priority === 'high' ? 'Alta' :
                           task.priority === 'normal' ? 'Normal' : 'Baixa'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Disciplina:</span>
                        <Badge variant="outline" className="text-xs">
                          {task.discipline === 'electrical' ? 'Elétrica' :
                           task.discipline === 'mechanical' ? 'Mecânica' : 'Civil'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-medium text-primary">
                          {task.currentProgress}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.currentProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.estimatedHours && (
                          <span>Estimado: {task.estimatedHours}h</span>
                        )}
                        {task.actualHours && (
                          <span>Real: {task.actualHours}h</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask({...task, equipmentId: equipment.id});
                            setIsHistoryModalOpen(true);
                          }}
                          className="text-xs"
                        >
                          <History className="h-3 w-3 mr-1" />
                          Histórico
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Atualização de Progresso */}
        {selectedTask && (
          <UpdateProgressModal
            isOpen={isUpdateModalOpen}
            onClose={() => {
              setIsUpdateModalOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            equipment={equipment}
            onSuccess={() => {
              // Recarregar dados após atualização
              window.location.reload();
            }}
          />
        )}

        {/* Modal de Histórico */}
        {selectedTask && (
          <TaskHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => {
              setIsHistoryModalOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default OperatorTasks;
