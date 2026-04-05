import { Route, Router, Switch, useLocation } from 'wouter'
import { AdminCategoriesPage } from '@/pages/admin/categories'
import { AdminCouponsPage } from '@/pages/admin/coupons'
import { AdminCustomersPage } from '@/pages/admin/customers'
import { AdminDashboardPage } from '@/pages/admin/dashboard'
import { AdminLoginPage } from '@/pages/admin/login'
import { AdminOrdersPage } from '@/pages/admin/orders'
import { AdminProductsPage } from '@/pages/admin/products'
import { AdminSettingsPage } from '@/pages/admin/settings'
import { AdminTeamPage } from '@/pages/admin/team'
import { AdminThemePage } from '@/pages/admin/theme'
import { CartPage } from '@/pages/cart'
import { CheckoutPage } from '@/pages/checkout'
import { ConfirmationPage } from '@/pages/confirmation'
import { CouponsPage } from '@/pages/coupons'
import { DriverPage } from '@/pages/driver'
import { InvitePage } from '@/pages/invite'
import { IndexPage } from '@/pages/index'
import { KitchenPage } from '@/pages/kitchen'
import { LoginPage } from '@/pages/login'
import { MenuPage } from '@/pages/menu'
import { OrdersPage } from '@/pages/orders'
import { ProductPage } from '@/pages/product'
import { ProfilePage } from '@/pages/profile'
import { TrackingPage } from '@/pages/tracking'
import { AppLayout } from '@/components/layout/AppLayout'
import { CartSidebar } from '@/components/cart/CartSidebar'
import { useCartSync } from '@/hooks/useCartSync'
import { useReferralCapture } from '@/hooks/useReferralCapture'

function CartSyncHost() {
  useCartSync()
  return null
}

function ReferralCaptureHost() {
  useReferralCapture()
  return null
}

function CartSidebarGate() {
  const [loc] = useLocation()
  const hideCart =
    loc.startsWith('/kitchen') ||
    loc.startsWith('/driver') ||
    loc.startsWith('/admin') ||
    loc.startsWith('/invite')
  if (hideCart) return null
  return <CartSidebar />
}

function NotFoundPage() {
  return (
    <AppLayout title="Seite nicht gefunden">
      <p className="text-text-secondary">Diese Route existiert noch nicht.</p>
    </AppLayout>
  )
}

export default function App() {
  return (
    <>
      <CartSyncHost />
      <ReferralCaptureHost />
      <Router>
      <Switch>
        <Route path="/" component={IndexPage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/confirmation" component={ConfirmationPage} />
        <Route path="/tracking" component={TrackingPage} />
        <Route path="/coupons" component={CouponsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/dashboard" component={AdminDashboardPage} />
        <Route path="/admin/products" component={AdminProductsPage} />
        <Route path="/admin/categories" component={AdminCategoriesPage} />
        <Route path="/admin/orders" component={AdminOrdersPage} />
        <Route path="/admin/coupons" component={AdminCouponsPage} />
        <Route path="/admin/customers" component={AdminCustomersPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route path="/admin/theme" component={AdminThemePage} />
        <Route path="/admin/team" component={AdminTeamPage} />
        <Route path="/invite/:token" component={InvitePage} />
        <Route path="/kitchen" component={KitchenPage} />
        <Route path="/driver" component={DriverPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Router>
      <CartSidebarGate />
    </>
  )
}
