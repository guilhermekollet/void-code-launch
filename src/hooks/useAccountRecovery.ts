
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface RecoveryResult {
  success: boolean;
  recovered: boolean;
  planType?: string;
  billingCycle?: string;
  trialEnd?: string;
  message?: string;
  error?: string;
}

export function useAccountRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  const verifyAndRecoverPlan = useCallback(async (sessionId?: string, email?: string): Promise<RecoveryResult> => {
    if (!sessionId && !email) {
      return { success: false, recovered: false, error: 'Session ID ou email necessário' };
    }

    setIsRecovering(true);
    console.log('[useAccountRecovery] Starting plan verification', { sessionId, email });

    try {
      const { data, error } = await supabase.functions.invoke('verify-and-recover-plan', {
        body: { sessionId, email }
      });

      if (error) {
        console.error('[useAccountRecovery] Error:', error);
        return { success: false, recovered: false, error: error.message };
      }

      console.log('[useAccountRecovery] Result:', data);

      if (data.recovered) {
        toast({
          title: "Conta Recuperada!",
          description: "Seus dados foram sincronizados com sucesso.",
        });
      }

      return data;
    } catch (error) {
      console.error('[useAccountRecovery] Exception:', error);
      return { 
        success: false, 
        recovered: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    } finally {
      setIsRecovering(false);
    }
  }, [toast]);

  return {
    verifyAndRecoverPlan,
    isRecovering
  };
}
