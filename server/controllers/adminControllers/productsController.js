const adminLayouts = "layouts/adminLayout";

const Transaction = require("../../models/TransactionModel");
const TopUp = require("../../models/TopUpModal");
const Category = require("../../models/CategoryModal");
const Product = require("../../models/ProductsModal");
const User = require("../../models/UserModel");
const Wallet = require("../../models/WalletModal");
const PaymentMethod = require("../../models/PaymentMethodModel");

const { authenticateAdminUser } = require("../../config/authMiddleware");

exports.createProducts = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const category = await Category.find({ is_deleted: { $ne: 1 } }).sort({
        category_name: 1,
      });
      res.render("adminview/forms/add-products", {
        layout: adminLayouts,
        category,
        query: req.query,
      });
    } catch (error) {
      console.log(error);
    }
  },
];

exports.addProduct = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const { category, reward_point, description } = req.body;
      const imagePaths = (req.files || []).map(
        (file) => "/uploads/" + file.filename,
      );

      let productData = {
        category,
        reward_point,
        description,
        images: imagePaths,
      };

      const validCategories = ["DATA", "ELECTRONICS", "AUTOMOBILE"];
      if (!validCategories.includes(category)) {
        return res.status(400).send("Invalid or unsupported category.");
      }

      if (category === "DATA") {
        productData.dataDetails = {
          plan_id: req.body.plan_id,
          network: req.body.network,
          plan_type: req.body.plan_type,
          plan_name: req.body.plan_name,
          amount: req.body.amount,
          oldPrice: req.body.oldPrice,
          validate_period: req.body.validate_period,
        };
      } else if (category === "ELECTRONICS") {
        productData.electronicDetails = {
          itemName: req.body.itemName,
          brandItem: req.body.brandItem,
          itemtype: req.body.itemtype,
          items_price: req.body.items_price,
        };
      } else if (category === "AUTOMOBILE") {
        productData.automobileDetails = {
          brand: req.body.brand,
          model: req.body.model,
          year: req.body.year,
          fuel_type: req.body.fuel_type,
          transmission: req.body.transmission,
          condition: req.body.condition,
          price: req.body.auto_price,
        };
      }

      await Product.create(productData);
      res.redirect("/admin/product/create-products?success=1");
    } catch (error) {
      console.log(error);
      res.send("Error adding product");
    }
  },
];

exports.viewProducts = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      let products = await Product.find({ is_deleted: { $ne: 1 } }).sort({
        createdAt: -1,
      });

      products = products.map((p) => {
        let name = "Unknown Product";
        let price = 0;
        let extra = "";

        switch (p.category) {
          case "DATA":
            name = `${p.dataDetails?.plan_type || ""} (${p.dataDetails?.plan_name || ""})`;
            price = p.dataDetails?.amount || 0;
            extra = p.dataDetails?.network || "";
            break;
          case "AUTOMOBILE":
            name = `${p.automobileDetails?.brand || ""} ${p.automobileDetails?.model || ""}`;
            price = p.automobileDetails?.price || 0;
            extra = `${p.automobileDetails?.fuel_type || ""} | ${p.automobileDetails?.condition || ""}`;
            break;
          case "ELECTRONICS":
            name = `${p.electronicDetails?.itemName || ""}`;
            price = p.electronicDetails?.items_price || 0;
            extra = `${p.electronicDetails?.brandItem || ""} | ${p.electronicDetails?.itemtype || ""}`;
            break;
          default:
            name = "Unknown Category";
        }

        return {
          ...p._doc,
          productName: name,
          productPrice: price,
          productExtra: extra,
        };
      });

      res.render("adminview/tables/view-products", {
        products,
        layout: adminLayouts,
        query: req.query,
      });
    } catch (error) {
      console.log(error);
    }
  },
];

exports.deleteProduct = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { is_deleted: 1 },
        { new: true },
      );
      if (!product)
        return res.json({ success: false, error: "Product not found." });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.json({ success: false, error: error.message });
    }
  },
];

exports.editProductGet = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.redirect("/admin/product/view-products");
      const category = await Category.find({ is_deleted: { $ne: 1 } }).sort({
        category_name: 1,
      });
      res.render("adminview/forms/edit-product", {
        layout: adminLayouts,
        product,
        category,
        query: req.query,
      });
    } catch (error) {
      console.log(error);
      res.redirect("/admin/product/view-products");
    }
  },
];

