const { Product } = require('../models/order.model');
const { Seller } = require('../models/account.model');
const  utils  = require('../utils/utils');

// create a new product
exports.createProduct = async (req, res) => {
	try {
		const product = await Product.create(req.body);
		res.status(201).json(product);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// get all products
exports.findAllProducts = async (req, res) => {
	try {
		const products = await Product.findAll({
			raw: true,
		});
		res.json(products);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// get a single product by ID
exports.findOneProduct = async (req, res) => {
	try {
		const product = await Product.findByPk(req.params.id);
		if (!product) {
			res.status(404).json({ message: 'Product not found' });
		} else {
			res.json(product);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// update a product by ID
exports.updateProduct = async (req, res) => {
	try {
		const productId = req.params.id;
		const product = await Product.findByPk(productId);

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		const token = req.headers.authorization;
		const userId = utils.decodeToken(token).userId;

		const seller = await Seller.findOne({ where: { userId } });

		if (!seller) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		if (product.sellerId !== seller.sellerId) {
			return res.status(401).json({ message: 'Unauthorized seller' });
		}
		const { productName, productDescription, price, primaryImageUrl } = req.body;

		product.productName = productName || product.productName;
		product.productDescription = productDescription || product.productDescription;
		product.price = price || product.price;
		product.primaryImageUrl = primaryImageUrl || product.primaryImageUrl;

		await product.save();

		return res.json(product);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Server error' });
	}
};

// delete a product by ID
exports.deleteProduct = async (req, res) => {
	try {
		const product = await Product.findByPk(req.params.id);
		if (!product) {
			res.status(404).json({ message: 'Product not found' });
		} else {
			await product.destroy();
			res.json({ message: 'Product deleted successfully' });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};