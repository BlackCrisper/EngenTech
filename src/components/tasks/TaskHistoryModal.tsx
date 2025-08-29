import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Calendar, User, Image as ImageIcon, Clock, FileText, Trash2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { tasksService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

interface HistoryEntry {
  id: number;
  action: string;
  previousProgress: number;
  newProgress: number;
  previousStatus: string;
  newStatus: string;
  observations: string;
  actualHours: number;
  photos: string;
  createdAt: string;
  ipAddress: string;
  updatedByUsername: string;
  updatedByRole: string;
}

export default function TaskHistoryModal({
  isOpen,
  onClose,
  task
}: TaskHistoryModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadHistory();
    }
  }, [isOpen, task?.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await tasksService.getTaskHistory(task.id);
      setHistory(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.response?.data?.error || 'Erro interno do servidor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em Andamento';
      case 'pending': return 'Pendente';
      case 'on-hold': return 'Em Pausa';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressChangeColor = (previous: number, current: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProgressChangeIcon = (previous: number, current: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <ArrowRight className="w-4 h-4 text-gray-600" />;
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!task?.id) return;
    
    if (!confirm('Tem certeza que deseja deletar este registro de histórico? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setDeletingHistoryId(historyId);
      await tasksService.deleteTaskHistory(task.id, historyId);
      
      // Remover o item do histórico local
      setHistory(prev => prev.filter(item => item.id !== historyId));
      
      toast({
        title: 'Histórico deletado',
        description: 'Registro de histórico deletado com sucesso',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar histórico',
        description: error.response?.data?.error || 'Erro interno do servidor',
        variant: 'destructive'
      });
    } finally {
      setDeletingHistoryId(null);
    }
  };

  const canDeleteHistory = () => {
    return user?.role === 'admin' || user?.role === 'supervisor';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Progresso - {task?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Tarefa */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Progresso Atual</h4>
                <p className="text-2xl font-bold">{task?.currentProgress}%</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Status</h4>
                <Badge className={getStatusColor(task?.status)}>
                  {getStatusText(task?.status)}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-600">Horas Trabalhadas</h4>
                <p className="text-lg font-semibold">{task?.actualHours || 0}h</p>
              </div>
            </div>
          </div>

          {/* Lista de Histórico */}
          <ScrollArea className="h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum histórico encontrado para esta tarefa.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                                                    {/* Cabeçalho do Entry */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">
                                      {formatDate(entry.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                      {entry.updatedByUsername}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {entry.updatedByRole}
                                    </Badge>
                                    {canDeleteHistory() && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteHistory(entry.id)}
                                        disabled={deletingHistoryId === entry.id}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        {deletingHistoryId === entry.id ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                        ) : (
                                          <Trash2 className="w-3 h-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                    {/* Mudança de Progresso */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Progresso:</span>
                        <span className="font-medium">{entry.previousProgress}%</span>
                        <span className={getProgressChangeColor(entry.previousProgress, entry.newProgress)}>
                          {getProgressChangeIcon(entry.previousProgress, entry.newProgress)}
                        </span>
                        <span className="font-medium">{entry.newProgress}%</span>
                      </div>
                      
                      {entry.actualHours > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            +{entry.actualHours}h trabalhadas
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mudança de Status */}
                    {(entry.previousStatus !== entry.newStatus) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(entry.previousStatus)}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <Badge className={getStatusColor(entry.newStatus)}>
                          {getStatusText(entry.newStatus)}
                        </Badge>
                      </div>
                    )}

                    {/* Observações */}
                    {entry.observations && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Observações:</span>
                        </div>
                        <p className="text-sm bg-gray-50 p-3 rounded border-l-2 border-blue-500">
                          {entry.observations}
                        </p>
                      </div>
                    )}

                    {/* Fotos */}
                    {entry.photos && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Fotos:</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {JSON.parse(entry.photos).map((photo: string, photoIndex: number) => (
                            <div key={photoIndex} className="relative group">
                              <img
                                src={photo}
                                alt={`Foto ${photoIndex + 1}`}
                                className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Informações Adicionais */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>IP: {entry.ipAddress || 'N/A'}</span>
                      <span>ID: #{entry.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