exports.editProductPost = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.redirect("/admin/product/view-products");

      const { reward_point, description } = req.body;
      const update = {
        reward_point:
          reward_point !== undefined ? reward_point : product.reward_point,
        description: description || product.description,
      };

      // Replace images only when the admin explicitly uploaded new ones
      if (req.files && req.files.length > 0) {
        update.images = req.files.map((file) => "/uploads/" + file.filename);
      }

      if (product.category === "DATA") {
        update.dataDetails = {
          plan_id: req.body.plan_id ?? product.dataDetails?.plan_id,
          network: req.body.network || product.dataDetails?.network,
          plan_type: req.body.plan_type || product.dataDetails?.plan_type,
          plan_name: req.body.plan_name || product.dataDetails?.plan_name,
          amount: req.body.amount ?? product.dataDetails?.amount,
          oldPrice: req.body.oldPrice ?? product.dataDetails?.oldPrice,
          validate_period:
            req.body.validate_period || product.dataDetails?.validate_period,
        };
      } else if (product.category === "ELECTRONICS") {
        update.electronicDetails = {
          itemName: req.body.itemName || product.electronicDetails?.itemName,
          brandItem: req.body.brandItem || product.electronicDetails?.brandItem,
          itemtype: req.body.itemtype || product.electronicDetails?.itemtype,
          items_price:
            req.body.items_price ?? product.electronicDetails?.items_price,
        };
      } else if (product.category === "AUTOMOBILE") {
        update.automobileDetails = {
          brand: req.body.brand || product.automobileDetails?.brand,
          model: req.body.model || product.automobileDetails?.model,
          year: req.body.year ?? product.automobileDetails?.year,
          fuel_type: req.body.fuel_type || product.automobileDetails?.fuel_type,
          transmission:
            req.body.transmission || product.automobileDetails?.transmission,
          condition: req.body.condition || product.automobileDetails?.condition,
          price: req.body.auto_price ?? product.automobileDetails?.price,
        };
      }

      await Product.findByIdAndUpdate(req.params.id, update);
      res.redirect("/admin/product/view-products?updated=1");
    } catch (error) {
      console.log(error);
      res.redirect("/admin/product/edit-product/" + req.params.id + "?error=1");
    }
  },
];

exports.userView = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.render("adminview/tables/view-users", {
        users,
        layout: adminLayouts,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
];

exports.userDetails = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.redirect("/admin/product/view-users");

      const [wallet, transactions, topups] = await Promise.all([
        Wallet.findOne({ user: user._id }),
        Transaction.find({ user: user._id })
          .populate("product")
          .populate("products.product")
          .sort({ createdAt: -1 }),
        TopUp.find({ user: user._id }).sort({ createdAt: -1 }),
      ]);

      const walletBalances = wallet?.balances || {
        BTT: 0,
        RP: 0,
        USDT: 0,
        NAIRA: 0,
      };

      const totalSpent = transactions
        .filter((tx) => tx.status === "success")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      const totalToppedUp = topups
        .filter((tp) => tp.status === "COMPLETED")
        .reduce((sum, tp) => sum + (tp.nairaAmount || tp.amount || 0), 0);

      res.render("adminview/tables/user-details", {
        layout: adminLayouts,
        user,
        walletBalances,
        transactions,
        topups,
        totalSpent,
        totalToppedUp,
      });
    } catch (err) {
      console.log("USER DETAILS ERROR:", err);
      res.redirect("/admin/product/view-users");
    }
  },
];

exports.productDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Product not found" });
  }
};

exports.viewTransactions = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const transactions = await Transaction.find()
        .populate("user")
        .populate("product")
        .populate("products.product")
        .sort({ createdAt: -1 });
      res.render("adminview/tables/transactions", {
        layout: adminLayouts,
        transactions,
      });
    } catch (err) {
      console.log(err);
    }
  },
];

exports.viewTopUps = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const topups = await TopUp.find()
        .populate("user")
        .sort({ createdAt: -1 });
      res.render("adminview/tables/topUps", { layout: adminLayouts, topups });
    } catch (err) {
      console.log(err);
    }
  },
];

exports.viewPaymentMethods = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const methods = await PaymentMethod.find().sort({ createdAt: -1 });
      res.render("adminview/payment-methods", {
        layout: adminLayouts,
        methods,
      });
    } catch (err) {
      console.log(err);
    }
  },
];

exports.addPaymentMethod = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        req.flash("error", "Payment method name is required");
        return res.redirect("/admin/product/payment-methods");
      }
      const exists = await PaymentMethod.findOne({ name: name.trim() });
      if (exists) {
        req.flash("error", "A payment method with that name already exists");
        return res.redirect("/admin/product/payment-methods");
      }
      await PaymentMethod.create({ name: name.trim() });
      req.flash("success", "Payment method added");
      res.redirect("/admin/product/payment-methods");
    } catch (err) {
      console.log(err);
      req.flash("error", "Something went wrong");
      res.redirect("/admin/product/payment-methods");
    }
  },
];

exports.togglePaymentMethod = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      const method = await PaymentMethod.findById(req.params.id);
      if (method) {
        method.isActive = !method.isActive;
        await method.save();
      }
      res.redirect("/admin/product/payment-methods");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/product/payment-methods");
    }
  },
];

exports.deletePaymentMethod = [
  authenticateAdminUser,
  async (req, res) => {
    try {
      await PaymentMethod.findByIdAndDelete(req.params.id);
      req.flash("success", "Payment method deleted");
      res.redirect("/admin/product/payment-methods");
    } catch (err) {
      console.log(err);
      res.redirect("/admin/product/payment-methods");
    }
  },
];
