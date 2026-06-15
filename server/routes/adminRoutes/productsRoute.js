const express = require('express')
const router = express.Router()

const upload = require('../../config/multer');
const getProducts = require('../../controllers/adminControllers/productsController')


router.get('/create-products',getProducts.createProducts)

router.post('/add-product',upload.array('images', 3),getProducts.addProduct)

router.get('/view-products',getProducts.viewProducts)

router.get('/view-users',getProducts.userView)

router.get('/details/:id',getProducts.productDetails)

router.get('/view-transactions',getProducts.viewTransactions)

router.get('/view-topUps',getProducts.viewTopUps)



module.exports = router;