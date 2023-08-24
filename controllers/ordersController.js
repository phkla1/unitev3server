'use strict';
const { Order, Product, OrderItem } = require('../models/order.model');
const { User, Seller } = require('../models/account.model');
const utils = require('../utils/utils');
const { from, throwError } = require('rxjs');
const { switchMap, map, catchError } = require('rxjs/operators');
const Flutterwave = require('flutterwave-node-v3');
//const axios = require('axios');

// Create a new order
exports.createOrder = async (req, res) => {
	if (req.body.cart && req.body.addressId) {
		try {
			const { addressId, cart } = req.body;
			const token = req.headers.authorization;
			const decodedToken = utils.decodeToken(token);
			const userId = decodedToken.userId;
			const orderDate = Math.floor(Date.now() / 1000); // Unix timestamp
			let total = 0;

			// Calculate total
			for (const item of cart) {
				total += item.product.price * item.quantity;
			}

			const unitePaymentRef = utils.generateLongRandomString();
			// Create order
			const order = await Order.create({
				userId,
				addressId,
				orderDate,
				unitePaymentRef,
				total,
				status: 'unpaid',
			});

			// Create order items
			for (const item of cart) {
				await OrderItem.create({
					orderId: order.orderId,
					productId: item.product.productId,
					price: item.product.price,
					quantity: item.quantity,
				});
			}

			//send request to gateway. A redirect link will be returned
			let flwaveParams = {
				tx_ref: unitePaymentRef,
				amount: order.total,
				currency: "NGN",
				redirect_url: process.env.TESTREDIRECTURL + "/update",
				//                    redirect_url : process.env.FLWDEALREDIRECTURL + order.orderId + "/update",
				payment_options: "banktransfer, account, ussd",
				customer: {
					email: "test@test.com",
					phonenumber: "0902620185",
					name: "test user"
				},
				customizations: {
					title: "Unite V3",
					description: "Payment for test deal",
					logo: "https://assets.piedpiper.com/logo.png"
				},
				meta: {
					consumer_id: req.body.userId,
					consumer_mac: "92a3-912ba-1192a"
				}
			};
			let header = {
				headers: {
					Authorization: 'Bearer ' + process.env.FLWSECKEY
				}
			};
			from(axios.post(process.env.FLWPAYURL.toString(), flwaveParams, header))
				.pipe(
					map(flwData => {
						return flwData.data.data.link;
					}),
					catchError(err => {
						console.log("ERROR FROM FLWAVE:", err);
						return throwError(() => new Error(err));
					})
				).subscribe({
					next: (redirectUrl) => {
						//copy order to new object and add linkdata
						let newOrder = { ...order.dataValues, link: redirectUrl };
						console.log("NEW ORDER:", newOrder);
						res.status(201).json(newOrder);
					},
					error: (err) => {
						console.log("ERROR FROM FLWAVE:", err);
						if (!res.headersSent) res.status(500).json({ message: 'Gateway error' });
					}
				});
		} catch (err) {
			console.error(err);
			if (!res.headersSent) res.status(500).json({ message: 'Server error' });
		}
	}
	else {
		if (!res.headersSent) res.status(400).json({ message: 'Bad request' });
	}

};

