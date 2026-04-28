const Cart = require('../models/CartModal');

async function loadCart(req, res, next) {
  try {
    if (!req.user) {
      res.locals.cart = [];
      res.locals.cartSubtotal = 0;
      return next();
    }

    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product');

    let subtotal = 0;

    if (cart) {
      cart.items.forEach(item => {
        const product = item.product;

        let price = 0;

        // determine price based on category
        if (product.category === 'AUTOMOBILE') {
          price = product.automobileDetails.price;
        } else if (product.category === 'DATA') {
          price = product.dataDetails.amount;
        } else if (product.category === 'ELECTRONICS') {
          price = product.electronicDetails.items_price;
        } else if (product.category === 'COURSES') {
          price = product.coursesDetails.course_price;
        }

        subtotal += price * item.quantity;
      });
    }

    res.locals.cart = cart ? cart.items : [];
    res.locals.cartSubtotal = subtotal;

  } catch (error) {
    console.log(error);
    res.locals.cart = [];
    res.locals.cartSubtotal = 0;
  }

  next();
}

module.exports = loadCart;