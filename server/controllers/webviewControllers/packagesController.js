
const { buyData  } = require('../../services/ourdatastore');
const Product = require('../../models/ProductsModal')
const Checkout = require('../../models/CheckoutModal')
const User = require('../../models/UserModel')
const Cart = require('../../models/CartModal')
const Wallet = require('../../models/WalletModal')
const TopUp = require('../../models/TopUpModal')
const Transaction = require('../../models/TransactionModel')
const axios = require('axios');
const mongoose = require('mongoose');





exports.packagesView = async (req, res) => {
   try {

    const products = await Product.find();

    // ✅ FILTER BY CATEGORY
   const dataProducts = await Product.find({ category: 'DATA' });
const automobileProducts = await Product.find({ category: 'AUTOMOBILE' });
const electronicProducts = await Product.find({ category: 'ELECTRONICS' });
const coursesProducts = await Product.find({ category: 'COURSES' });
console.log("corses",coursesProducts)
    const otherProducts = products.filter(
      p => p.category !== 'DATA' && p.category !== 'AUTOMOBILE' && p.category !== 'ELECTRONICS' && p.category !== 'COURSES'
    );

    res.render('webview/index', {
      dataProducts,
      automobileProducts,
      electronicProducts,
      coursesProducts,
      otherProducts
    });

  } catch (error) {
    console.log(error);
    res.send('Error loading products');
  }
};

// exports.checkout = (req,res)=>{

// res.render('webview/checkout')

// }

exports.dataForm = async(req,res)=>{
try{
    res.render("webview/dataform")
}catch(error){
  
}



}



// CREATE CHECKOUT
exports.initiateCheckout = async (req, res) => {
  try {
    const { packageId, phone } = req.body;

    const userId = req.user.id;

    const newCheckout = await Checkout.create({
      user: userId,
      product: packageId,
      phone
    });

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error creating checkout' });
  }
};

// VIEW CHECKOUT
exports.checkoutPage = async (req, res) => {
  try {
    const userId = req.user.id;

    const checkout = await Checkout.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product');

    console.log("checkout:", checkout);

    if (!checkout) {
      return res.render('webview/checkout', { checkout: null });
    }

    res.render('webview/checkout', { checkout });

  } catch (error) {
    console.log("ERROR:", error);
    res.send('Error loading checkout');
  }
};



exports.walletCheckout = async (req, res) => {
  try {
    const userId = req.user.id;

    const checkout = await Checkout.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product');

    if (!checkout) {
      req.flash('error', 'No checkout found');
      return res.redirect('/checkout');
    }

    const amount = checkout.product.dataDetails.amount;

    const user = await User.findById(userId);

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/checkout');
    }

    if (user.walletBalance < amount) {
      req.flash('error', 'Insufficient balance');
      return res.redirect('/checkout');
    }

    // Deduct balance
    user.walletBalance -= amount;
    await user.save();

    // ✅ FIX PHONE
    let phone = checkout.phone.trim();
    phone = phone.replace(/\D/g, '');

    if (phone.startsWith('234')) {
      phone = '0' + phone.slice(3);
    }

    if (phone.length !== 11) {
      req.flash('error', 'Phone number must be 11 digits');
      return res.redirect('/checkout');
    }

    // const apiResponse = await buyData({
    //   network: checkout.package.network === 'MTN' ? 1 : 2,
    //   phone: phone,
    //   data_plan: checkout.package.plan_id
    // });

    let apiResponse;

try {
  apiResponse = await buyData({
    network: checkout.product.dataDetails.network === 'MTN' ? 1 : 2,
    phone: phone,
    data_plan: checkout.product.dataDetails.plan_id
  });

} catch (err) {
  console.log("API ERROR:", err.response?.data);

  apiResponse = {
    status: 'fail',
    message: err.response?.data?.message || 'API error'
  };
}

    console.log("About to save transaction...");

    await Transaction.create({
      user: userId,
      package: checkout.product._id,
      phone: phone,
      amount,
      status: apiResponse.status === 'success' ? 'success' : 'failed',
      reference: `TX-${Date.now()}`,
      apiResponse
    });

    console.log("API RESPONSE:", apiResponse);

    if (apiResponse.status !== 'success') {
      user.walletBalance += amount;
      await user.save();

      req.flash('error', 'Transaction failed, refunded');
      return res.redirect('/checkout');
    }

    req.flash('success', 'Payment successful, data sent!');
    return res.redirect('/checkout');

  } catch (error) {
    console.log(error);
    req.flash('error', 'Wallet payment error');
    return res.redirect('/checkout');
  }
};

exports.history = async (req,res)=>{

    try {
    const transactions = await Transaction.find({ user: req.user.id })
      .populate('package')
      .sort({ createdAt: -1 });

    res.render('webview/history', { transactions });

  } catch (error) {
    console.log(error);
    res.send('Error loading history');
  }
}

