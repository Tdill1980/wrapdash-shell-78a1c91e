import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Package, DollarSign } from "lucide-react";
import { useOrganizationProducts, Product } from "@/hooks/useOrganizationProducts";

const QUICK_ADD_TEMPLATES = [
  { name: "Full Vehicle Wrap", category: "wraps", pricing_type: "per_sqft" as const, price: 12 },
  { name: "Partial Wrap", category: "wraps", pricing_type: "per_sqft" as const, price: 14 },
  { name: "Chrome Delete", category: "wraps", pricing_type: "flat" as const, price: 450 },
  { name: "PPF - Full Front", category: "ppf", pricing_type: "flat" as const, price: 1800 },
  { name: "PPF - Hood Only", category: "ppf", pricing_type: "flat" as const, price: 800 },
  { name: "Window Tint - Full Vehicle", category: "tint", pricing_type: "flat" as const, price: 350 },
  { name: "Commercial Fleet Graphics", category: "commercial", pricing_type: "per_sqft" as const, price: 8 },
];

export default function MyProducts() {
  const { myProducts, wpwProducts, settings, loading, addProduct, updateProduct, deleteProduct, updateSettings } = useOrganizationProducts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    product_name: "",
    category: "wraps",
    pricing_type: "per_sqft" as "per_sqft" | "flat",
    price_per_sqft: "",
    flat_price: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      product_name: "",
      category: "wraps",
      pricing_type: "per_sqft",
      price_per_sqft: "",
      flat_price: "",
      description: "",
    });
    setEditingProduct(null);
  };

  const handleQuickAdd = async (template: typeof QUICK_ADD_TEMPLATES[0]) => {
    await addProduct({
      product_name: template.name,
      category: template.category,
      pricing_type: template.pricing_type,
      price_per_sqft: template.pricing_type === "per_sqft" ? template.price : null,
      flat_price: template.pricing_type === "flat" ? template.price : null,
      description: null,
      is_active: true,
      display_order: myProducts.length,
      product_type: "quote-only",
      woo_product_id: null,
      visibility: "organization",
    });
  };

  const handleSubmit = async () => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        product_name: formData.product_name,
        category: formData.category,
        pricing_type: formData.pricing_type,
        price_per_sqft: formData.pricing_type === "per_sqft" ? parseFloat(formData.price_per_sqft) : null,
        flat_price: formData.pricing_type === "flat" ? parseFloat(formData.flat_price) : null,
        description: formData.description || null,
      });
    } else {
      await addProduct({
        product_name: formData.product_name,
        category: formData.category,
        pricing_type: formData.pricing_type,
        price_per_sqft: formData.pricing_type === "per_sqft" ? parseFloat(formData.price_per_sqft) : null,
        flat_price: formData.pricing_type === "flat" ? parseFloat(formData.flat_price) : null,
        description: formData.description || null,
        is_active: true,
        display_order: myProducts.length,
        product_type: "quote-only",
        woo_product_id: null,
        visibility: "organization",
      });
    }
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      category: product.category,
      pricing_type: product.pricing_type,
      price_per_sqft: product.price_per_sqft?.toString() || "",
      flat_price: product.flat_price?.toString() || "",
      description: product.description || "",
    });
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Products & Services</h1>
          <p className="text-muted-foreground">Manage your custom products and pricing for quotes</p>
        </div>

        {/* WPW Wholesale Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              WPW Wholesale Integration
            </CardTitle>
            <CardDescription>
              Control whether WePrintWraps wholesale products appear in your quote builder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show WPW Wholesale Products</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, WPW products will appear in your quote builder alongside your custom services
                </p>
              </div>
              <Switch
                checked={settings.show_wpw_wholesale}
                onCheckedChange={(checked) => updateSettings({ show_wpw_wholesale: checked })}
              />
            </div>
            {settings.show_wpw_wholesale && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {wpwProducts.length} WPW products available for wholesale ordering
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Services</CardTitle>
            <CardDescription>
              Add common wrap shop services with one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {QUICK_ADD_TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(template)}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  {template.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Products Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                My Products & Services
              </CardTitle>
              <CardDescription>
                Your custom products with your pricing (margins already included)
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    Set your customer-facing price (your margin is already included)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={formData.product_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                      placeholder="Full Vehicle Wrap"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wraps">Wraps</SelectItem>
                        <SelectItem value="ppf">PPF</SelectItem>
                        <SelectItem value="tint">Window Tint</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="design">Design Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pricing Type</Label>
                    <Select
                      value={formData.pricing_type}
                      onValueChange={(value: "per_sqft" | "flat") => setFormData(prev => ({ ...prev, pricing_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_sqft">Per Square Foot</SelectItem>
                        <SelectItem value="flat">Flat Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.pricing_type === "per_sqft" ? (
                    <div>
                      <Label>Price per Sq Ft ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_per_sqft}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_sqft: e.target.value }))}
                        placeholder="12.00"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label>Flat Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.flat_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, flat_price: e.target.value }))}
                        placeholder="450.00"
                      />
                    </div>
                  )}
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Service details..."
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingProduct ? "Save Changes" : "Add Product"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {myProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No custom products yet</p>
                <p className="text-sm">Use the quick add buttons above or create a new product</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.product_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.pricing_type === "per_sqft" ? "Per Sq Ft" : "Flat"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.pricing_type === "per_sqft" 
                          ? `$${product.price_per_sqft?.toFixed(2)}/sqft`
                          : `$${product.flat_price?.toFixed(2)}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
