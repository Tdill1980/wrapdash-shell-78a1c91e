import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface LineItem {
  id: string;
  product_name: string;
  product_id?: string;
  quantity: number;
  sqft: number;
  unit_price: number;
  line_total: number;
  panel_selections?: {
    sides: boolean;
    back: boolean;
    hood: boolean;
    roof: boolean;
  } | null;
  notes?: string;
}

interface EstimateLineItemsProps {
  lineItems: LineItem[];
  onRemoveItem: (id: string) => void;
  installationCost: number;
  includeInstallation: boolean;
}

export function EstimateLineItems({
  lineItems,
  onRemoveItem,
  installationCost,
  includeInstallation,
}: EstimateLineItemsProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const grandTotal = subtotal + (includeInstallation ? installationCost : 0);

  if (lineItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📋 Estimate Items</h3>
        <span className="text-sm text-muted-foreground">
          {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {lineItems.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 group"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  {index + 1}.
                </span>
                <span className="font-medium">{item.product_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {item.sqft > 0 && <span>{item.sqft} sqft</span>}
                {item.quantity > 1 && <span>× {item.quantity}</span>}
                {item.panel_selections && (
                  <span className="text-primary">
                    ({Object.entries(item.panel_selections)
                      .filter(([_, selected]) => selected)
                      .map(([panel]) => panel)
                      .join(', ')})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-primary">
                ${item.line_total.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        
        {includeInstallation && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Installation:</span>
            <span className="font-semibold">${installationCost.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-lg font-bold">TOTAL:</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            ${grandTotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
