
import { useSubscription } from "./useSubscription";
import { useCreditCards } from "./useCreditCards";

export function useCardLimits() {
  const { data: subscription } = useSubscription();
  const { data: creditCards = [] } = useCreditCards();

  const getCardLimit = () => {
    const planType = subscription?.plan_type || 'basic';
    return planType === 'premium' ? 5 : 1;
  };

  const getCurrentCardCount = () => {
    return creditCards.length;
  };

  const canAddCard = () => {
    return getCurrentCardCount() < getCardLimit();
  };

  const isLimitReached = () => {
    return getCurrentCardCount() >= getCardLimit();
  };

  return {
    cardLimit: getCardLimit(),
    currentCardCount: getCurrentCardCount(),
    canAddCard: canAddCard(),
    isLimitReached: isLimitReached()
  };
}
