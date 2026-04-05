import { useQuery } from '@tanstack/react-query'
import {
  fetchBestsellerProducts,
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

export function useBestsellersQuery(tenantId: string, limit = 6) {
  return useQuery({
    queryKey: ['bestsellers', tenantId, limit],
    queryFn: () => fetchBestsellerProducts(tenantId, limit),
  })
}
