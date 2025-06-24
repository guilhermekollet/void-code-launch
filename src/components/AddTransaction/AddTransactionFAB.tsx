
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { AddTransactionModal } from "./AddTransactionModal";

export function AddTransactionFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <Button
        onClick={handleToggle}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-50 border-0"
        style={{ backgroundColor: '#61710C' }}
      >
        {isModalOpen ? (
          <X className="h-12 w-12 transition-transform duration-200 text-white" />
        ) : (
          <Plus className="h-12 w-12 transition-transform duration-200 text-white" />
        )}
      </Button>

      <AddTransactionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
