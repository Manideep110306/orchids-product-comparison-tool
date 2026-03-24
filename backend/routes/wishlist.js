const express = require('express');
const router = express.Router();

// In-memory wishlist (can be replaced with MongoDB)
let wishlist = [];

// GET /api/wishlist
router.get('/', (req, res) => {
  res.json({ wishlist });
});

// POST /api/wishlist
router.post('/', (req, res) => {
  const { productId, productName, image, minPrice, platforms } = req.body;
  if (!productId || !productName) {
    return res.status(400).json({ error: 'productId and productName required' });
  }
  const exists = wishlist.find((w) => w.productId === productId);
  if (exists) {
    return res.status(409).json({ error: 'Already in wishlist' });
  }
  const item = {
    productId,
    productName,
    image,
    minPrice,
    platforms,
    addedAt: new Date().toISOString(),
    priceHistory: [{ price: minPrice, timestamp: new Date().toISOString() }],
  };
  wishlist.push(item);
  res.status(201).json({ message: 'Added to wishlist', item });
});

// DELETE /api/wishlist/:id
router.delete('/:id', (req, res) => {
  const before = wishlist.length;
  wishlist = wishlist.filter((w) => w.productId !== req.params.id);
  if (wishlist.length === before) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
