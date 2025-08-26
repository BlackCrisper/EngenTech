import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Filter, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    equipmentTag: '',
    name: '',
    areaId: 0,
    description: '',
    isParent: false,
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

  // Criar equipamento
  const createMutation = useMutation({
    mutationFn: equipmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipamento criado com sucesso!');
      setIsCreateDialogOpen(false);
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
      isParent: false,
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

  const handleUpdate = () => {
    if (!formData.equipmentTag || !formData.name || !formData.areaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, data: formData });
    }
  };

  const handleDelete = (equipment: Equipment) => {
    if (confirm(`Tem certeza que deseja deletar o equipamento "${equipment.name}"?`)) {
      deleteMutation.mutate(equipment.id);
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      equipmentTag: equipment.equipmentTag,
      name: equipment.name,
      areaId: equipment.areaId,
      description: equipment.description,
      isParent: equipment.isParent,
      parentTag: equipment.parentTag
    });
  };

  // Filtrar equipamentos baseado nos filtros aplicados
  const getFilteredEquipment = () => {
    if (!equipment || equipment.length === 0) {
      return [];
    }

    return equipment.filter((item: Equipment) => {
      const matchesSearch = item.equipmentTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.areaName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArea = areaFilter === 'all' || item.areaId.toString() === areaFilter;
      return matchesSearch && matchesArea;
    });
  };

  const filteredEquipment = getFilteredEquipment();

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Estado para controlar expansão dos equipamentos pai
  const [expandedEquipment, setExpandedEquipment] = useState<Set<number>>(new Set());

  // Função para alternar expansão
  const toggleExpansion = (equipmentId: number) => {
    setExpandedEquipment(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
  };

  // Função para renderizar equipamento individual
  const renderEquipmentCard = (item: Equipment, level: number = 0) => {
    // Calcular progresso médio dos filhos se for equipamento pai
    const calculateParentProgress = (children: Equipment[]) => {
      if (!children || children.length === 0) return 0;
      const totalProgress = children.reduce((sum, child) => sum + child.averageProgress, 0);
      return Math.round(totalProgress / children.length);
    };

    const parentProgress = item.isParent ? calculateParentProgress(item.children || []) : item.averageProgress;
    const childrenCount = item.children?.length || 0;
    const isExpanded = expandedEquipment.has(item.id);

    return (
      <div key={item.id} className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {item.isParent && <Badge variant="secondary" className="text-xs">Pai</Badge>}
                  {!item.isParent && item.parentTag && <Badge variant="outline" className="text-xs">Filho</Badge>}
                  {item.equipmentTag}
                </CardTitle>
                <p className="text-sm text-gray-600">{item.name}</p>
              </div>
              <Badge variant="outline">
                {item.areaName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Para equipamentos pai, mostrar informações resumidas */}
            {item.isParent ? (
              <div className="space-y-4">
                <p className="text-gray-600 line-clamp-2">{item.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progresso Médio (Filhos):</span>
                    <span className={`font-medium ${getProgressColor(parentProgress)}`}>
                      {parentProgress}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Equipamentos Filhos:</span>
                    <span className="font-medium">{childrenCount}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  {childrenCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpansion(item.id)}
                    >
                      {isExpanded ? 'Ocultar Filhos' : `Ver Filhos (${childrenCount})`}
                    </Button>
                  )}
                  <UpdateGuard resource="equipment">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </UpdateGuard>
                  <DeleteGuard resource="equipment">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DeleteGuard>
                </div>
              </div>
            ) : (
              /* Para equipamentos filhos, mostrar informações completas */
              <div className="space-y-4">
                <p className="text-gray-600 line-clamp-2">{item.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progresso Médio:</span>
                    <span className={`font-medium ${getProgressColor(item.averageProgress)}`}>
                      {item.averageProgress}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Disciplinas:</span>
                    <span className="font-medium">{item.progressCount}</span>
                  </div>
                  {item.parentTag && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pai:</span>
                      <span className="font-medium">{item.parentTag}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/equipment/${item.id}/tasks`)}
                  >
                    <Wrench className="w-4 h-4" />
                    Tarefas
                  </Button>
                  <UpdateGuard resource="equipment">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </UpdateGuard>
                  <DeleteGuard resource="equipment">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DeleteGuard>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Renderizar filhos se existirem e estiver expandido */}
        {item.isParent && item.children && item.children.length > 0 && isExpanded && (
          <div className="mt-4 space-y-4">
            {item.children.map((child: Equipment) => renderEquipmentCard(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-gray-600">Gerencie os equipamentos do projeto</p>
        </div>
        
        <CreateGuard resource="equipment">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Equipamento
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Equipamento</DialogTitle>
              <DialogDescription>
                Crie um novo equipamento para o sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag">Tag do Equipamento *</Label>
                <Input
                  id="tag"
                  value={formData.equipmentTag}
                  onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                  placeholder="Ex: EQ-001"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome/Tipo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Moinho de Cru"
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
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do equipamento"
                />
              </div>
              
              {/* Campos de Hierarquia */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isParent"
                    aria-label="É um equipamento pai"
                    checked={formData.isParent}
                    onChange={(e) => setFormData({ ...formData, isParent: e.target.checked, parentTag: e.target.checked ? undefined : formData.parentTag })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isParent">É um equipamento pai</Label>
                </div>
                
                {!formData.isParent && (
                  <div>
                    <Label htmlFor="parentTag">Tag do Equipamento Pai</Label>
                    <Select 
                      value={formData.parentTag || ''} 
                      onValueChange={(value) => setFormData({ ...formData, parentTag: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento pai" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.filter((eq: Equipment) => eq.isParent).map((parent: Equipment) => (
                          <SelectItem key={parent.id} value={parent.equipmentTag}>
                            {parent.equipmentTag} - {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

      {/* Filtros */}
      <div className="space-y-4">
        {/* Indicador de filtro por setor */}
        {currentUser?.sector && currentUser.sector !== 'all' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800">
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">
                Mostrando equipamentos do setor: <strong>{getSectorLabel(currentUser.sector)}</strong>
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Você só pode visualizar equipamentos relacionados ao seu setor de atuação.
            </p>
          </div>
        )}
        
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar equipamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-48">
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
      ) : (
        <div className="space-y-6">
          {filteredEquipment.map((item: Equipment) => renderEquipmentCard(item))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
                  <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Edite as informações do equipamento selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-tag">Tag do Equipamento *</Label>
              <Input
                id="edit-tag"
                value={formData.equipmentTag}
                onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                placeholder="Ex: EQ-001"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Nome/Tipo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Moinho de Cru"
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
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do equipamento"
              />
            </div>
            
            {/* Campos de Hierarquia - Edição */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isParent"
                  aria-label="É um equipamento pai"
                  checked={formData.isParent}
                  onChange={(e) => setFormData({ ...formData, isParent: e.target.checked, parentTag: e.target.checked ? undefined : formData.parentTag })}
                  className="rounded border-gray-300"
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
            <div className="flex justify-end space-x-2">
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