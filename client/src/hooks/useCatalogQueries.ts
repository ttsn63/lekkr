import { useQuery } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchProductById,
  fetchProducts,
} from '@/lib/queries/catalog'

export function useCategoriesQuery(tenantId: string) {
  return useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => fetchCategories(tenantId),
  })
}

export function useProductsQuery(tenantId: string) {
  return useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => fetchProducts(tenantId),
  })
}

export function useProductQuery(tenantId: string, productId: string | undefined) {
  return useQuery({
    queryKey: ['product', tenantId, productId],
    queryFn: () => fetchProductById(tenantId, productId!),
    enabled: Boolean(tenantId && productId),
  })
}
