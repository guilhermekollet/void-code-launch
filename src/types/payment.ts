// types/payment.ts

export interface PaymentStatus {
    status: 'loading' | 'success' | 'error';
    message?: string;
    userCreated?: boolean;
  }
  
  export interface PaymentVerificationResult {
    success: boolean;
    userCreated?: boolean;
    message?: string;
  }
  
  export interface UserData {
    id: number;
    email: string;
    completed_onboarding: boolean;
    plan_type: string;
    billing_cycle: string;
    trial_end: string;
  }
  
  export interface OnboardingData {
    id: string;
    email: string;
    payment_confirmed: boolean;
    stripe_session_id: string;
  }
  
  export interface PaymentVerificationConfig {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  }