exports.retryTransaction = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId)
      .populate('package');

    if (!tx) {
      return res.json({ success: false, message: 'Transaction not found' });
    }

    if (tx.status === 'success') {
      return res.json({ success: false, message: 'Already successful' });
    }

    const user = await User.findById(tx.user);

    if (user.walletBalance < tx.amount) {
      return res.json({ success: false, message: 'Insufficient balance' });
    }

    // Deduct again
    user.walletBalance -= tx.amount;
    await user.save();

    let apiResponse;

    try {
      apiResponse = await buyData({
        network: tx.package.network === 'MTN' ? 1 : 2,
        phone: tx.phone,
        data_plan: tx.package.plan_id
      });

    } catch (err) {
      apiResponse = { status: 'fail', message: 'API error' };
    }

    // Update transaction
    tx.status = apiResponse.status === 'success' ? 'success' : 'failed';
    tx.apiResponse = apiResponse;
    await tx.save();

    // Refund if failed again
    if (tx.status !== 'success') {
      user.walletBalance += tx.amount;
      await user.save();
    }

    return res.json({ success: tx.status === 'success', message: apiResponse.message });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Retry failed' });
  }
};



exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity: 1 }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
    }

    await cart.save();

    res.json({ success: true });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error adding to cart' });
  }
};


exports.itemCheckout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.render('webview/item-checkout', { cart: [], total: 0 });
    }

    let total = 0;
    let totalItems = 0;

    const formattedCart = cart.items.map(item => {
      const product = item.product;

      let name = '';
      let price = 0;

      if (product.category === 'AUTOMOBILE') {
        name = `${product.automobileDetails.brand} ${product.automobileDetails.model}`;
        price = product.automobileDetails.price;

      } else if (product.category === 'DATA') {
        name = product.dataDetails.plan_name;
        price = product.dataDetails.amount;

      } else if (product.category === 'ELECTRONICS') {
        name = product.electronicDetails.itemName;
        price = product.electronicDetails.items_price;

      } else if (product.category === 'COURSES') {
        name = product.coursesDetails.title;
        price = product.coursesDetails.course_price;
      }

      const subtotal = price * item.quantity;

      total += subtotal;
      totalItems += item.quantity;

      return {
        product,
        name,
        price,
        quantity: item.quantity,
        subtotal
      };
    });

    res.render('webview/item-checkout', {
      cart: formattedCart,
      total,
      totalItems
    });

  } catch (error) {
    console.log(error);
    res.send('Error loading checkout');
  }
};

exports.userWallet = (req,res)=>{
  try{
    res.render('webview/user-wallet')

  }catch(error){
    console.log(error)
  }
}



exports.startTopUp = async (req, res) => {
  try {
    const { amount, balanceType  } = req.body;

    if (!amount || amount <= 0) {
      return res.json({ success: false, message: 'Invalid amount' });
    }

    if (!['BTT', 'RP','USDT'].includes(balanceType )) {
      return res.json({ success: false, message: 'Invalid wallet type' });
    }

    const user = await User.findById(req.user.id);

    const topup = await TopUp.create({
      user: user._id,
      amount,
      balanceType 
    });

    await axios.post(
      'https://dev-api.bittokenapp.com/api/user/send-otp',
      { minerId: user.minerId },
      
    );

    res.json({ success: true, topupId: topup._id });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Failed to start top-up' });
  }
};

// 👉 STEP 2: CONFIRM TOP-UP
exports.confirmTopUp = async (req, res) => {
  try {
    const { otp, topupId } = req.body;

    const topup = await TopUp.findById(topupId);

    if (!topup || topup.status !== 'PENDING') {
      return res.json({ success: false, message: 'Invalid session' });
    }

    if (new Date() > topup.expiresAt) {
      return res.json({ success: false, message: 'Session expired' });
    }

    const user = await User.findById(req.user.id);

    const response = await axios.post(
      'https://dev-api.bittokenapp.com/api/user/deduct-fund',
      {
        minerId: user.minerId,
        otp,
        amount: topup.amount,
        balance_type: topup.balanceType
      },
      
    );

    if (response.data.status !== 200) {
      return res.json({ success: false, message: 'Deduction failed' });
    }

    // ✅ Wallet update (NEW LOGIC)
    let wallet = await Wallet.findOne({ user: user._id });

    if (!wallet) {
      wallet = new Wallet({
        user: user._id,
        balances: {
          BTT: 0,
          RP: 0,
          USDT:0,
        }
      });
    }

    wallet.balances[topup.balanceType] += topup.amount;

    await wallet.save();

    topup.status = 'COMPLETED';
    await topup.save();

    res.json({ success: true });

  } catch (error) {
    console.log(error.response?.data || error);
    res.json({ success: false, message: 'Top up failed' });
  }
};




