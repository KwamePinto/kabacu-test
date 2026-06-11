const Checkout = require('../../models/CheckoutModal');

exports.initiateCheckout = async (req, res) => {
  try {
    const { packageId, phone } = req.body;
    const userId = req.user.id;

    if (!packageId || !phone) {
      return res.status(400).json({ success: false, message: 'packageId and phone are required' });
    }

    // Validate Nigerian phone number (+234XXXXXXXXXX or 10-digit local)
    const normalised = phone.replace(/\D/g, '');
    let localNum = normalised;
    if (localNum.startsWith('234')) localNum = localNum.slice(3);
    if (localNum.startsWith('0'))   localNum = localNum.slice(1);

    if (!/^[789]\d{9}$/.test(localNum)) {
      return res.status(400).json({ success: false, message: 'Invalid Nigerian phone number' });
    }

    const fullPhone = '+234' + localNum;

    const checkout = await Checkout.create({
      user:    userId,
      product: packageId,
      phone:   fullPhone
    });

    res.status(201).json({ success: true, checkout });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getCheckout = async (req, res) => {
  try {
    const checkout = await Checkout.findOne({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('product');

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'No active checkout found' });
    }

    res.json({ success: true, checkout });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCheckout = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'phone is required' });
    }

    const normalised = phone.replace(/\D/g, '');
    let localNum = normalised;
    if (localNum.startsWith('234')) localNum = localNum.slice(3);
    if (localNum.startsWith('0'))   localNum = localNum.slice(1);

    if (!/^[789]\d{9}$/.test(localNum)) {
      return res.status(400).json({ success: false, message: 'Invalid Nigerian phone number' });
    }

    const checkout = await Checkout.findByIdAndUpdate(
      req.params.id,
      { phone: '+234' + localNum },
      { new: true }
    );

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'Checkout not found' });
    }

    res.json({ success: true, checkout });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCheckout = async (req, res) => {
  try {
    const checkout = await Checkout.findByIdAndDelete(req.params.id);

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'Checkout not found' });
    }

    res.json({ success: true, message: 'Checkout removed' });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
