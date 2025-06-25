import React from 'react';

export function EmptyState() {
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-8">
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma despesa recorrente encontrada</h3>
        <p className="text-gray-500 text-center max-w-md">
          Marque uma despesa como recorrente ao criá-la para começar a acompanhar seus gastos fixos mensais.
        </p>
      </div>
    </div>
  );
}
