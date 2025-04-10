import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; // Import Trash2

export interface PercentageRangeItemProps { // Export interface
  index: number;
  maximo: string;
  minimo: string;
  porcentagem: string;
  onMaximoChange: (value: string) => void;
  onMinimoChange: (value: string) => void;
  onPorcentagemChange: (value: string) => void;
  onRemove: () => void;
  isRemovable: boolean;
  isDisabled?: boolean; // Add isDisabled prop
}

const PercentageRangeItem: React.FC<PercentageRangeItemProps> = ({
  index,
  maximo,
  minimo,
  porcentagem,
  onMaximoChange,
  onMinimoChange,
  onPorcentagemChange,
  onRemove,
  isRemovable,
  isDisabled // Destructure isDisabled
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border rounded-md ${isDisabled ? 'bg-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
      <div className="flex-1">
        <label htmlFor={`maximo-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          De
        </label>
        <Input
          id={`maximo-${index}`}
          type="number"
          min="0"
          value={maximo}
          onChange={(e) => onMaximoChange(e.target.value)}
          placeholder="Mínimo"
          className="w-full"
          disabled={isDisabled} // Apply disabled state
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`minimo-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          a
        </label>
        <Input
          id={`minimo-${index}`}
          type="number"
          min="0"
          value={minimo}
          onChange={(e) => onMinimoChange(e.target.value)}
          placeholder="Máximo"
          className="w-full"
          disabled={isDisabled} // Apply disabled state
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`porcentagem-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          Percentual (%)
        </label>
        <Input
          id={`porcentagem-${index}`}
          type="number"
          min="0"
          max="100"
          value={porcentagem}
          onChange={(e) => onPorcentagemChange(e.target.value)}
          placeholder="Percentual"
          className="w-full"
          disabled={isDisabled} // Apply disabled state
        />
      </div>
      {isRemovable && (
         <div className="mt-auto pt-4 md:pt-0 md:mt-0"> {/* Adjust margin for alignment */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 disabled:opacity-50"
            disabled={isDisabled} // Apply disabled state to button
            aria-label="Remover faixa percentual"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PercentageRangeItem;