// Get all orders
exports.getAllOrders = async (req, res) => {
	try {
		const orders = await Order.findAll();
		res.json(orders);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
	try {
		const order = await Order.findByPk(req.params.id);
		if (!order) {
			res.status(404).json({ message: 'Order not found' });
		} else {
			res.json(order);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// Update an order
exports.updateOrder = async (req, res) => {
	try {
		const order = await Order.findByPk(req.params.id);
		if (!order) {
			res.status(404).json({ message: 'Order not found' });
		} else {
			// Update the order status based on the request body
			order.status = req.body.status;
			await order.save();
			res.json(order);
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

// Delete an order
exports.deleteOrder = async (req, res) => {
	try {
		const order = await Order.findByPk(req.params.id);
		if (!order) {
			res.status(404).json({ message: 'Order not found' });
		} else {
			await order.destroy();
			res.json({ message: 'Order deleted' });
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.completeOrder = async (req, res, next) => {
	try {
		const { tx_ref, transaction_id, status } = req.query;
		if (transaction_id) {
			let expectedAmount, expectedCurrency = 'NGN';
			// Get expected amount from order
			const order = await Order.findOne({
				where: {
					unitepaymentref: tx_ref,
				},
			});
			expectedAmount = Number(order.getDataValue('total'));

			const flw = new Flutterwave(process.env.FLWPUBKEY, process.env.FLWSECKEY);
			// Verify transaction
			flw.Transaction.verify({ id: transaction_id })
				.then(async (verifyResponse) => {
					if (verifyResponse.data.status === 'successful'
						&& Number(verifyResponse.data.amount) === expectedAmount
						&& verifyResponse.data.currency === expectedCurrency) {
						// Get order details from verification response
						const chargedAmount = verifyResponse.data.charged_amount;
						const settledAmount = verifyResponse.data.amount;
						const gatewayFee = verifyResponse.data.app_fee;
						const paymentType = verifyResponse.data.payment_type;

						// Update order status to "paid"
						const order = await Order.findOne({
							where: {
								unitePaymentRef: tx_ref,
							}
						});
						order.setDataValue('status', 'paid');
						order.setDataValue('gatewayPaymentRef', transaction_id);
						order.setDataValue('chargedAmount', chargedAmount);
						order.setDataValue('settledAmount', settledAmount);
						order.setDataValue('gatewayFee', gatewayFee);
						order.setDataValue('paymentType', paymentType);

						await order.save();

						// Generate order fulfilment code
						const fulfilmentCode = utils.generateLongRandomString().substring(0, 5);
						// Show HTML response to user
						const html = `
						<html>
						  <head>
							<title>Payment successful</title>
						  </head>
						  <body>
							<h1>Payment successful</h1>
							<p>Your order has been paid. Your order fulfilment code is ${fulfilmentCode}.</p>
						  </body>
						</html>
					  	`;
						res.set('Content-Type', 'text/html');
						res.statusCode = 201;
						res.send(html);

						// Get buyer email
						const buyerId = order.userId;
						const buyerRecord = await User.findOne({
							where: {
								userId: buyerId,
							},
							attributes: ['email'],
						});
						const buyerEmail = [{email : buyerRecord.getDataValue('email')}];

						// Get seller email
						const orderItem = await OrderItem.findOne({
							where: {
								orderId: order.orderId,
							},
							attributes: ['productId'],
						});
						const productId = orderItem.getDataValue('productId');
						const product = await Product.findOne({
							where: {
								productId,
							},
							attributes: ['sellerId'],
						});
						const sellerId = product.getDataValue('sellerId');
						const sellerRecord = await Seller.findOne({
							where: {
								sellerId,
							},
							attributes: ['userId'],
						});
						const sellerUserId = sellerRecord.getDataValue('userId'); 
						const sellerUserRecord = await User.findOne({
							where: {
								userId: sellerUserId,
							},
							attributes: ['email'],
						});
						const sellerEmail = [{email : sellerUserRecord.getDataValue('email')}];

						// Send email to buyer
						const buyerSubject = 'Your order has been paid';
						const buyerText = `Your order has been paid. Your order fulfilment code is ${fulfilmentCode}.`;
						const buyerHtml = `
						<html>
						  <head>
							<title>Payment successful</title>
						  </head>
						  <body>
							<h1>Payment successful</h1>
							<p>Your order has been paid. Your order fulfilment code is ${fulfilmentCode}.</p>
						  </body>
						</html>
					  	`;
						utils.sendEmail(1, buyerSubject, buyerEmail, null, buyerHtml, buyerText, null, null, null, 'ORDER');

						// Send email to seller
						const sellerSubject = 'You have a new order';
						const sellerText = `You have a new order. The order fulfilment code is ${fulfilmentCode}.`;
						const sellerHtml = `
						<html>
						  <head>
							<title>Payment successful</title>
						  </head>
						  <body>
							<h1>Payment successful</h1>
							<p>You have a new order. The order fulfilment code is ${fulfilmentCode}.</p>
						  </body>
						</html>
					  	`;
						utils.sendEmail(1, sellerSubject, sellerEmail, null, sellerHtml, sellerText, null, null, null, 'ORDER');
					}
					else {
						res.send('Payment verification failed. Please contact support.');
					}
				})
		}
		else {
			res.send('Payment was not successful. Please try again.');
		}
	}
	catch (error) {
		next(error);
	}
}