import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PercentageRangeItemProps {
  index: number;
  maximo: string;
  minimo: string;
  porcentagem: string;
  onMaximoChange: (value: string) => void;
  onMinimoChange: (value: string) => void;
  onPorcentagemChange: (value: string) => void;
  onRemove: () => void;
  isRemovable: boolean;
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
  isRemovable
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border border-gray-200 rounded-md bg-white">
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
        />
      </div>
      {isRemovable && (
        <div className="mt-8">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X size={20} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PercentageRangeItem;
