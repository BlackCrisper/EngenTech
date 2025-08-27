// Configuração da API que detecta automaticamente o IP da máquina
const getApiBaseUrl = () => {
  // Se estiver em desenvolvimento local, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3010/api';
  }
  
  // Se estiver acessando de outro dispositivo, usar o IP da máquina atual
  // Pegar o hostname atual (que será o IP da máquina) e usar a porta 3010
  const currentHost = window.location.hostname;
  return `http://${currentHost}:3010/api`;
};

export const API_BASE_URL = getApiBaseUrl();
