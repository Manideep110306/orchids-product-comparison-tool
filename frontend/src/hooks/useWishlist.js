import { useState, useEffect, useCallback } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist } from '../services/searchService';

export function useWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setWishlist(data.wishlist || []);
    } catch {
      // fail silently
    }
  };

  const addItem = useCallback(async (item) => {
    setLoading(true);
    try {
      await addToWishlist(item);
      await fetchWishlist();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (id) => {
    setLoading(true);
    try {
      await removeFromWishlist(id);
      setWishlist((prev) => prev.filter((w) => w.productId !== id));
    } finally {
      setLoading(false);
    }
  }, []);

  const isInWishlist = useCallback(
    (id) => wishlist.some((w) => w.productId === id),
    [wishlist]
  );

  return { wishlist, loading, addItem, removeItem, isInWishlist };
}