exports.payWithWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.json({ success: false, message: 'Wallet not found' });
    }

    let total = 0;
    let itemsToProcess = [];
    let cart = null;

    // =========================
    // ✅ CASE 1: DIRECT PURCHASE (DATA / COURSES)
    // =========================
    if (productId) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.json({ success: false, message: 'Product not found' });
      }

      let price = 0;

      if (product.category === 'DATA') {
        price = product.dataDetails?.amount || 0;
      } else if (product.category === 'COURSES') {
        price = product.coursesDetails?.course_price || 0;
      } else {
        return res.json({
          success: false,
          message: 'Invalid direct purchase item'
        });
      }

      total = price;

      itemsToProcess.push({
        product,
        quantity: 1
      });
    }

    // =========================
    // ✅ CASE 2: CART PURCHASE (AUTOMOBILE / ELECTRONICS)
    // =========================
    else {
      cart = await Cart.findOne({ user: userId })
        .populate('items.product');

      if (!cart || cart.items.length === 0) {
        return res.json({ success: false, message: 'Cart is empty' });
      }

      cart.items.forEach(item => {
        let price = 0;
        const product = item.product;

        if (product.category === 'AUTOMOBILE') {
          price = product.automobileDetails?.price || 0;
        } else if (product.category === 'ELECTRONICS') {
          price = product.electronicDetails?.items_price || 0;
        }

        total += price * item.quantity;

        itemsToProcess.push(item);
      });
    }

    // =========================
    // ✅ CHECK WALLET BALANCE
    // =========================
    if (wallet.balances.USDT < total) {
      return res.json({
        success: false,
        message: 'Insufficient USDT balance'
      });
    }

    // =========================
    // ✅ DEDUCT WALLET
    // =========================
    wallet.balances.USDT -= total;
    await wallet.save();

    // =========================
    // ✅ PROCESS ITEMS
    // =========================
    for (let item of itemsToProcess) {
      const product = item.product;

      // 🔥 HANDLE DATA PURCHASE
      if (product.category === 'DATA') {

        const checkout = await Checkout.findOne({ user: userId })
          .sort({ createdAt: -1 });

        if (!checkout) {
          // refund
          wallet.balances.USDT += total;
          await wallet.save();

          return res.json({
            success: false,
            message: 'Checkout data not found, refunded'
          });
        }

        let phone = checkout.phone.trim().replace(/\D/g, '');

        if (phone.startsWith('234')) {
          phone = '0' + phone.slice(3);
        }

        if (phone.length !== 11) {
          wallet.balances.USDT += total;
          await wallet.save();

          return res.json({
            success: false,
            message: 'Invalid phone number, refunded'
          });
        }

        let apiResponse;

        try {
          apiResponse = await buyData({
            network: product.dataDetails.network === 'MTN' ? 1 : 2,
            phone,
            data_plan: product.dataDetails.plan_id
          });
        } catch (err) {
          console.log('API ERROR:', err.response?.data);
          apiResponse = { status: 'fail' };
        }

        // ❌ FAIL → REFUND
        if (apiResponse.status !== 'success') {
          wallet.balances.USDT += total;
          await wallet.save();

          await Transaction.create({
            user: userId,
            amount: total,
            status: 'failed',
            reference: 'PAY-' + Date.now()
          });

          return res.json({
            success: false,
            message: 'Data purchase failed, refunded'
          });
        }
      }

      // 👉 COURSES (you can expand later)
      if (product.category === 'COURSES') {
        // Example: grant access (future logic)
      }
    }

    // =========================
    // ✅ SAVE TRANSACTION
    // =========================
    await Transaction.create({
      user: userId,
      amount: total,
      status: 'success',
      reference: 'PAY-' + Date.now()
    });

    // =========================
    // ✅ CLEAR CART (ONLY IF USED)
    // =========================
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Payment successful',
      balance: wallet.balances.USDT
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Payment failed' });
  }
};



 


  

async function sendSimpleMessage() {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.API_KEY || "7af6646bb47d1e6262a12c3591cefcb8-4293193c-51ba3f6a",
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
  try {
    const data = await mg.messages.create("sandbox7ddc7b3132b44a939c0eda59f6d1827b.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox7ddc7b3132b44a939c0eda59f6d1827b.mailgun.org>",
      to: ["john ecklu <ecklujohn@gmail.com>"],
      subject: "Hello john ecklu",
      text: "Congratulations john ecklu, you just sent an email with Mailgun! You are truly awesome!",
    });

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}


exports.wallet =  (req, res) => {
    // wallet deduction logic
    res.send('Processing wallet payment...');
};

