import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/app/services/products";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  isOrderCompleted: boolean;
  onAddToCart: (product: Product) => void;
}

export const ProductGrid = ({
  products,
  isLoading,
  isOrderCompleted,
  onAddToCart,
}: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className={`transition-shadow ${
              isOrderCompleted
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:shadow-lg"
            }`}
            onClick={() => !isOrderCompleted && onAddToCart(product)}
          >
            <CardContent className="p-4">
              <div className="aspect-square relative mb-3">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(product.price)}
              </p>
              <p className="text-xs text-gray-500">
                Stock: {product.stock || 0}
              </p>
              {product.categoryName && (
                <Badge variant="outline" className="text-xs mt-1">
                  {product.categoryName}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
