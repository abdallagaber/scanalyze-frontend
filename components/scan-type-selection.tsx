"use client";

import { useState, useMemo } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SCAN_TYPES, getLungAnalysisOptions } from "@/lib/scan-types";
import {
  Search,
  Brain,
  Activity,
  Circle,
  Eye,
  Bone,
  X,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScanType {
  id: string;
  name: string;
  aiModel: string;
  parentType?: string;
}

interface ScanTypeSelectionProps {
  disabled: boolean;
  onScanTypeSelected: (scanTypeId: string) => void;
  selectedScanType: string | null;
  onChange?: (scanTypeId: string) => void;
  onSelectionReset?: () => void;
}

// Icon mapping for different scan types
const getScanTypeIcon = (scanTypeId: string) => {
  switch (scanTypeId) {
    case "brain-analysis":
      return <Brain className="h-5 w-5 text-purple-600" />;
    case "lung-analysis-xray":
    case "lung-analysis-plasma":
      return <Activity className="h-5 w-5 text-blue-600" />;
    case "kidney-analysis":
      return <Circle className="h-5 w-5 text-orange-600" />;
    case "retinal-analysis":
      return <Eye className="h-5 w-5 text-green-600" />;
    case "knee-analysis":
      return <Bone className="h-5 w-5 text-amber-600" />;
    default:
      return <Brain className="h-5 w-5 text-gray-600" />;
  }
};

export function ScanTypeSelection({
  disabled,
  onScanTypeSelected,
  selectedScanType,
  onChange,
  onSelectionReset,
}: ScanTypeSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);

  // Get all scan types except the lung analysis sub-options
  const mainScanTypes = SCAN_TYPES.filter((scanType) => !scanType.parentType);
  const lungOptions = getLungAnalysisOptions();
  const allScanTypes = [...mainScanTypes, ...lungOptions];

  // Get selected scan type details
  const selectedScanTypeDetails = selectedScanType
    ? allScanTypes.find((scan) => scan.id === selectedScanType)
    : null;

  // Filter scan types based on search
  const filteredScanTypes = useMemo(() => {
    if (!searchQuery.trim()) return allScanTypes;

    return allScanTypes.filter((scan) =>
      scan.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allScanTypes, searchQuery]);

  // Group filtered scan types
  const { filteredMainTypes, filteredLungTypes } = useMemo(() => {
    const main = filteredScanTypes.filter((scan) => !scan.parentType);
    const lung = filteredScanTypes.filter(
      (scan) => scan.parentType === "lung-analysis"
    );
    return { filteredMainTypes: main, filteredLungTypes: lung };
  }, [filteredScanTypes]);

  const handleValueChange = (value: string) => {
    if (onChange) {
      onChange(value);
    }
    onScanTypeSelected(value);
    setShowDetailView(true);
  };

  const handleBackToSelection = () => {
    setShowDetailView(false);
    setSearchQuery(""); // Clear search when going back
    if (onSelectionReset) {
      onSelectionReset();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Show detail view when a scan type is selected
  if (selectedScanType && showDetailView && selectedScanTypeDetails) {
    return (
      <div className={disabled ? "pointer-events-none opacity-50" : ""}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {getScanTypeIcon(selectedScanType)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Selected Scan Type
                  </p>
                  <CardTitle className="text-xl font-bold">
                    {selectedScanTypeDetails.name}
                  </CardTitle>
                  {selectedScanType.includes("lung-analysis") && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {selectedScanType === "lung-analysis-xray"
                        ? "Using X-ray imaging technology"
                        : "Using plasma sample analysis"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={handleBackToSelection}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Change Selection</span>
              </Button>
              <div className="text-sm text-muted-foreground">
                Proceed to the next step when ready
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show selection view
  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {/* Search Controls */}
      <div className="mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scan types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Results indicator */}
        {searchQuery.trim() && (
          <div className="text-sm text-muted-foreground mt-2">
            {filteredScanTypes.length} scan type
            {filteredScanTypes.length !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {/* No Results Message */}
      {filteredScanTypes.length === 0 && searchQuery.trim() && (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">No scan types found</div>
          <Button variant="outline" size="sm" onClick={clearSearch}>
            Clear search
          </Button>
        </div>
      )}

      {/* Scan Types Selection */}
      {filteredScanTypes.length > 0 && (
        <RadioGroup
          value={selectedScanType || ""}
          onValueChange={handleValueChange}
          className="space-y-6"
        >
          {/* Regular scan types */}
          {filteredMainTypes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMainTypes.map((scanType: ScanType) => (
                <div
                  key={scanType.id}
                  className={`group relative rounded-lg border p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer ${
                    selectedScanType === scanType.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md"
                      : "border-border hover:border-accent-foreground/20 hover:shadow-sm"
                  }`}
                  onClick={() => handleValueChange(scanType.id)}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={scanType.id}
                      id={scanType.id}
                      className="mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getScanTypeIcon(scanType.id)}
                        <Label
                          htmlFor={scanType.id}
                          className="font-medium text-base cursor-pointer"
                        >
                          {scanType.name}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lung Analysis with sub-options */}
          {filteredLungTypes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-sm font-medium text-muted-foreground px-3 flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Lung Analysis Options
                </span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLungTypes.map((lungOption: ScanType) => (
                  <div
                    key={lungOption.id}
                    className={`group relative rounded-lg border p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer ${
                      selectedScanType === lungOption.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md"
                        : "border-border hover:border-accent-foreground/20 hover:shadow-sm"
                    }`}
                    onClick={() => handleValueChange(lungOption.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem
                        value={lungOption.id}
                        id={lungOption.id}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getScanTypeIcon(lungOption.id)}
                          <Label
                            htmlFor={lungOption.id}
                            className="font-medium text-base cursor-pointer"
                          >
                            {lungOption.name}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lungOption.id === "lung-analysis-xray"
                            ? "Analysis using X-ray imaging"
                            : "Analysis using plasma samples"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </RadioGroup>
      )}
    </div>
  );
}
