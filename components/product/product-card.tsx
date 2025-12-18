'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageUrl =
    product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg'

  const discountPercentage =
    product.compare_at_price && product.price < product.compare_at_price
      ? Math.round(
          ((product.compare_at_price - product.price) / product.compare_at_price) * 100,
        )
      : null

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {discountPercentage && (
            <Badge variant="danger" className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5">
              -{discountPercentage}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge variant="success" className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5">
              Featured
            </Badge>
          )}
        </div>
        <div className="p-3">
          {product.seller && (
            <p className="text-[11px] text-gray-500 mb-0.5 truncate">
              {product.seller.business_name}
            </p>
          )}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          {product.rating_average > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] text-gray-600">
                {product.rating_average.toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400">({product.total_reviews})</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base font-semibold text-gray-900">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-[11px] text-gray-400 line-through">
                {formatCurrency(product.compare_at_price, product.currency)}
              </span>
            )}
          </div>
          {product.stock_quantity > 0 ? (
            <p className="text-[11px] text-green-600 mt-1">In stock</p>
          ) : (
            <p className="text-[11px] text-red-600 mt-1">Out of stock</p>
          )}
        </div>
      </Link>
      {product.stock_quantity > 0 && onAddToCart && (
        <div className="px-3 pb-3">
          <Button
            onClick={(e) => {
              e.preventDefault()
              onAddToCart(product.id)
            }}
            size="sm"
            className="w-full text-xs"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to cart
          </Button>
        </div>
      )}
    </div>
  )
}
