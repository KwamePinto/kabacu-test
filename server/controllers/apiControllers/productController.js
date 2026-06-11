const Product = require('../../models/ProductsModal');

exports.getProducts = async (req, res) => {
  try {
    const { category, network, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category) filter.category = category.toUpperCase();
    if (network && filter.category === 'DATA') filter['dataDetails.network'] = network.toUpperCase();

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      products
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDataProducts = async (req, res) => {
  try {
    const { network, page = 1 } = req.query;
    const perPage = 12;

    const all = await Product.find({ category: 'DATA' })
      .sort({ 'dataDetails.network': 1, createdAt: -1 });

    // Group by network
    const grouped = {};
    all.forEach(p => {
      const net = p.dataDetails?.network || 'UNKNOWN';
      if (!grouped[net]) grouped[net] = [];
      grouped[net].push(p);
    });

    const networks = Object.keys(grouped);
    const reqNet   = (network || '').toUpperCase();
    const activeNetwork = networks.includes(reqNet) ? reqNet : networks[0];

    // Build per-network pagination
    const netPagination = {};
    networks.forEach(net => {
      const items   = grouped[net];
      const curPage = net === activeNetwork ? parseInt(page) : 1;
      const pages   = Math.ceil(items.length / perPage);
      const safeP   = Math.min(Math.max(curPage, 1), pages || 1);
      netPagination[net] = {
        total:   items.length,
        pages,
        current: safeP,
        hasPrev: safeP > 1,
        hasNext: safeP < pages
      };
      grouped[net] = items.slice((safeP - 1) * perPage, safeP * perPage);
    });

    res.json({
      success: true,
      activeNetwork,
      networks,
      groupedProducts: grouped,
      netPagination
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
