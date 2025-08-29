import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Filter, Wrench, MapPin, Settings, ChevronDown, ChevronRight, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CapslockInput } from '@/components/ui/capslock-input';
import { CapslockTextarea } from '@/components/ui/capslock-textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { equipmentService, areasService } from '@/services/api';
import type { Equipment, Area } from '@/services/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  CreateGuard, 
  UpdateGuard, 
  DeleteGuard 
} from '@/components/auth/PermissionGuard';
import { useNavigate } from 'react-router-dom';

interface EquipmentFormData {
  equipmentTag: string;
  name: string;
  areaId: number;
  description: string;
  isParent: boolean;
  parentTag?: string;
}

export default function Equipment() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { canViewEquipment, canManageEquipment, getUserSector } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateChildDialogOpen, setIsCreateChildDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [selectedParentForChild, setSelectedParentForChild] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    equipmentTag: '',
    name: '',
    areaId: 0,
    description: '',
    isParent: true,
    parentTag: undefined
  });

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

  // Buscar equipamentos
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', currentUser?.sector],
    queryFn: async () => {
      const allEquipment = await equipmentService.getAll();
      
      // Filtrar equipamentos baseado no setor do usuário
      const allowedDisciplines = getUserAllowedDisciplines();
      const filteredEquipment = allEquipment.filter((item: Equipment) => {
        // Se o usuário tem acesso a todas as disciplinas, mostrar todos
        if (allowedDisciplines.includes('electrical') && 
            allowedDisciplines.includes('mechanical') && 
            allowedDisciplines.includes('civil')) {
          return true;
        }
        
        // Filtrar baseado na disciplina do equipamento (se disponível)
        // Por enquanto, vamos permitir todos os equipamentos
        // TODO: Implementar filtro baseado na disciplina do equipamento quando disponível
        return true;
      });
      
      return filteredEquipment;
    },
    enabled: !!currentUser
  });

  // Buscar áreas para o select
  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: areasService.getAll
  });

  // Organizar equipamentos por hierarquia
  const organizedEquipment = React.useMemo(() => {
    const parents = equipment.filter((eq: Equipment) => eq.isParent);
    const children = equipment.filter((eq: Equipment) => !eq.isParent);
    
    return parents.map(parent => ({
      ...parent,
      children: children.filter(child => child.parentTag === parent.equipmentTag)
    }));
  }, [equipment]);

  // Criar equipamento
  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento criado com sucesso!');
      setIsCreateDialogOpen(false);
      setIsCreateChildDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar equipamento');
    }
  });

  // Atualizar equipamento
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EquipmentFormData }) => equipmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento atualizado com sucesso!');
      setEditingEquipment(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar equipamento');
    }
  });

  // Deletar equipamento
  const deleteMutation = useMutation({
    mutationFn: equipmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar equipamento');
    }
  });

  const resetForm = () => {
    setFormData({
      equipmentTag: '',
      name: '',
      areaId: 0,
      description: '',
      isParent: true,
      parentTag: undefined
    });
  };

  const handleCreate = () => {
    if (!formData.equipmentTag || !formData.name || !formData.areaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleCreateChild = () => {
    if (!formData.equipmentTag || !formData.name || !formData.areaId || !formData.parentTag) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar se o TAG do filho segue o padrão do pai
    const parentTag = formData.parentTag;
    const childTag = formData.equipmentTag;
    
    // Verificar se o TAG do filho começa com o TAG do pai
    if (!childTag.startsWith(parentTag)) {
      toast.error(`O TAG do equipamento filho deve começar com o TAG do pai (${parentTag}). Exemplo: ${parentTag}M1`);
      return;
    }
    
    // Verificar se o TAG do filho tem pelo menos um caractere adicional após o TAG do pai
    if (childTag.length <= parentTag.length) {
      toast.error(`O TAG do equipamento filho deve ter pelo menos um caractere adicional após o TAG do pai. Exemplo: ${parentTag}M1`);
      return;
    }

    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingEquipment || !formData.equipmentTag || !formData.name || !formData.areaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    updateMutation.mutate({ id: editingEquipment.id, data: formData });
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      equipmentTag: item.equipmentTag,
      name: item.name,
      areaId: item.areaId,
      description: item.description || '',
      isParent: item.isParent,
      parentTag: item.parentTag
    });
  };

  const handleDelete = (item: Equipment) => {
    if (confirm(`Tem certeza que deseja deletar o equipamento "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleAddChild = (parent: Equipment) => {
    setSelectedParentForChild(parent);
    setFormData({
      equipmentTag: '',
      name: '',
      areaId: parent.areaId,
      description: '',
      isParent: false,
      parentTag: parent.equipmentTag
    });
    setIsCreateChildDialogOpen(true);
  };

  const toggleParentExpansion = (parentId: number) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filtrar equipamentos
  const filteredEquipment = organizedEquipment.filter((item: Equipment) => {
    // Filtro por área
    if (areaFilter !== 'all' && item.areaId.toString() !== areaFilter) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesParent = (
        item.equipmentTag.toLowerCase().includes(searchLower) ||
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
      
      // Se o pai não corresponde, verificar se algum filho corresponde
      if (!matchesParent) {
        return item.children?.some(child => 
          child.equipmentTag.toLowerCase().includes(searchLower) ||
          child.name.toLowerCase().includes(searchLower) ||
          (child.description && child.description.toLowerCase().includes(searchLower))
        ) || false;
      }
      
      return matchesParent;
    }
    
    return true;
  });

  const renderChildEquipment = (child: Equipment) => {
    const area = areas.find(a => a.id === child.areaId);
    
    return (
      <Card key={child.id} className="ml-8 border-l-2 border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-base font-semibold text-blue-800">{child.equipmentTag}</CardTitle>
                <Badge variant="outline" className={getStatusColor(child.status)}>
                  {child.status === 'active' ? 'Ativo' : child.status === 'inactive' ? 'Inativo' : 'Manutenção'}
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Filho
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-800 mb-1">{child.name}</h3>
              {area && (
                <div className="flex items-center text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {area.name}
                </div>
              )}
              {child.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{child.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">Progresso:</span>
              <span className={`text-xs font-bold ${getProgressColor(child.averageProgress)}`}>
                {child.averageProgress}%
              </span>
            </div>
            
            <div className="flex gap-2 pt-2 border-t border-blue-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/equipment/${child.id}/tasks`)}
                className="flex-1 text-xs"
              >
                <Wrench className="w-3 h-3 mr-1" />
                Tarefas
              </Button>
              <UpdateGuard resource="equipment">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(child)}
                  className="flex-1 text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              </UpdateGuard>
              <DeleteGuard resource="equipment">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(child)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Excluir
                </Button>
              </DeleteGuard>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderParentEquipment = (parent: Equipment & { children: Equipment[] }) => {
    const area = areas.find(a => a.id === parent.areaId);
    const isExpanded = expandedParents.has(parent.id);
    const childrenCount = parent.children?.length || 0;
    const parentProgress = childrenCount > 0 
      ? Math.round(parent.children!.reduce((sum, child) => sum + child.averageProgress, 0) / childrenCount)
      : 0;

    return (
      <Collapsible key={parent.id} open={isExpanded} onOpenChange={() => toggleParentExpansion(parent.id)}>
        <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg font-bold text-foreground">{parent.equipmentTag}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(parent.status)}>
                      {parent.status === 'active' ? 'Ativo' : parent.status === 'inactive' ? 'Inativo' : 'Manutenção'}
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      Pai
                    </Badge>
                    {childrenCount > 0 && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {childrenCount} filho{childrenCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{parent.name}</h3>
                  {area && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      {area.name}
                    </div>
                  )}
                  {parent.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{parent.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <UpdateGuard resource="equipment">
                        <DropdownMenuItem onClick={() => handleEdit(parent)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </UpdateGuard>
                      <DeleteGuard resource="equipment">
                        <DropdownMenuItem 
                          onClick={() => handleDelete(parent)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DeleteGuard>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Progresso Médio:</span>
                  <span className={`text-sm font-bold ${getProgressColor(parentProgress)}`}>
                    {parentProgress}%
                  </span>
                </div>
                <Progress value={parentProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              {childrenCount > 0 ? (
                <>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700">Equipamentos Filhos</h4>
                    <CreateGuard resource="equipment">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddChild(parent)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Filho
                      </Button>
                    </CreateGuard>
                  </div>
                  <div className="space-y-3">
                    {parent.children.map(renderChildEquipment)}
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">Nenhum equipamento filho</p>
                    <CreateGuard resource="equipment">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddChild(parent)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Primeiro Filho
                      </Button>
                    </CreateGuard>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">Equipamentos</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Gerencie os equipamentos organizados por hierarquia
              </p>
            </div>
            
            <CreateGuard resource="equipment">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Equipamento Pai
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Equipamento Pai</DialogTitle>
                    <DialogDescription>
                      Crie um novo equipamento principal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tag">Tag do Equipamento *</Label>
                      <CapslockInput
                        id="tag"
                        value={formData.equipmentTag}
                        onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                        placeholder="EX: COMP-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Nome/Tipo *</Label>
                      <CapslockInput
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="EX: MOINHO DE CRU"
                      />
                    </div>
                    <div>
                      <Label htmlFor="area">Área *</Label>
                      <Select value={formData.areaId.toString()} onValueChange={(value) => setFormData({ ...formData, areaId: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma área" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map((area: Area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <CapslockTextarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="DESCRIÇÃO DO EQUIPAMENTO"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
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
        </div>

        {/* Filtros */}
        <div className="space-y-4">
          {/* Indicador de filtro por setor */}
          {currentUser?.sector && currentUser.sector !== 'all' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">
                  Mostrando equipamentos do setor: <strong>{getSectorLabel(currentUser.sector)}</strong>
                </span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar equipamentos por tag, nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Áreas</SelectItem>
                {areas.map((area: Area) => (
                  <SelectItem key={area.id} value={area.id.toString()}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Equipamentos */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEquipment.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Settings className="w-16 h-16 mx-auto text-gray-400 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Nenhum equipamento encontrado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || areaFilter !== 'all'
                  ? 'Não há equipamentos que correspondam aos filtros aplicados.'
                  : 'Comece criando seu primeiro equipamento pai para gerenciar o sistema.'
                }
              </p>
              <CreateGuard resource="equipment">
                <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Equipamento
                </Button>
              </CreateGuard>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredEquipment.map(renderParentEquipment)}
          </div>
        )}

        {/* Dialog para Criar Filho */}
        <Dialog open={isCreateChildDialogOpen} onOpenChange={setIsCreateChildDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Equipamento Filho</DialogTitle>
              <DialogDescription>
                Adicione um novo equipamento filho ao {selectedParentForChild?.equipmentTag}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="child-tag">Tag do Equipamento *</Label>
                <CapslockInput
                  id="child-tag"
                  value={formData.equipmentTag}
                  onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                  placeholder={`EX: ${selectedParentForChild?.equipmentTag}M1`}
                  className={
                    formData.equipmentTag && formData.parentTag && 
                    !formData.equipmentTag.startsWith(formData.parentTag) 
                      ? 'border-red-500 focus:border-red-500' 
                      : formData.equipmentTag && formData.parentTag && 
                        formData.equipmentTag.startsWith(formData.parentTag) && 
                        formData.equipmentTag.length > formData.parentTag.length
                        ? 'border-green-500 focus:border-green-500'
                        : ''
                  }
                />
                {formData.equipmentTag && formData.parentTag && (
                  <div className="mt-1 text-xs">
                    {!formData.equipmentTag.startsWith(formData.parentTag) ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        O TAG deve começar com "{formData.parentTag}"
                      </span>
                    ) : formData.equipmentTag.length <= formData.parentTag.length ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        O TAG deve ter pelo menos um caractere adicional após "{formData.parentTag}"
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Formato correto! Exemplo: {formData.parentTag}M1, {formData.parentTag}SUB1
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  Exemplo: Se o pai é "{selectedParentForChild?.equipmentTag}", o filho pode ser "{selectedParentForChild?.equipmentTag}M1"
                </div>
              </div>
              <div>
                <Label htmlFor="child-name">Nome/Tipo *</Label>
                <CapslockInput
                  id="child-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EX: MOTOR PRINCIPAL"
                />
              </div>
              <div>
                <Label htmlFor="child-area">Área *</Label>
                <Select value={formData.areaId.toString()} onValueChange={(value) => setFormData({ ...formData, areaId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area: Area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="child-description">Descrição</Label>
                <CapslockTextarea
                  id="child-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="DESCRIÇÃO DO EQUIPAMENTO FILHO"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateChildDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateChild} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Adicionar Filho'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Equipamento</DialogTitle>
              <DialogDescription>
                Edite as informações do equipamento selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tag">Tag do Equipamento *</Label>
                <CapslockInput
                  id="edit-tag"
                  value={formData.equipmentTag}
                  onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                  placeholder="EX: COMP-001"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">Nome/Tipo *</Label>
                <CapslockInput
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EX: MOINHO DE CRU"
                />
              </div>
              <div>
                <Label htmlFor="edit-area">Área *</Label>
                <Select value={formData.areaId.toString()} onValueChange={(value) => setFormData({ ...formData, areaId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area: Area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <CapslockTextarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="DESCRIÇÃO DO EQUIPAMENTO"
                  rows={3}
                />
              </div>
              
              {/* Campos de Hierarquia - Edição */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isParent"
                    checked={formData.isParent}
                    onChange={(e) => setFormData({ ...formData, isParent: e.target.checked, parentTag: e.target.checked ? undefined : formData.parentTag })}
                    className="rounded border-gray-300"
                    aria-label="É um equipamento pai"
                  />
                  <Label htmlFor="edit-isParent">É um equipamento pai</Label>
                </div>
                
                {!formData.isParent && (
                  <div>
                    <Label htmlFor="edit-parentTag">Tag do Equipamento Pai</Label>
                    <Select 
                      value={formData.parentTag || ''} 
                      onValueChange={(value) => setFormData({ ...formData, parentTag: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento pai" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.filter((eq: Equipment) => eq.isParent && eq.id !== editingEquipment?.id).map((parent: Equipment) => (
                          <SelectItem key={parent.id} value={parent.equipmentTag}>
                            {parent.equipmentTag} - {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingEquipment(null)}>
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