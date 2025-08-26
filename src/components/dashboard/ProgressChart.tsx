import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressItemProps {
  area: string;
  electrical: number;
  mechanical: number;
  civil: number;
  total: number;
  status: "on-track" | "delayed" | "completed";
}

const ProgressItem = ({ area, electrical, mechanical, civil, total, status }: ProgressItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "on-track": return "bg-primary text-primary-foreground";
      case "delayed": return "bg-destructive text-destructive-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Concluído";
      case "on-track": return "No Prazo";
      case "delayed": return "Atrasado";
      default: return "Pendente";
    }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">{area}</h4>
        <Badge className={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Elétrica</span>
            <span className="font-medium">{electrical}%</span>
          </div>
          <Progress value={electrical} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mecânica</span>
            <span className="font-medium">{mechanical}%</span>
          </div>
          <Progress value={mechanical} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Civil</span>
            <span className="font-medium">{civil}%</span>
          </div>
          <Progress value={civil} className="h-2" />
        </div>
      </div>
      
      <div className="pt-2 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground">Progresso Total</span>
          <span className="text-lg font-bold text-primary">{total}%</span>
        </div>
        <Progress value={total} className="h-3 mt-1" />
      </div>
    </div>
  );
};

export const ProgressChart = () => {
  const progressData: ProgressItemProps[] = [
    {
      area: "Área de Produção A",
      electrical: 85,
      mechanical: 72,
      civil: 90,
      total: 82,
      status: "on-track"
    },
    {
      area: "Área de Produção B", 
      electrical: 95,
      mechanical: 88,
      civil: 100,
      total: 94,
      status: "on-track"
    },
    {
      area: "Estação de Ensacamento",
      electrical: 45,
      mechanical: 60,
      civil: 30,
      total: 45,
      status: "delayed"
    },
    {
      area: "Laboratório de Qualidade",
      electrical: 100,
      mechanical: 100,
      civil: 100,
      total: 100,
      status: "completed"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso por Área</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {progressData.map((item, index) => (
            <ProgressItem key={index} {...item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};