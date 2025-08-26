import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { 
  Search, 
  Filter, 
  Camera, 
  Save, 
  Zap, 
  Wrench, 
  Building, 
  MapPin,
  Calendar,
  User,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressService, areasService, Progress, ProgressUpdate } from "@/services/api";
import { toast } from "sonner";
import { UpdateGuard } from '@/components/auth/PermissionGuard';

interface TaskUpdate {
  equipmentId: number;
  equipmentTag: string;
  equipmentName: string;
  area: string;
  discipline: "electrical" | "mechanical" | "civil";
  currentProgress: number;
  newProgress: number;
  observations: string;
  photos: File[];
}

const Progress = () => {
  const [selectedTask, setSelectedTask] = useState<TaskUpdate | null>(null);
  const [filters, setFilters] = useState({
    area: "all",
    discipline: "all",
    status: "all"
  });

  const queryClient = useQueryClient();

  // Buscar dados de progresso
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['progress', filters],
    queryFn: () => progressService.getAll(filters),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar áreas para filtros
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: areasService.getAll,
  });

  // Mutação para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: ({ equipmentId, discipline, progressData }: {
      equipmentId: number;
      discipline: string;
      progressData: ProgressUpdate;
    }) => progressService.update(equipmentId, discipline, progressData),
    onSuccess: () => {
      toast.success("Progresso atualizado com sucesso!");
      setSelectedTask(null);
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao atualizar progresso");
    },
  });

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case "electrical": return <Zap className="h-4 w-4 text-yellow-500" />;
      case "mechanical": return <Wrench className="h-4 w-4 text-blue-500" />;
      case "civil": return <Building className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getDisciplineLabel = (discipline: string) => {
    switch (discipline) {
      case "electrical": return "Elétrica";
      case "mechanical": return "Mecânica";
      case "civil": return "Civil";
      default: return discipline;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "text-success";
    if (progress >= 70) return "text-primary";
    if (progress >= 50) return "text-warning";
    return "text-destructive";
  };

  const handleTaskUpdate = (equipment: Progress, discipline: string, currentProgress: number) => {
    setSelectedTask({
      equipmentId: equipment.equipmentId,
      equipmentTag: equipment.equipmentTag,
      equipmentName: equipment.equipmentName,
      area: equipment.area,
      discipline: discipline as "electrical" | "mechanical" | "civil",
      currentProgress,
      newProgress: currentProgress,
      observations: "",
      photos: []
    });
  };

  const handleSaveUpdate = () => {
    if (selectedTask) {
      updateProgressMutation.mutate({
        equipmentId: selectedTask.equipmentId,
        discipline: selectedTask.discipline,
        progressData: {
          currentProgress: selectedTask.newProgress,
          observations: selectedTask.observations
        }
      });
    }
  };

  if (tasksError) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Atualização de Progresso</h1>
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atualização de Progresso</h1>
          <p className="text-muted-foreground">
            Atualize o progresso das tarefas por equipamento e disciplina
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar Equipamento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Tag ou nome..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="area-filter">Área</Label>
                <Select value={filters.area} onValueChange={(value) => setFilters({...filters, area: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {areas?.map((area) => (
                      <SelectItem key={area.id} value={area.name}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discipline-filter">Disciplina</Label>
                <Select value={filters.discipline} onValueChange={(value) => setFilters({...filters, discipline: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    <SelectItem value="electrical">Elétrica</SelectItem>
                    <SelectItem value="mechanical">Mecânica</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in-progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-2 space-y-4">
            {tasksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="h-12 bg-muted rounded" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              tasks.map((equipment) => (
                <Card key={equipment.equipmentId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{equipment.equipmentTag}</CardTitle>
                        <CardDescription>
                          {equipment.equipmentName} - {equipment.area}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Disciplines */}
                    <div className="space-y-3">
                      {Object.entries(equipment)
                        .filter(([key]) => ["electrical", "mechanical", "civil"].includes(key))
                        .map(([discipline, data]: [string, any]) => (
                          <div key={discipline} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              {getDisciplineIcon(discipline)}
                              <div>
                                <p className="font-medium">{getDisciplineLabel(discipline)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {data.updated ? 
                                    `Atualizado: ${new Date(data.updated).toLocaleDateString("pt-BR")}` :
                                    'Nunca atualizado'
                                  }
                                  {data.updatedBy && ` por ${data.updatedBy}`}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className={`text-lg font-bold ${getProgressColor(data.current)}`}>
                                  {data.current}%
                                </p>
                                <ProgressBar value={data.current} className="w-20 h-2" />
                              </div>
                              
                              <UpdateGuard resource="progress">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTaskUpdate(equipment, discipline, data.current)}
                                >
                                  Atualizar
                                </Button>
                              </UpdateGuard>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum equipamento encontrado com os filtros aplicados
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Update Panel */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedTask ? "Atualizar Progresso" : "Selecione uma Tarefa"}
                </CardTitle>
                {selectedTask && (
                  <CardDescription>
                    {selectedTask.equipmentTag} - {getDisciplineLabel(selectedTask.discipline)}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {selectedTask ? (
                  <>
                    <div className="space-y-2">
                      <Label>Progresso Atual</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-center">
                          {selectedTask.currentProgress}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-progress">Novo Progresso (%)</Label>
                      <Input
                        id="new-progress"
                        type="number"
                        min="0"
                        max="100"
                        value={selectedTask.newProgress}
                        onChange={(e) => setSelectedTask({
                          ...selectedTask,
                          newProgress: parseInt(e.target.value) || 0
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observations">Observações</Label>
                      <Textarea
                        id="observations"
                        placeholder="Descreva o trabalho realizado..."
                        value={selectedTask.observations}
                        onChange={(e) => setSelectedTask({
                          ...selectedTask,
                          observations: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Registro Fotográfico</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-muted/30 transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Clique para adicionar fotos
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSaveUpdate} 
                        className="flex-1"
                        disabled={updateProgressMutation.isPending}
                      >
                        {updateProgressMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {updateProgressMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedTask(null)}
                        disabled={updateProgressMutation.isPending}
                      >
                        Cancelar
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Usuário atual</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date().toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Selecione uma tarefa para atualizar o progresso
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Progress;