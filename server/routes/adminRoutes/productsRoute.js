const express = require('express');
const router = express.Router();

const upload = require('../../config/multer');
const getProducts = require('../../controllers/adminControllers/productsController');

router.get('/create-products', getProducts.createProducts);
router.post('/add-product', upload.array('images', 3), getProducts.addProduct);
router.get('/view-products',  getProducts.viewProducts);
router.get('/view-users',     getProducts.userView);
router.get('/details/:id',    getProducts.productDetails);
router.get('/view-transactions', getProducts.viewTransactions);
router.get('/view-topUps',       getProducts.viewTopUps);

router.get('/edit-product/:id',  getProducts.editProductGet);
router.post('/edit-product/:id', upload.array('images', 3), getProducts.editProductPost);
router.post('/delete-product/:id', getProducts.deleteProduct);

router.get('/payment-methods',          getProducts.viewPaymentMethods);
router.post('/payment-methods/add',     getProducts.addPaymentMethod);
router.get('/payment-methods/toggle/:id', getProducts.togglePaymentMethod);
router.get('/payment-methods/delete/:id', getProducts.deletePaymentMethod);

module.exports = router;
