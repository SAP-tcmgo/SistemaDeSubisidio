import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PercentageRangeItemProps {
  index: number;
  rangeStart: string;
  rangeEnd: string;
  percentage: string;
  onRangeStartChange: (value: string) => void;
  onRangeEndChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onRemove: () => void;
  isRemovable: boolean;
}

const PercentageRangeItem: React.FC<PercentageRangeItemProps> = ({
  index,
  rangeStart,
  rangeEnd,
  percentage,
  onRangeStartChange,
  onRangeEndChange,
  onPercentageChange,
  onRemove,
  isRemovable
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border border-gray-200 rounded-md bg-white">
      <div className="flex-1">
        <label htmlFor={`rangeStart-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          De
        </label>
        <Input
          id={`rangeStart-${index}`}
          type="number"
          min="0"
          value={rangeStart}
          onChange={(e) => onRangeStartChange(e.target.value)}
          placeholder="Mínimo"
          className="w-full"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`rangeEnd-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          a
        </label>
        <Input
          id={`rangeEnd-${index}`}
          type="number"
          min="0"
          value={rangeEnd}
          onChange={(e) => onRangeEndChange(e.target.value)}
          placeholder="Máximo"
          className="w-full"
        />
      </div>
      <div className="flex-1">
        <label htmlFor={`percentage-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
          Percentual (%)
        </label>
        <Input
          id={`percentage-${index}`}
          type="number"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onPercentageChange(e.target.value)}
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
