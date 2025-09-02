import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Image, 
  X, 
  Upload, 
  Save,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { progressService } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  equipment: any;
  onSuccess: () => void;
}

export const UpdateProgressModal = ({ 
  isOpen, 
  onClose, 
  task, 
  equipment, 
  onSuccess 
}: UpdateProgressModalProps) => {
  const [currentProgress, setCurrentProgress] = useState(task?.currentProgress || 0);
  const [observations, setObservations] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleProgressChange = (value: number) => {
    setCurrentProgress(Math.max(0, Math.min(100, value)));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setPhotos(prev => [...prev, ...imageFiles]);
      toast.success(`${imageFiles.length} imagem(ns) anexada(s)`);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Usar câmera traseira se disponível
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      // Aguardar o vídeo estar pronto antes de definir srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
      
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhotos(prev => [...prev, file]);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
            toast.success('Foto capturada com sucesso!');
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleSubmit = async () => {
    if (currentProgress < 0 || currentProgress > 100) {
      toast.error('Progresso deve estar entre 0% e 100%');
      return;
    }

    setIsLoading(true);

    try {
      await progressService.updateProgress({
        equipmentId: equipment.id,
        discipline: task.discipline,
        currentProgress,
        observations,
        photos,
        taskId: task.id
      });

      toast.success('Progresso atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar progresso:', error);
      toast.error(error.message || 'Erro ao atualizar progresso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setPhotos([]);
    setObservations("");
    setCurrentProgress(task?.currentProgress || 0);
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Atualizar Progresso da Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Tarefa */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{task?.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Equipamento:</span>
                <p className="font-medium">{equipment?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Disciplina:</span>
                <Badge variant="outline">
                  {task?.discipline === 'electrical' ? 'Elétrica' :
                   task?.discipline === 'mechanical' ? 'Mecânica' : 'Civil'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Progresso Atual:</span>
                <p className="font-medium text-primary">{task?.currentProgress}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  variant={task?.status === 'completed' ? 'default' : 'outline'}
                  className={cn(
                    task?.status === 'completed' && 'bg-green-100 text-green-800 border-green-200'
                  )}
                >
                  {task?.status === 'completed' ? 'Concluída' :
                   task?.status === 'in-progress' ? 'Em Andamento' :
                   task?.status === 'pending' ? 'Pendente' : 'Em Pausa'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controles de Progresso */}
          <div className="space-y-3">
            <Label htmlFor="progress">Novo Progresso (%)</Label>
            <div className="space-y-4">
              {/* Barra deslizante melhorada */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="range"
                    id="progress-slider"
                    min="0"
                    max="100"
                    value={currentProgress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer progress-slider"
                    aria-label="Selecionar progresso da tarefa"
                  />
                  {/* Indicador de valor flutuante */}
                  <div 
                    className="absolute -top-8 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium pointer-events-none transition-all duration-200"
                    style={{ left: `${currentProgress}%` }}
                  >
                    {currentProgress}%
                  </div>
                </div>
                
                {/* Marcadores de progresso */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span className="flex flex-col items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>0%</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>25%</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>50%</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>75%</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                    <span>100%</span>
                  </span>
                </div>
              </div>
              
              {/* Input numérico e barra de progresso visual */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="progress-input" className="text-xs text-muted-foreground">Valor exato</Label>
                  <Input
                    id="progress-input"
                    type="number"
                    min="0"
                    max="100"
                    value={currentProgress}
                    onChange={(e) => handleProgressChange(Number(e.target.value))}
                    className="w-20 text-center font-medium"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progresso atual</span>
                    <span>{currentProgress}%</span>
                  </div>
                  <Progress value={currentProgress} className="h-3" />
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {currentProgress}%
                  </div>
                  <div className="text-xs text-muted-foreground">Completo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Descreva o trabalho realizado, observações importantes, etc..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>

          {/* Captura de Fotos */}
          <div className="space-y-3">
            <Label>Fotos e Documentação</Label>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                disabled={showCamera}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {showCamera ? 'Câmera Ativa' : 'Abrir Câmera'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Image className="h-4 w-4" />
                Anexar Imagens
              </Button>
              
                             <input
                 ref={fileInputRef}
                 type="file"
                 multiple
                 accept="image/*"
                 onChange={handleFileUpload}
                 className="hidden"
                 aria-label="Selecionar imagens para anexar"
               />
            </div>

            {/* Câmera */}
            {showCamera && (
              <div className="border rounded-lg p-4 bg-black">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover rounded bg-gray-900"
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(console.error);
                      }
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Indicador de status da câmera */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <Button
                      onClick={capturePhoto}
                      size="sm"
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Camera className="h-4 w-4" />
                      Capturar
                    </Button>
                    <Button
                      onClick={stopCamera}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="h-4 w-4" />
                      Fechar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Imagens Anexadas */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {photos.length} imagem(ns) anexada(s)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumo da Atualização */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Resumo da Atualização:</p>
                <ul className="space-y-1">
                  <li>• Progresso alterado de {task?.currentProgress}% para {currentProgress}%</li>
                  {observations && <li>• Observações adicionadas</li>}
                  {photos.length > 0 && <li>• {photos.length} foto(s) anexada(s)</li>}
                  <li>• Histórico atualizado automaticamente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Progresso
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Estilos personalizados para o progress-slider */}
      <style>{`
        .progress-slider {
          background: linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${currentProgress}%, hsl(var(--muted)) ${currentProgress}%, hsl(var(--muted)) 100%);
        }
        
        .progress-slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 3px solid hsl(var(--background));
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        
        .progress-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        
        .progress-slider::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        
        .progress-slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 3px solid hsl(var(--background));
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }
        
        .progress-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }
        
        .progress-slider::-moz-range-thumb:active {
          transform: scale(0.95);
        }
        
        .progress-slider::-webkit-slider-track {
          background: transparent;
          border-radius: 8px;
        }
        
        .progress-slider::-moz-range-track {
          background: transparent;
          border-radius: 8px;
          border: none;
        }
        
        .progress-slider:focus {
          outline: none;
        }
        
        .progress-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .progress-slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3), 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Dialog>
  );
};
