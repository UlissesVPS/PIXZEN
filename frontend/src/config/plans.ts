// Configuracao centralizada de planos do PixZen
// Usado pelo modal de upsell, landing page e outras partes do app

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  period: string;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  badge?: string;
}

export interface SpecialOffer {
  enabled: boolean;
  text: string;
  firstMonthPrice?: number;
}

// Planos disponiveis
export const PLANS: Record<string, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 14.90,
    priceDisplay: 'R$ 14,90',
    period: '/mes',
    description: 'Perfeito para comecar a organizar suas financas',
    features: [
      { text: 'Transacoes ilimitadas', included: true },
      { text: 'Dashboard completo', included: true },
      { text: 'Graficos e relatorios', included: true },
      { text: 'Metas financeiras', included: true },
      { text: 'Todas as plataformas', included: true },
      { text: 'Integracao WhatsApp', included: false },
      { text: 'Registro por audio/foto', included: false },
    ],
    isPopular: false,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29.90,
    priceDisplay: 'R$ 29,90',
    period: '/mes',
    description: 'Controle total com inteligencia artificial',
    features: [
      { text: 'Tudo do Starter', included: true },
      { text: 'Integracao WhatsApp com IA', included: true },
      { text: 'Registro por audio e foto', included: true },
      { text: 'Transcricao automatica', included: true },
      { text: 'Categorizacao inteligente', included: true },
      { text: 'Suporte prioritario', included: true },
    ],
    isPopular: true,
    badge: 'Mais Popular',
  },
};

// Oferta especial (pode ser desabilitada)
export const SPECIAL_OFFER: SpecialOffer = {
  enabled: false, // Desabilitado por padrao - ativar quando houver promocao
  text: 'Primeiro mes por apenas R$ 14,90!',
  firstMonthPrice: 14.90,
};

// Plano padrao para upsell
export const DEFAULT_UPSELL_PLAN = 'premium';

// Funcao helper para obter plano
export const getPlan = (planId: string): Plan | undefined => {
  return PLANS[planId];
};

// Funcao helper para formatar preco
export const formatPrice = (price: number): string => {
  return price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};
