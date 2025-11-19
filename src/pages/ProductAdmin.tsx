import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { ProductTableRow } from "@/components/admin/ProductTableRow";
import { Lock, ShoppingCart, Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProductAdmin() {
  const { products, loading, updateProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "wpw" | "quote-only">("all");

  // Filter products based on search and type
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = 
      filterType === "all" ? true :
      filterType === "wpw" ? product.product_type === "wpw" :
      product.product_type === "quote-only";

    return matchesSearch && matchesType;
  });

  const wpwCount = products.filter(p => p.product_type === "wpw").length;
  const quoteOnlyCount = products.filter(p => p.product_type === "quote-only").length;
  const lockedCount = products.filter(p => p.is_locked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage WPW cart products and quote-only items
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-3xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              WPW Products
            </CardDescription>
            <CardTitle className="text-3xl text-primary">{wpwCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quote Only</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{quoteOnlyCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked Products
            </CardDescription>
            <CardTitle className="text-3xl">{lockedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Security Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Products marked with <Lock className="h-3 w-3 inline mx-1" /> are locked 
          and cannot be edited. WPW products are restricted to their WooCommerce configuration.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "wpw" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("wpw")}
                className={filterType === "wpw" ? "bg-gradient-to-r from-primary to-blue-600" : ""}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                WPW Only
              </Button>
              <Button
                variant={filterType === "quote-only" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("quote-only")}
              >
                Quote Only
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[120px]">WC ID</TableHead>
                  <TableHead className="w-[120px]">Pricing Type</TableHead>
                  <TableHead className="w-[120px]">Price</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No products found
                    </td>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <ProductTableRow
                      key={product.id}
                      product={product}
                      onUpdate={updateProduct}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
                <ShoppingCart className="h-3 w-3 mr-1" />
                WPW
              </Badge>
              <span className="text-muted-foreground">Can be added to cart</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                Quote Only
              </Badge>
              <span className="text-muted-foreground">Quote system only</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Locked (cannot edit)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
