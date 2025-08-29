import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CapslockTextarea } from '@/components/ui/capslock-textarea';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onUpdate: (formData: FormData) => void;
  isLoading?: boolean;
}

export default function UpdateProgressModal({
  isOpen,
  onClose,
  task,
  onUpdate,
  isLoading = false
}: UpdateProgressModalProps) {
  const { toast } = useToast();
  const [currentProgress, setCurrentProgress] = useState(task?.currentProgress || 0);
  const [observations, setObservations] = useState('');
  const [actualHours, setActualHours] = useState(task?.actualHours || 0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validar tipos de arquivo
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Arquivo inválido',
          description: `${file.name} não é uma imagem válida`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    // Validar tamanho (máximo 5MB por arquivo)
    const sizeValidFiles = validFiles.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 5MB`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    // Validar quantidade (máximo 10 arquivos)
    if (selectedFiles.length + sizeValidFiles.length > 10) {
      toast({
        title: 'Muitos arquivos',
        description: 'Máximo de 10 arquivos permitidos',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFiles(prev => [...prev, ...sizeValidFiles]);

    // Criar previews
    sizeValidFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (currentProgress < 0 || currentProgress > 100) {
      toast({
        title: 'Progresso inválido',
        description: 'O progresso deve estar entre 0 e 100%',
        variant: 'destructive'
      });
      return;
    }

    const formData = new FormData();
    formData.append('currentProgress', currentProgress.toString());
    formData.append('observations', observations);
    formData.append('actualHours', actualHours.toString());

    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    onUpdate(formData);
  };

  const handleClose = () => {
    setCurrentProgress(task?.currentProgress || 0);
    setObservations('');
    setActualHours(task?.actualHours || 0);
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    if (progress >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusText = (progress: number) => {
    if (progress >= 100) return 'Concluído';
    if (progress >= 75) return 'Quase Concluído';
    if (progress >= 50) return 'Em Andamento';
    if (progress >= 25) return 'Iniciado';
    return 'Pendente';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Atualizar Progresso - {task?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progresso */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Progresso Atual: {currentProgress}% - {getStatusText(currentProgress)}
            </Label>
            <Slider
              value={[currentProgress]}
              onValueChange={(value) => setCurrentProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <div className={`text-center font-medium ${getStatusColor(currentProgress)}`}>
              {getStatusText(currentProgress)}
            </div>
          </div>

          {/* Horas Reais */}
          <div className="space-y-2">
            <Label htmlFor="actualHours">Horas Reais Trabalhadas</Label>
            <Input
              id="actualHours"
              type="number"
              step="0.5"
              min="0"
              value={actualHours}
              onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
              placeholder="0.0"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <CapslockTextarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="DESCREVA AS ATIVIDADES REALIZADAS, OBSERVAÇÕES IMPORTANTES, PROBLEMAS ENCONTRADOS..."
              rows={4}
            />
          </div>

          {/* Upload de Fotos */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Fotos/Documentos ({selectedFiles.length}/10)
            </Label>
            
            {/* Botão de Upload */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedFiles.length >= 10}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Fotos
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedFiles.length >= 10}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Selecionar fotos para upload"
            />

            {/* Preview das Fotos */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {selectedFiles[index]?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Informações sobre upload */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Formatos aceitos: JPG, PNG, GIF, WebP</p>
              <p>• Tamanho máximo: 5MB por arquivo</p>
              <p>• Máximo: 10 arquivos por atualização</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Progresso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
