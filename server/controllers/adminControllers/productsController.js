 const adminLayouts = 'layouts/adminLayout'
const { authenticateAdminUser } = require('../../config/authMiddleware');

const Category = require('../../models/CategoryModal');
const Product =  require('../../models/ProductsModal');


exports.createProducts = [authenticateAdminUser,async(req,res)=>{
    try{
         const category = await Category.find({})
    res.render('adminview/forms/add-products',{
        layout:adminLayouts,
        category
    })

    }catch(error){

        console.log(error)
    }
}]


exports.addProduct = [authenticateAdminUser,async (req, res) => {
  try {

    const { category, reward_point } = req.body;
    const imagePaths = req.files.map(file => '/uploads/' + file.filename);

    let productData = {
         category ,
         reward_point:reward_point,
         images:imagePaths,

        };

    // ✅ DATA
    if (category === 'DATA') {

      productData.dataDetails = {
        plan_id: req.body.plan_id,
        network: req.body.network,
        plan_type: req.body.plan_type,
        plan_name: req.body.plan_name,
        amount: req.body.amount,
        validate_period: req.body.validate_period
      };

    }

    //AUTOMOBILE
    else if (category === 'ELECTRONICS') {

      productData.electronicDetails = {
        itemName: req.body.itemName,
        brandItem: req.body.brandItem,
        itemtype: req.body.itemtype,
        items_price: req.body.items_price,
       
      };

    }
     //AUTOMOBILE
    else if (category === 'COURSES') {

      productData.coursesDetails = {
        title: req.body.title,
        instructor: req.body.instructor,
        course_description: req.body.course_description,
        course_price: req.body.course_price,
       
      };

    }

     // AUTOMOBILE
    else if (category === 'AUTOMOBILE') {

      productData.automobileDetails = {
        brand: req.body.brand,
        model: req.body.model,
        year: req.body.year,
        fuel_type: req.body.fuel_type,
        transmission: req.body.transmission,
        condition: req.body.condition,
        price: req.body.auto_price
      };

    }

    // 🛒 NORMAL PRODUCTS
    else {

      productData.item_name = req.body.item_name;
      productData.item_price = req.body.item_price;
      productData.description = req.body.description;
      // productData.piece_price = req.body.piece_price;
      // productData.item_type = req.body.item_type;

    }

    await Product.create(productData);

    res.redirect('/admin/product/create-products');

  } catch (error) {
    console.log(error);
    res.send('Error adding product');
  }
}];


exports.productDetails = [authenticateAdminUser,async(req,res)=>{

   try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Product not found' });
    }




}]