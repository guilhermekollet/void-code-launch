// components/PaymentSuccess.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePaymentVerification } from '@/hooks/usePaymentVerification';
import { validateSessionId } from '@/utils/validation';
import { logger } from '@/utils/logger';
import { PaymentStatusCard } from '@/components/PaymentStatusCard/PaymentStatusCard';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { paymentStatus, verifyPayment } = usePaymentVerification();

  const sessionId = searchParams.get('session_id');
  const validSessionId = validateSessionId(sessionId);

  const handleContactSupport = (): void => {
    const whatsappUrl = 'https://wa.me/5551995915520';
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGoToDashboard = (): void => {
    navigate('/', { replace: true });
  };

  const handleBackToLogin = (): void => {
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (!validSessionId) {
      logger.error('Payment verification failed: Invalid session ID');
      return;
    }

    const timeoutId = setTimeout(() => {
      verifyPayment(validSessionId);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [validSessionId, verifyPayment]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <PaymentStatusCard
        status={validSessionId ? paymentStatus.status : 'error'}
        message={paymentStatus.message}
        userCreated={paymentStatus.userCreated}
        onContactSupport={handleContactSupport}
        onGoToDashboard={handleGoToDashboard}
        onBackToLogin={handleBackToLogin}
      />
    </div>
  );
};

export default PaymentSuccess;