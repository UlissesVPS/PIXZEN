import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLANS, SPECIAL_OFFER, DEFAULT_UPSELL_PLAN } from "@/config/plans";

interface TrialExpiredPopupProps {
  open: boolean;
  onSubscribe: () => void;
}

const TrialExpiredPopup = ({ open, onSubscribe }: TrialExpiredPopupProps) => {
  const navigate = useNavigate();

  // Obter plano para upsell
  const plan = PLANS[DEFAULT_UPSELL_PLAN];

  const handleSubscribeClick = () => {
    navigate('/#pricing');
  };

  if (!plan) return null;

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-white border-gray-200 max-w-sm w-[calc(100%-2rem)] p-0 overflow-hidden [&>button]:hidden rounded-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header compacto */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 px-5 py-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-2 w-16 h-16 rounded-full border border-white" />
            <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full border border-white" />
          </div>
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Periodo de teste acabou
            </h2>
            <p className="text-white/80 text-xs">
              Continue usando o PixZen!
            </p>
          </div>
        </div>

        {/* Conteudo */}
        <div className="px-5 py-4">
          <p className="text-gray-600 text-sm mb-4 text-center leading-relaxed">
            Seus 7 dias gratis acabaram. Assine para manter seu historico e continuar organizando suas financas.
          </p>

          {/* Card do plano */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-gray-900 font-semibold text-sm">Plano {plan.name}</span>
              {plan.isPopular && (
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded">
                  Popular
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-center gap-0.5 mb-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {plan.priceDisplay}
              </span>
              <span className="text-gray-500 text-xs">{plan.period}</span>
            </div>

            {/* Features compactas */}
            <div className="space-y-1.5">
              {plan.features.filter(f => f.included).slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                  </div>
                  <span className="text-gray-600">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Oferta especial (condicional) */}
          {SPECIAL_OFFER.enabled && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5 mt-3">
              <p className="text-emerald-700 text-xs text-center font-medium">
                {SPECIAL_OFFER.text}
              </p>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={handleSubscribeClick}
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/20 py-5 h-auto text-sm font-medium group transition-all duration-300 hover:scale-[1.02] rounded-xl"
          >
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Ver planos e assinar
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <p className="text-gray-400 text-[10px] text-center mt-3">
            Cancele quando quiser. Sem compromisso.
          </p>
        </div>

        {/* Footer compacto */}
        <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 px-5 py-2.5 border-t border-gray-100">
          <p className="text-gray-500 text-[10px] text-center">
            +50.000 usuarios ja assinaram o PixZen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredPopup;
