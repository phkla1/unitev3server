const { Product } = require('../models/order.model');

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
		const products = await Product.findAll();
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
		const product = await Product.findByPk(req.params.id);
		if (!product) {
			res.status(404).json({ message: 'Product not found' });
		} else {
			await product.update(req.body);
			res.json(product);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
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