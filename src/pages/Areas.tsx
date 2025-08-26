import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Filter, Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { areasService, equipmentService, Area } from '@/services/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  CreateGuard, 
  UpdateGuard, 
  DeleteGuard 
} from '@/components/auth/PermissionGuard';

interface AreaFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
}

export default function Areas() {
  const { user: currentUser } = useAuth();
  const { canViewAreas, canManageAreas, getUserSector } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState<AreaFormData>({
    name: '',
    description: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  // Mapeamento de setores para disciplinas de áreas
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

  // Buscar áreas
  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['areas', currentUser?.sector],
    queryFn: async () => {
      const allAreas = await areasService.getAll();
      
      // Filtrar áreas baseado no setor do usuário
      // Por enquanto, vamos permitir todas as áreas
      // TODO: Implementar filtro baseado na disciplina da área quando disponível
      return allAreas;
    },
    enabled: !!currentUser
  });

  // Buscar equipamentos para estatísticas
  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => equipmentService.getAll()
  });

  // Criar área
  const createMutation = useMutation({
    mutationFn: areasService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área criada com sucesso!');
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar área');
    }
  });

  // Atualizar área
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Area> }) => areasService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área atualizada com sucesso!');
      setEditingArea(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar área');
    }
  });

  // Deletar área
  const deleteMutation = useMutation({
    mutationFn: areasService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar área');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active' as const
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Nome da área é obrigatório');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error('Nome da área é obrigatório');
      return;
    }
    
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data: formData });
    }
  };

  const handleDelete = (area: Area) => {
    if (confirm(`Tem certeza que deseja deletar a área "${area.name}"?`)) {
      deleteMutation.mutate(area.id);
    }
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      description: area.description,
      status: area.status
    });
  };

  const filteredAreas = areas.filter((area: Area) => {
    if (!area) return false;
    
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         area.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || area.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas gerais
  const totalAreas = areas.length;
  const activeAreas = areas.filter(area => area.status === 'active').length;
  const totalEquipment = equipment.length;
  const averageProgress = areas.length > 0 ? 
    Math.round(areas.reduce((sum, area) => sum + area.averageProgress, 0) / areas.length) : 0;
  const areasWithLowProgress = areas.filter(area => area.averageProgress < 50).length;

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Áreas</h1>
            <p className="text-gray-600">Organize e monitore as áreas do projeto</p>
          </div>
          
          <CreateGuard resource="areas">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Área
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Área</DialogTitle>
                  <DialogDescription>
                    Crie uma nova área para organizar os equipamentos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Área</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite o nome da área"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Digite a descrição da área"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'completed') => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CreateGuard>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Áreas</p>
                  <p className="text-2xl font-bold">{totalAreas}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Áreas Ativas</p>
                  <p className="text-2xl font-bold">{activeAreas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso Médio</p>
                  <p className="text-2xl font-bold">{averageProgress}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Áreas com Baixo Progresso</p>
                  <p className="text-2xl font-bold">{areasWithLowProgress}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
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
                    Mostrando áreas do setor: <strong>{getSectorLabel(currentUser.sector)}</strong>
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Você só pode visualizar áreas relacionadas ao seu setor de atuação.
                </p>
              </div>
            )}
            
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar áreas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Áreas */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAreas.map((area: Area) => (
              <Card key={area.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <Badge className={getStatusColor(area.status)}>
                      {area.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">{area.description}</p>
                  
                  {/* Progresso */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progresso Médio:</span>
                      <span className={`font-medium ${getProgressColor(area.averageProgress)}`}>
                        {area.averageProgress}%
                      </span>
                    </div>
                    <Progress 
                      value={area.averageProgress} 
                      className="h-2"
                      style={{
                        '--progress-background': getProgressBarColor(area.averageProgress)
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* Estatísticas */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Equipamentos:</span>
                      <span className="font-medium">{area.equipmentCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Criada em:</span>
                      <span className="font-medium">
                        {new Date(area.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Última atualização:</span>
                      <span className="font-medium">
                        {new Date(area.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end space-x-2">
                    <UpdateGuard resource="areas">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(area)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </UpdateGuard>
                    <DeleteGuard resource="areas">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(area)}
                        disabled={deleteMutation.isPending}
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
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhuma área encontrada com os filtros aplicados'
                  : 'Nenhuma área criada ainda'
                }
              </p>
              <CreateGuard resource="areas">
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Área
                </Button>
              </CreateGuard>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Edição */}
        <Dialog open={!!editingArea} onOpenChange={() => setEditingArea(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Área</DialogTitle>
              <DialogDescription>
                Edite as informações da área selecionada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome da Área</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome da área"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Digite a descrição da área"
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'completed') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingArea(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}