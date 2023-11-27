'use strict';
const { Order, Product, OrderItem } = require('../models/order.model');
const { User, Seller } = require('../models/account.model');
const { Addresses } = require('../models/location.model');
const utils = require('../utils/utils');
const { from, throwError } = require('rxjs');
const { switchMap, map, catchError } = require('rxjs/operators');
const Flutterwave = require('flutterwave-node-v3');
const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const { Op } = require('sequelize');
const fs = require('fs');

// Create a new order
exports.createOrder = async (req, res) => {
	if (req.body.cart && req.body.addressId) {
		try {
			const { addressId, cart } = req.body;
			const token = req.headers.authorization;
			const decodedToken = utils.decodeToken(token);
			const userId = decodedToken.userId;
			const email = decodedToken.email;
			const username = decodedToken.firstname + ' ' + decodedToken.surname;
			const phone = decodedToken.phone;
			const orderDate = Math.floor(Date.now() / 1000); // Unix timestamp
			let total = 0;

			// Calculate total
			for (const item of cart) {
				total += item.product.price * item.quantity;
			}
			//order ref
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
					sellerId: item.product.sellerId,
				});
			}

			//send request to gateway. A redirect link will be returned
			let flwaveParams = {
				tx_ref: unitePaymentRef,
				amount: order.total,
				currency: "NGN",
				redirect_url: process.env.FLWDEALREDIRECTURL + "/update",
				payment_options: "banktransfer, account, ussd",
				customer: {
					email: email,
					phonenumber: phone,
					name: username
				},
				customizations: {
					title: "Unite V3",
					description: `Payment for order # ${order.orderId}`,
					logo: "https://res.cloudinary.com/unitebeta/image/upload/v1693209936/unitev3/icon-384x384_g3saaf.png"
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
	console.log("UPDATE ORDER CALLED")
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
	//typically url like GET unite.com.ng:<PORT>/api/v3/orders/update?tx_ref=5vmnctqqxr6islc6k15nec&transaction_id=26747774&status=successful 
	//note that flutterwave records store "transaction_id" as txid
	//flutterwave is not consistent. I have had status "successful" and status "completed"
	let order, userId;
	try {
		const { tx_ref, transaction_id, status } = req.query;
		if (transaction_id) {
			let expectedAmount, expectedCurrency = 'NGN';
			// Get expected amount from order
			order = await Order.findOne({
				where: {
					unitepaymentref: tx_ref,
				},
			});
			expectedAmount = Number(order.getDataValue('total'));
			userId = order.getDataValue('userId');

			// Generate order fulfilment code
			const fulfilmentCode = utils.generateLongRandomString().substring(0, 5);
			//get user details so we can extract the user's referral code
			const user = await User.findByPk(userId);
			const referralCode = user.getDataValue('referralCode');	
			// Show holding HTML response to user
			const html = `
			<html>
			  <head>
				<title>We are processing your order</title>
			  </head>
			  <body>
				<h1>Thanks! Your order is being processed</h1>
				<p>We have received your order and we are confirming your order items and details. </p>
				<p>Once that is done you will receive an email with your receipt and order details.</p>
				<p>You get cashback on all successful orders and you can share your referral code <b>${referralCode}</b> to earn even more cash.</p>
				<p></p>
				<button id="share-button" style="color:#fff; background-color:#dc0b0b; border-radius:20px; padding:10px 15px; font-weight:600">Share with friends</button>
				<p></p>
				<button id="back-button" style="color:#fff; background-color:#dc0b0b; border-radius:20px; padding:10px 15px; font-weight:600">Back to Unite</button>
				<script>
  				  const backButton = document.getElementById('back-button');
  				  backButton.addEventListener('click', () => {
  				    window.location.href = 'https://deals.unite.com.ng/all-deals';
  				  }); 
				  const shareButton = document.getElementById('share-button');
				  shareButton.addEventListener('click', async () => {
					try {
					  await navigator.share({
						title: 'Join me on Unite!',
						text : "I'm shopping on Unite. Let's combine orders to get more cash back!",
						url: 'https://deals.unite.com.ng?sponsor=${referralCode}',
					  });
					} catch (error) {
					  console.error('Error sharing:', error);
					  const shareUrl = "https://deals.unite.com.ng?sponsor=${referralCode}";
					  const tempInput = document.createElement('input');
					  tempInput.value = shareUrl;
					  document.body.appendChild(tempInput);
					  tempInput.select();
					  document.execCommand('copy');
					  document.body.removeChild(tempInput);
					  alert('The share URL has been copied to your clipboard. You can paste it into WhatsApp or any other app to share with your friends.');
					}
				  });
				</script>
			  </body>
			</html>
		  	`;
			res.set('Content-Type', 'text/html');
			res.statusCode = 200;
			res.send(html);

			const flw = new Flutterwave(process.env.FLWPUBKEY, process.env.FLWSECKEY);
			// Verify transaction
			flw.Transaction.verify({ id: transaction_id })
				.then(async (verifyResponse) => {
					if (verifyResponse.data 
						&& (verifyResponse.data.status === 'successful' || verifyResponse.data.status === 'completed')
						&& Number(verifyResponse.data.amount) === expectedAmount
						&& verifyResponse.data.currency === expectedCurrency) {
						// Get order details from verification response
						const chargedAmount = verifyResponse.data.charged_amount;
						const settledAmount = verifyResponse.data.amount;
						const gatewayFee = verifyResponse.data.app_fee;
						const paymentType = verifyResponse.data.payment_type;

						order.setDataValue('status', 'paid');
						order.setDataValue('gatewayPaymentRef', transaction_id);
						order.setDataValue('chargedAmount', chargedAmount);
						order.setDataValue('settledAmount', settledAmount);
						order.setDataValue('gatewayFee', gatewayFee);
						order.setDataValue('paymentType', paymentType);
						await order.save();

						// Get all order items for the order
						const orderItems = await OrderItem.findAll({
							where: {
								orderId: order.getDataValue('orderId'),
							},
						});

						// Update inventory for each product
						await Promise.all(
							orderItems.map(async (orderItem) => {
								const product = await Product.findOne({
									where: {
										productId: orderItem.getDataValue('productId'),
									},
								});

								// Decrement product inventory by order item quantity
								let inventory = product.getDataValue('inventory') - orderItem.getDataValue('quantity');
								product.setDataValue('inventory', inventory);
								await product.save();
							})
						);

						const buyerEmail = [{ email: user.getDataValue('email') }];

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
						const sellerEmail = [{ email: sellerUserRecord.getDataValue('email') }];

						// Create the table of order items
						let orderItemsTable = '<table><thead><tr><th>Item</th><th>Quantity</th><th>Total Price</th></tr></thead><tbody>';
						let orderItemsText = '';
						let totalPrice = 0;
						for (const orderItem of orderItems) {
						  const productId = orderItem.getDataValue('productId');
						  const product = await Product.findByPk(productId);
						  const itemName = product.getDataValue('productName');
						  const quantity = orderItem.getDataValue('quantity');
						  const price = orderItem.getDataValue('price');
						  const totalItemPrice = quantity * price;
						  totalPrice += totalItemPrice;
						  orderItemsTable += `<tr><td>${itemName}</td><td>${quantity}</td><td>${totalItemPrice}</td></tr>`;
						  orderItemsText += `${itemName} x ${quantity}: ${totalItemPrice}\n`;
						}
						orderItemsTable += '</tbody></table>';

						// Send email to buyer
						const buyerSubject = 'Your order has been confirmed';
						const buyerText = `Your order has been confirmed. Your order fulfilment code is ${fulfilmentCode}.\n\nOrder items:\n${orderItemsText}\nTotal price: ${totalPrice}`;
						const buyerHtml = `
						<html>
						  <head>
							<title>Payment successful</title>
						  </head>
						  <body>
							<h1>Payment successful</h1>
							<p>Your order has been received. Your order fulfilment code is ${fulfilmentCode}.</p>
							<p>${orderItemsTable}</p>
							<p>Total price: ${totalPrice}</p>
						  </body>
						</html>
					  	`;
						utils.sendEmail(1, buyerSubject, buyerEmail, null, buyerHtml, buyerText, null, null, null, 'ORDER');

						const userFullName = `${user.getDataValue('firstname')} ${user.getDataValue('surname')}`;
						const userPhone = user.getDataValue('phone');
						const orderAddress = await Addresses.findByPk(order.addressId);
						const userAddress = orderAddress.getDataValue('streetAddress');
						// Send email to seller
						const sellerSubject = 'You have a new order';
						const sellerText = `You have a new order. The order fulfilment code is ${fulfilmentCode}.\n\nOrder items:\n${orderItemsText}\nTotal price: ${totalPrice}`;
						const sellerHtml = `
						<html>
						  <head>
							<title>Payment successful</title>
						  </head>
						  <body>
							<h1>Payment successful</h1>
							<p>You have a new order. The order fulfilment code is ${fulfilmentCode}.</p>
							<p>${orderItemsTable}</p>
							<p>Total price: ${totalPrice}</p>
							<p><b>Customer details:</b></p>
							<ul>
							  <li>Name: ${userFullName}</li>
							  <li>Phone: ${userPhone}</li>
							  <li>Address: ${userAddress}</li>
							</ul>
						  </body>
						</html>
					  	`;
						utils.sendEmail(1, sellerSubject, sellerEmail, null, sellerHtml, sellerText, null, null, null, 'ORDER');
					}
					else {
						if(!res.headersSent) res.send('Payment verification failed (no information from Flutterwave). Please contact support.');
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

exports.getOrderReport = async (req, res, next) => {
	try {
		const { startDate } = req.body;
		const token = req.headers.authorization;
		const decodedToken = utils.decodeToken(token);
		const userId = decodedToken.userId;

		//Get user's email address
		const user = await User.findOne({
			where: {
				userId,
			},
			attributes: ['email'],
		});
		const recipient = [{ email: user.getDataValue('email') }];

		// Check if user is a seller
		const seller = await Seller.findOne({
			where: {
				userId,
			},
			attributes: ['sellerId'],
		});
		const sellerId = seller.getDataValue('sellerId');
		if (!sellerId) {
			return res.status(403).send('User is not a seller');
		}

		// Get order items for seller on or after start date
		const orderItems = await OrderItem.findAll({
			where: {
				createdAt: {
					[Op.gte]: new Date(startDate * 1000),
				},
				sellerId
			},
			raw: true,
			attributes: ['orderId', 'productId', 'quantity', 'price'],
		});

		if (orderItems.length > 0) {
			// Get order details for each order item
			const orderDetails = await Promise.all(
				orderItems.map(async (orderItem) => {
					const { orderId, productId, quantity, price } = orderItem;

					// Get buyer details
					const order = await Order.findOne({
						where: {
							orderId,
						},
						attributes: ['userId'],
					});
					const buyerId = order.getDataValue('userId');
					const buyer = await User.findOne({
						where: {
							userId: buyerId,
						},
						attributes: ['firstname', 'surname', 'email'],
					});

					// Get product details
					const product = await Product.findOne({
						where: {
							productId,
						},
						attributes: ['productName', 'productDescription'],
					});

					// Get delivery address
					const addressData = await Order.findOne({
						where: {
							orderId,
						},
						attributes: ['addressId'],
					});
					const addressId = addressData.getDataValue('addressId');
					const deliveryAddress = await Addresses.findOne({
						where: {
							addressId,
						},
						attributes: ['streetAddress'],
					});

					return {
						buyerName: `${buyer.getDataValue('firstname')} ${buyer.getDataValue('surname')}`,
						buyerEmail: buyer.getDataValue('email'),
						deliveryAddress: deliveryAddress.getDataValue('streetAddress'),
						productName: product.getDataValue('productName'),
						productDescription: product.getDataValue('productDescription'),
						quantity,
						unitPrice: price,
					};
				})
			);

			// Convert order details to CSV
			const csv = new ObjectsToCsv(orderDetails);
			const csvString = await csv.toString();

			// Send CSV file via email
			const subject = 'Your Unite Order report';
			const text = 'Please find attached the order report.';
			const textHtml = `
			<html>
			  <head>
				<title>Order report</title>
			  </head>
			  <body>
				<h1>Order report</h1>
				<p>Please find attached the order report.</p>
			  </body>
			</html>
		  	`;
			const rawFile = '/tmp/' + utils.generateLongRandomString() + '.txt';
			await csv.toDisk(rawFile);
			const filename = 'order_report.csv';

			fs.readFile(rawFile, { encoding: 'base64' }, (err, data) => {
				if (err) {
					console.error(err);
					return;
				}
				utils.sendEmail(userId, subject, recipient, null, textHtml, text, filename, data, 'text/plain', 'REPORT');
			});

			res.send(true);
		}
		else {
			res.send(false);
		}
	}
	catch (error) {
		next(error);
	}
};