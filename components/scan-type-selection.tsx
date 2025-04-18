"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SCAN_TYPES } from "@/lib/scan-types";

interface ScanType {
  id: string;
  name: string;
  description: string;
  details: string;
  imageUrl: string;
  aiModel: string;
}

interface ScanTypeSelectionProps {
  disabled: boolean;
  onScanTypeSelected: (scanTypeId: string) => void;
  selectedScanType: string | null;
  onChange?: (scanTypeId: string) => void;
}

export function ScanTypeSelection({
  disabled,
  onScanTypeSelected,
  selectedScanType,
  onChange,
}: ScanTypeSelectionProps) {
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <RadioGroup
        value={selectedScanType || ""}
        onValueChange={(value) => {
          if (onChange) {
            onChange(value);
          }
          onScanTypeSelected(value);
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {SCAN_TYPES.map((scanType: ScanType) => (
          <div
            key={scanType.id}
            className="flex items-start space-x-3 space-y-0"
          >
            <RadioGroupItem value={scanType.id} id={scanType.id} />
            <div className="grid gap-1.5">
              <Label htmlFor={scanType.id} className="font-medium">
                {scanType.name}
              </Label>
              <p className="text-sm text-muted-foreground">
                {scanType.description}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
