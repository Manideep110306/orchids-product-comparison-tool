import { ShoppingCart, Heart, TrendingUp } from './Icons';

export default function Header({ wishlistCount = 0, onWishlistClick }) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Shop</span>
              <span className="text-xl font-bold text-blue-600 tracking-tight">Compare</span>
            </div>
          </div>

          {/* Tagline — desktop only */}
          <p className="hidden md:block text-sm text-slate-500 font-medium">
            Compare prices across Amazon, Flipkart & more
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onWishlistClick}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Heart className="w-5 h-5" />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
