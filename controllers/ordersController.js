'use strict';
const { Order, Product, OrderItem } = require('../models/order.model');
const utils = require('../utils/utils');
const { from, throwError } = require('rxjs');
const { switchMap, map, catchError } = require('rxjs/operators');
const axios = require('axios');

// Create a new order
exports.createOrder = async (req, res) => {
    if(req.body.userId) {
        try {
            const cart = req.body.cart;
            let total = 0;
            let order;
            for (const item of cart) {
                const product = item.product;
                const quantity = item.quantity;
                total += product.price * quantity;
            }
            from(Order.create({
                userId: req.body.userId,
                orderDate: utils.timeNow(),
                total: total,
                status: 'unpaid',
            })).pipe(
               //send request to gateway. A redirect link will be returned
                switchMap((newOrder) => {
                    order = newOrder;    
                    let flwaveParams = {
                        tx_ref : order.orderId,
                        amount : order.total,
                        currency : "NGN",
                        redirect_url : process.env.TESTREDIRECTURL + order.orderId + "/update",
    //                    redirect_url : process.env.FLWDEALREDIRECTURL + order.orderId + "/update",
                        payment_options : "card, banktransfer, account, ussd",
                        customer : {
                            email : "test@test.com",
                            phonenumber : "0902620185",
                            name : "test user"
                        },
                        customizations : {
                            title : "Unite V3",
                            description : "Payment for test deal",
                            logo : "https://assets.piedpiper.com/logo.png"
                        },
                        meta : {
                            consumer_id : req.body.userId,
                            consumer_mac : "92a3-912ba-1192a"
                        }
                    };
                    let header = {
                        headers: {
                            Authorization : 'Bearer ' + process.env.FLWSECKEY
                        }
                    };
                    return from( axios.post( process.env.FLWPAYURL.toString(), flwaveParams, header))
                    .pipe(
                        map(flwData => {
                            return flwData.data.data.link;
                        }),
                        catchError(err => {
                            console.log("ERROR FROM FLWAVE:", err);
                            return throwError(() => new Error(err));
                        })
                    );
                })
            ).subscribe({
                next: (link) => {
                    //copy order to new object and add linkdata
                    let newOrder = {...order.dataValues, link : link}; 
                    console.log("NEW ORDER:", newOrder);
                    res.status(201).json(newOrder);
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
    else {
        res.status(400).json({ message: 'Bad request' });
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