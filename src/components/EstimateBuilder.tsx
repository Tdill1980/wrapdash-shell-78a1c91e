import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Plus, 
  FileText, 
  CheckSquare, 
  Paperclip, 
  StickyNote, 
  Package,
  Car,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { type LineItem } from "@/components/EstimateLineItems";
import { type VehicleSQFTOptions } from "@/lib/vehicleSqft";

interface VehicleInfo {
  year: string;
  make: string;
  model: string;
}

interface CustomerData {
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface EstimateBuilderProps {
  lineItems: LineItem[];
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onCreateJob: () => void;
  customerData: CustomerData;
  vehicleInfo: VehicleInfo | null;
  sqftOptions: VehicleSQFTOptions | null;
  installationCost: number;
  includeInstallation: boolean;
  status?: 'draft' | 'sent' | 'approved' | 'expired';
  quoteNumber?: string;
  createdDate?: string;
}

export function EstimateBuilder({
  lineItems,
  onRemoveItem,
  onAddItem,
  onCreateJob,
  customerData,
  vehicleInfo,
  sqftOptions,
  installationCost,
  includeInstallation,
  status = 'draft',
  quoteNumber,
  createdDate,
}: EstimateBuilderProps) {
  const [activeTab, setActiveTab] = useState("items");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const grandTotal = subtotal + (includeInstallation ? installationCost : 0);

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      {/* Header Section */}
      <div className="border-b border-border bg-muted/30 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Customer Info */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Customer</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="font-semibold text-foreground">
                  {customerData.company || customerData.name || 'No Customer'}
                </p>
                {customerData.company && customerData.name && (
                  <p className="text-xs text-muted-foreground">{customerData.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Status</span>
            <Badge variant="outline" className={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>

          {/* Quote Number */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Quote #</span>
            <p className="font-mono text-sm text-foreground">{quoteNumber || 'Not Saved'}</p>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Date</span>
            <p className="text-sm text-foreground">
              {createdDate || new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger 
              value="items" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="assets" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 text-sm"
            >
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Items Tab Content */}
        <TabsContent value="items" className="m-0">
          {/* Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground">Items</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCreateJob}
                disabled={lineItems.length === 0}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Create Job
              </Button>
              <Button size="sm" onClick={onAddItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Line Item
              </Button>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-12">#</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Product</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-20">Qty</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-20">Unit</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-20">Disc %</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-28">Unit Price</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-28">Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No items yet. Click "Add Line Item" to add products.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item, index) => (
                    <>
                      <tr key={item.id} className="group hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{index + 1}</td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => toggleRowExpand(item.id)}
                            className="flex items-start gap-2 text-left w-full"
                          >
                            {expandedRows.has(item.id) ? (
                              <ChevronUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{item.product_name}</p>
                              {item.panel_selections && (
                                <p className="text-xs text-primary mt-0.5">
                                  Panels: {Object.entries(item.panel_selections)
                                    .filter(([_, selected]) => selected)
                                    .map(([panel]) => panel.charAt(0).toUpperCase() + panel.slice(1))
                                    .join(', ')}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5 italic hover:text-foreground cursor-text">
                                + Add description...
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">Ea</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">0%</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold font-mono text-foreground">
                          ${item.line_total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveItem(item.id)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      {/* Expanded Vehicle Info Row */}
                      {expandedRows.has(item.id) && vehicleInfo && sqftOptions && (
                        <tr className="bg-muted/10">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="ml-8 space-y-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Car className="h-4 w-4 text-primary" />
                                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {sqftOptions.panels.hood > 0 && (
                                  <div className="p-2 bg-background rounded border border-border">
                                    <span className="text-muted-foreground">Hood:</span>
                                    <span className="ml-2 font-semibold">{sqftOptions.panels.hood.toFixed(1)} sqft</span>
                                  </div>
                                )}
                                {sqftOptions.panels.roof > 0 && (
                                  <div className="p-2 bg-background rounded border border-border">
                                    <span className="text-muted-foreground">Roof:</span>
                                    <span className="ml-2 font-semibold">{sqftOptions.panels.roof.toFixed(1)} sqft</span>
                                  </div>
                                )}
                                {sqftOptions.panels.sides > 0 && (
                                  <div className="p-2 bg-background rounded border border-border">
                                    <span className="text-muted-foreground">Sides:</span>
                                    <span className="ml-2 font-semibold">{sqftOptions.panels.sides.toFixed(1)} sqft</span>
                                  </div>
                                )}
                                {sqftOptions.panels.back > 0 && (
                                  <div className="p-2 bg-background rounded border border-border">
                                    <span className="text-muted-foreground">Rear:</span>
                                    <span className="ml-2 font-semibold">{sqftOptions.panels.back.toFixed(1)} sqft</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Total Coverage: <span className="font-semibold text-foreground">{item.sqft} sqft</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          {lineItems.length > 0 && (
            <div className="border-t border-border bg-muted/20 p-4">
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono">${subtotal.toFixed(2)}</span>
                  </div>
                  {includeInstallation && installationCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Installation:</span>
                      <span className="font-mono">${installationCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-bold text-lg font-mono text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="m-0 p-4">
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tasks assigned yet</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="m-0 p-4">
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No assets attached</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Upload Asset
            </Button>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="m-0 p-4">
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No notes added</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}