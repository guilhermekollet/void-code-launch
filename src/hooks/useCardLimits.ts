
import { useSubscription } from "./useSubscription";
import { useCreditCards } from "./useCreditCards";

export function useCardLimits() {
  const { data: subscription } = useSubscription();
  const { data: creditCards = [] } = useCreditCards();

  const getCardLimit = () => {
    return Infinity; // Sem limite de cartões
  };

  const getCurrentCardCount = () => {
    return creditCards.length;
  };

  const canAddCard = () => {
    return true; // Sempre pode adicionar cartões
  };

  const isLimitReached = () => {
    return false; // Nunca atinge o limite
  };

  return {
    cardLimit: getCardLimit(),
    currentCardCount: getCurrentCardCount(),
    canAddCard: canAddCard(),
    isLimitReached: isLimitReached()
  };
}
