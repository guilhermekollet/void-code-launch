
import React from 'react';

export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#FEFEFE] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#61710C]"></div>
            <p className="text-gray-600 text-lg">Carregando despesas recorrentes...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
