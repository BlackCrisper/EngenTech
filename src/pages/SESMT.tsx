import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  Eye, 
  Edit, 
  MessageSquare,
  Clock,
  MapPin,
  User,
  Calendar,
  FileText,
  Camera,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertOctagon
} from 'lucide-react';
import { 
  sesmtService, 
  areasService,
  SESMTOccurrence, 
  SESMTOccurrenceType,
  SESMTOccurrenceComment,
  SESMTOccurrenceHistory
} from '../services/api';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SESMT: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<SESMTOccurrence | null>(null);
  const [filters, setFilters] = useState({
    area: 'all',
    status: 'all',
    severity: 'all',
    type: 'all',
    search: ''
  });
  const [formData, setFormData] = useState({
    areaId: '',
    occurrenceTypeId: '',
    title: '',
    description: '',
    severity: 'medium',
    involvedPersons: '',
    dateTimeOccurrence: '',
    location: '',
    weatherConditions: '',
    equipmentInvolved: '',
    immediateActions: '',
    recommendations: '',
    isConfidential: false
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: occurrenceTypes } = useQuery({
    queryKey: ['sesmt-occurrence-types'],
    queryFn: sesmtService.getOccurrenceTypes
  });

  const { data: areas, error: areasError, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: areasService.getAll,
    onError: (error) => {
      console.error('Erro ao buscar áreas:', error);
      console.error('Detalhes do erro:', error.response?.data);
      console.error('Token atual:', localStorage.getItem('token'));
    },
    onSuccess: (data) => {
      console.log('Áreas carregadas:', data);
    }
  });

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['sesmt-occurrences', filters],
    queryFn: () => sesmtService.getOccurrences(filters)
  });

  const { data: selectedOccurrenceComments } = useQuery({
    queryKey: ['sesmt-occurrence-comments', selectedOccurrence?.id],
    queryFn: () => selectedOccurrence ? sesmtService.getOccurrenceComments(selectedOccurrence.id) : Promise.resolve([]),
    enabled: !!selectedOccurrence
  });

  const { data: selectedOccurrenceHistory } = useQuery({
    queryKey: ['sesmt-occurrence-history', selectedOccurrence?.id],
    queryFn: () => selectedOccurrence ? sesmtService.getOccurrenceHistory(selectedOccurrence.id) : Promise.resolve([]),
    enabled: !!selectedOccurrence
  });

  // Mutations
  const createOccurrenceMutation = useMutation({
    mutationFn: sesmtService.createOccurrence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesmt-occurrences'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso!",
        description: "Ocorrência registrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar ocorrência:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 'Erro ao registrar ocorrência';
      const missingFields = error.response?.data?.missingFields;
      
      let description = errorMessage;
      if (missingFields && missingFields.length > 0) {
        description += ` - Campos faltando: ${missingFields.join(', ')}`;
      }
      
      toast({
        title: "Erro!",
        description: description,
        variant: "destructive",
      });
    }
  });

  const updateOccurrenceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SESMTOccurrence> }) => 
      sesmtService.updateOccurrence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesmt-occurrences'] });
      setSelectedOccurrence(null);
      toast({
        title: "Sucesso!",
        description: "Ocorrência atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Erro ao atualizar ocorrência.",
        variant: "destructive",
      });
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => 
      sesmtService.addComment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesmt-occurrence-comments'] });
      toast({
        title: "Sucesso!",
        description: "Comentário adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro!",
        description: "Erro ao adicionar comentário.",
        variant: "destructive",
      });
    }
  });

  // Handlers
  const handleCreateOccurrence = async () => {
    const formDataToSend = new FormData();
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        formDataToSend.append(key, value.toString());
      }
    });
    
    // Garantir que isConfidential seja sempre enviado
    formDataToSend.append('isConfidential', formData.isConfidential.toString());

    photos.forEach((photo, index) => {
      formDataToSend.append('photos', photo);
    });

    createOccurrenceMutation.mutate(formDataToSend);
  };

  const handleUpdateOccurrence = async (id: number, data: Partial<SESMTOccurrence>) => {
    updateOccurrenceMutation.mutate({ id, data });
  };

  const handleAddComment = async (occurrenceId: number, comment: string, isInternal: boolean = false) => {
    const formData = new FormData();
    formData.append('comment', comment);
    formData.append('isInternal', isInternal.toString());
    
    addCommentMutation.mutate({ id: occurrenceId, data: formData });
  };

  const resetForm = () => {
    setFormData({
      areaId: '',
      occurrenceTypeId: '',
      title: '',
      description: '',
      severity: 'medium',
      involvedPersons: '',
      dateTimeOccurrence: '',
      location: '',
      weatherConditions: '',
      equipmentInvolved: '',
      immediateActions: '',
      recommendations: '',
      isConfidential: false
    });
    setPhotos([]);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'investigating': return 'bg-yellow-500 text-black';
      case 'resolved': return 'bg-green-500 text-white';
      case 'closed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Shield className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SESMT</h1>
          <p className="text-gray-600">Serviços Especializados em Engenharia de Segurança e em Medicina do Trabalho</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
              <DialogDescription>
                Preencha os dados da ocorrência de segurança do trabalho.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaId">Área *</Label>
                <Select value={formData.areaId} onValueChange={(value) => setFormData({...formData, areaId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder={areasLoading ? "Carregando..." : areasError ? "Erro ao carregar" : "Selecione a área"} />
                  </SelectTrigger>
                  <SelectContent>
                    {areasLoading && <SelectItem value="" disabled>Carregando áreas...</SelectItem>}
                    {areasError && <SelectItem value="" disabled>Erro ao carregar áreas</SelectItem>}
                    {areas?.map((area: any) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {areasError && (
                  <p className="text-sm text-red-500">Erro ao carregar áreas: {areasError.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occurrenceTypeId">Tipo de Ocorrência *</Label>
                <Select value={formData.occurrenceTypeId} onValueChange={(value) => setFormData({...formData, occurrenceTypeId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {occurrenceTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Título da ocorrência"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidade</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData({...formData, severity: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTimeOccurrence">Data/Hora da Ocorrência *</Label>
                <Input
                  id="dateTimeOccurrence"
                  type="datetime-local"
                  value={formData.dateTimeOccurrence}
                  onChange={(e) => setFormData({...formData, dateTimeOccurrence: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Local específico da ocorrência"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="involvedPersons">Pessoas Envolvidas</Label>
                <Input
                  id="involvedPersons"
                  value={formData.involvedPersons}
                  onChange={(e) => setFormData({...formData, involvedPersons: e.target.value})}
                  placeholder="Nomes das pessoas envolvidas"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weatherConditions">Condições Climáticas</Label>
                <Input
                  id="weatherConditions"
                  value={formData.weatherConditions}
                  onChange={(e) => setFormData({...formData, weatherConditions: e.target.value})}
                  placeholder="Condições do tempo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentInvolved">Equipamentos Envolvidos</Label>
                <Input
                  id="equipmentInvolved"
                  value={formData.equipmentInvolved}
                  onChange={(e) => setFormData({...formData, equipmentInvolved: e.target.value})}
                  placeholder="Equipamentos envolvidos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição detalhada da ocorrência"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateActions">Ações Imediatas</Label>
              <Textarea
                id="immediateActions"
                value={formData.immediateActions}
                onChange={(e) => setFormData({...formData, immediateActions: e.target.value})}
                placeholder="Ações imediatas tomadas"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recomendações</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                placeholder="Recomendações para evitar recorrência"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photos">Fotos</Label>
              <Input
                id="photos"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isConfidential"
                checked={formData.isConfidential}
                onChange={(e) => setFormData({...formData, isConfidential: e.target.checked})}
                className="rounded border-gray-300"
                aria-label="Marcar como ocorrência confidencial"
              />
              <Label htmlFor="isConfidential">Ocorrência Confidencial</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateOccurrence}
                disabled={createOccurrenceMutation.isPending}
              >
                {createOccurrenceMutation.isPending ? 'Registrando...' : 'Registrar Ocorrência'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar por título..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={filters.area} onValueChange={(value) => setFilters({...filters, area: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {areas?.map((area: any) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="investigating">Em Investigação</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as severidades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {occurrenceTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occurrences List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ocorrências...</p>
          </div>
        ) : occurrences?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ocorrência encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não há ocorrências registradas com os filtros aplicados.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Ocorrência
              </Button>
            </CardContent>
          </Card>
        ) : (
          occurrences?.map((occurrence) => (
            <Card key={occurrence.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(occurrence.severity)}>
                        {getSeverityIcon(occurrence.severity)}
                        {occurrence.severity}
                      </Badge>
                      <Badge className={getStatusColor(occurrence.status)}>
                        {occurrence.status}
                      </Badge>
                      {occurrence.isConfidential && (
                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                          Confidencial
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{occurrence.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {occurrence.areaName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(occurrence.dateTimeOccurrence), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {occurrence.reporterName}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOccurrence(occurrence)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOccurrence(occurrence);
                        // TODO: Implement edit mode
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {occurrence.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {occurrence.occurrenceTypeName}
                  </span>
                  {occurrence.involvedPersons && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {occurrence.involvedPersons}
                    </span>
                  )}
                  {occurrence.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {occurrence.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Occurrence Details Dialog */}
      {selectedOccurrence && (
        <Dialog open={!!selectedOccurrence} onOpenChange={() => setSelectedOccurrence(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getSeverityIcon(selectedOccurrence.severity)}
                {selectedOccurrence.title}
              </DialogTitle>
              <DialogDescription>
                Detalhes da ocorrência de segurança
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="comments">Comentários</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Área</Label>
                    <p>{selectedOccurrence.areaName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Tipo</Label>
                    <p>{selectedOccurrence.occurrenceTypeName}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Data/Hora</Label>
                    <p>{format(new Date(selectedOccurrence.dateTimeOccurrence), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Local</Label>
                    <p>{selectedOccurrence.location || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Pessoas Envolvidas</Label>
                    <p>{selectedOccurrence.involvedPersons || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Condições Climáticas</Label>
                    <p>{selectedOccurrence.weatherConditions || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Equipamentos Envolvidos</Label>
                    <p>{selectedOccurrence.equipmentInvolved || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Relatado por</Label>
                    <p>{selectedOccurrence.reporterName}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="font-semibold">Descrição</Label>
                  <p className="mt-1 text-gray-600">{selectedOccurrence.description || 'Sem descrição'}</p>
                </div>

                <div>
                  <Label className="font-semibold">Ações Imediatas</Label>
                  <p className="mt-1 text-gray-600">{selectedOccurrence.immediateActions || 'Não informado'}</p>
                </div>

                <div>
                  <Label className="font-semibold">Recomendações</Label>
                  <p className="mt-1 text-gray-600">{selectedOccurrence.recommendations || 'Não informado'}</p>
                </div>

                {selectedOccurrence.photos.length > 0 && (
                  <div>
                    <Label className="font-semibold">Fotos</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {selectedOccurrence.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="space-y-4">
                  {selectedOccurrenceComments?.map((comment) => (
                    <Card key={comment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm">{comment.userName}</CardTitle>
                            <CardDescription className="text-xs">
                              {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </CardDescription>
                          </div>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Interno
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{comment.comment}</p>
                        {comment.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {comment.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Foto comentário ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-4">
                  {selectedOccurrenceHistory?.map((history) => (
                    <Card key={history.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm">{history.userName}</CardTitle>
                            <CardDescription className="text-xs">
                              {format(new Date(history.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {history.action}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{history.comments}</p>
                        {history.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {history.photos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`Foto histórico ${index + 1}`}
                                className="w-full h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Funcionalidade de ações corretivas/preventivas será implementada em breve.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </MainLayout>
  );
};

export default SESMT;
