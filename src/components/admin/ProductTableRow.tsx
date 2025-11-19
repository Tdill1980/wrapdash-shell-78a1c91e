import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, ShoppingCart, Edit, Save, X } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isWPW } from "@/lib/wpwProducts";
import { useToast } from "@/hooks/use-toast";

interface ProductTableRowProps {
  product: Product;
  onUpdate: (id: string, updates: Partial<Product>) => Promise<void>;
}

export function ProductTableRow({ product, onUpdate }: ProductTableRowProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    product_name: product.product_name,
    category: product.category,
  });
  const [isSaving, setIsSaving] = useState(false);

  const isWPWProduct = product.woo_product_id && isWPW(product.woo_product_id);
  const isLocked = product.is_locked;

  const handleEdit = () => {
    if (isLocked) {
      toast({
        title: "Cannot Edit",
        description: "This product is locked and cannot be edited.",
        variant: "destructive",
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isLocked) return;

    try {
      setIsSaving(true);
      await onUpdate(product.id, editData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      product_name: product.product_name,
      category: product.category,
    });
    setIsEditing(false);
  };

  const handleToggleActive = async () => {
    try {
      await onUpdate(product.id, { is_active: !product.is_active });
      toast({
        title: "Success",
        description: `Product ${product.is_active ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status.",
        variant: "destructive",
      });
    }
  };

  return (
    <TableRow className={!product.is_active ? "opacity-50" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          {isLocked && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          {isWPWProduct && (
            <Badge variant="outline" className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
              <ShoppingCart className="h-3 w-3 mr-1" />
              WPW
            </Badge>
          )}
          {!isWPWProduct && (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Quote Only
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            value={editData.product_name}
            onChange={(e) => setEditData(prev => ({ ...prev, product_name: e.target.value }))}
            className="max-w-xs"
            disabled={isLocked}
          />
        ) : (
          <div className="font-medium">{product.product_name}</div>
        )}
      </TableCell>

      <TableCell>
        {isEditing ? (
          <Input
            value={editData.category || ""}
            onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
            className="max-w-xs"
            disabled={isLocked}
          />
        ) : (
          <span className="text-muted-foreground">{product.category || "—"}</span>
        )}
      </TableCell>

      <TableCell>
        {isWPWProduct && product.woo_product_id ? (
          <span className="font-mono text-sm text-primary">#{product.woo_product_id}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <span className="text-sm capitalize">{product.pricing_type.replace('_', ' ')}</span>
      </TableCell>

      <TableCell>
        {product.pricing_type === 'per_sqft' && product.price_per_sqft ? (
          <span className="font-mono text-sm">${product.price_per_sqft}/sqft</span>
        ) : product.flat_price ? (
          <span className="font-mono text-sm">${product.flat_price}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <Switch
          checked={product.is_active}
          onCheckedChange={handleToggleActive}
        />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving || isLocked}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              disabled={isLocked}
              className={isLocked ? "cursor-not-allowed opacity-50" : ""}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
