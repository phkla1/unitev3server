'use strict';
const { Op } = require('sequelize');
const { User, Seller } = require('../models/account.model');
const { Wallet } = require('../models/wallet.model');
const Verification = require('../models/verification.model');
const { from, EMPTY } = require('rxjs');
const { catchError, switchMap, map } = require('rxjs/operators');
const utils = require('../utils/utils');
const { Addresses } = require('../models/location.model');


async function registerUserStep1(req, res, next) {
	//validate the request body
	if (req.body.phone && req.body.email && req.body.firstname && req.body.surname && req.body.role && req.body.upline) {
		let userId, verificationId, referralCode;
		//if role is "user" then generate a random alphanumerical referral code
		referralCode = utils.generateReferralCode();
		console.log("REFERRAL CODE IS: ", referralCode)
		const newUser = {
			phone: req.body.phone,
			email: req.body.email,
			firstname: req.body.firstname,
			surname: req.body.surname,
			role: req.body.role,
			referrer: req.body.upline,
			referralCode: referralCode,
			active: false
		};

		// Check if upline is valid
		const upline = await User.findOne({
			where: {
				referralCode : req.body.upline,
			},
		});

		if (!upline) {
			console.log("NO UPLINE. UPLINE IS:", upline);
			return res.status(400).send('Invalid upline code');
		}

		//register the user
		from(User.create(newUser)).pipe(
			catchError((error) => {
				console.log("ERROR CREATING USER: ", error);
				res.status(500).send('Unable to create user');
				return EMPTY;
			}),
			//create wallet for user
			switchMap((user) => {
				userId = user.dataValues.userId;
				return from(Wallet.create({ userId: userId, currency: 'UNITE' }));
			}),
			switchMap((wallet) => {
				//				console.log('Wallet created successfully!', wallet)
				userId = wallet.dataValues.userId;
				//generate 5-digit random number
				const verificationCode = Math.floor(10000 + Math.random() * 90000);
				return from(Verification.create({ userId: userId, verificationMessage: verificationCode, type: 'REGISTRATION' }));
			}),
			catchError((error) => {
				console.error('Unable to create verification code : ', error);
				//send only if headers not set
				if (!res.headersSent) res.sendStatus(500);
			}),
			map((verification) => {
				verificationId = verification.verificationId;
				//send email with verification code to user
				const subject = 'Please Complete Your Unite Registration';
				const recipients = [{ email: newUser.email }];
				const htmlContent = `<p>Your Unite registration code is <b>${verification.verificationMessage}</b></p>. <p>Enter this code in the app to complete your registration.</p>`;
				const textContent = `Your Unite registration code is ${verification.verificationMessage}. Enter this code in the app to complete your registration.`;
				utils.sendEmail(userId, subject, recipients, null, htmlContent, textContent, null, null, null, 'REGISTERUSER');
				return true;
			})
		).subscribe({
			complete: () => {
				if (!res.headersSent) res.send({ userId, verificationId });
			}
		});
	}
	else {
		res.sendStatus(400);
	}
}

//complete the registration process by confirming the user's email address. The function will receive the userId, verificationId, and verification code
function registerUserStep2(req, res, next) {
	let user;
	//validate the request body
	if (req.body.userId && req.body.verificationId && req.body.verificationMessage) {
		//check if the verification code is valid
		from(Verification.findOne({ where: { verificationId: req.body.verificationId, userId: req.body.userId, verificationMessage: req.body.verificationMessage, type: 'REGISTRATION' } })).pipe(
			catchError((error) => {
				console.error('Unable to find verification code : ', error);
				//send only if headers not set
				res.status(500).send('Unable to verify account');
				return EMPTY;
			}),
			switchMap((verification) => {
				if (verification) {
					//update the user's active status to true
					return from(User.update({ active: true }, { where: { userId: req.body.userId } }));
				}
				else {
					res.sendStatus(404);
					return EMPTY;
				}
			}),
			catchError((error) => {
				console.error('Unable to update user : ', error);
				//send only if headers not set
				if (!res.headersSent) res.sendStatus(500);
				return EMPTY;
			}),
			map((userUpdateStatus) => {
				//delete the verification code
				return from(Verification.destroy({ where: { verificationId: req.body.verificationId } }));
			}),
			catchError((error) => {
				console.error('Unable to delete verification code : ', error);
				//send only if headers not set
				if (!res.headersSent) res.sendStatus(500);
				return EMPTY;
			}),
			//get the user record
			switchMap(() => {
				return from(User.findOne({ where: { userId: req.body.userId } }));
			}),
			switchMap((newUser) => {
				console.log("NEW USER IS: ", newUser);
				let userData = newUser.dataValues;
				if (userData) {
					console.log('User record updated successfully!', userData);
					//generate jwt token for session
//					return from(utils.generateJWT(req.body.userId));
					return from(utils.generateJWT(
						userData.userId,
						userData.email,
						userData.role,
						true,
						userData.firstname,
						userData.surname,
						userData.referralCode,
						userData.phone,
						null 
					));
				}
				else {
					console.error('Unable to generate jwt: ', error);
					if (!res.headersSent) res.sendStatus(500);
					return EMPTY;
				}
			}),
			catchError((error) => {
				console.error('Unable to generate JWT token: ', error);
				if (!res.headersSent) res.sendStatus(500);
				return EMPTY;
			})
		).subscribe({
			next: (token) => {
				if (!res.headersSent) res.send({ token });
			},
		});
	}
	else {
		res.sendStatus(400);
	}
}

//startLogin function that will take an email, check that the user exists, and then send a verification code to the user
function startLogin(req, res, next) {
	let userId, verificationId;
	//get the email address from the request body
	if (req.body.email) {
		//validate the email is valid
		if (utils.validateEmail(req.body.email)) {
			//check if the user exists
			from(User.findOne({ where: { email: req.body.email } }))
				.pipe(
					switchMap((user) => {
						if (user && user.active) {
							//store userId
							userId = user.userId;
							//generate 5-digit random number
							const verificationCode = Math.floor(10000 + Math.random() * 90000);
							return from(Verification.create({ userId: user.userId, verificationMessage: verificationCode, type: 'LOGIN' }));
						}
						else {
							res.status(404).send('Problem with email');
							return EMPTY;
						}
					}),
					catchError((error) => {
						console.error('Unable to create verification code : ', error);
						//send only if headers not set
						if (!res.headersSent) res.sendStatus(500);
					}),
					map((verification) => {
						//save verification id
						verificationId = verification.verificationId;
						//						console.log('Verification code created successfully!', verification);
						//send email with verification code to user
						const subject = 'Please Complete Your Unite Login';
						const recipients = [{ email: req.body.email }];
						const htmlContent = `<p>Your Unite login code is <b>${verification.verificationMessage}</b></p>. <p>Enter this code in the app to complete your login.</p>`;
						const textContent = `Your Unite login code is ${verification.verificationMessage}. Enter this code in the app to complete your login.`;
						utils.sendEmail(verification.userId, subject, recipients, null, htmlContent, textContent, null, null, null, 'LOGINUSER');
						return true;
					})
				).subscribe({
					complete: () => {
						if (!res.headersSent) {
							//set response header status 200
							res.status(200);
							res.send({ userId, verificationId });
						}
					}
				});
		}
		else {
			res.sendStatus(400);
		}
	}
	else {
		res.sendStatus(400);
	}
}

function completeLogin(req, res, next) {
	//get the userId and validation code, confirm that the userId is valid using the User model, and then confirm that the validation code is valid using the Verification model
	let userRecord;
	if (req.body.userId && req.body.verificationMessage) {
		//check if the user exists
		from(User.findOne({ where: { userId: req.body.userId } }))
			.pipe(
				switchMap((user) => {
					if (user) {
						//store role
						userRecord = user.dataValues;
						//check if the validation code is valid
						return from(Verification.findOne({
							where: {
								userId: req.body.userId, verificationMessage: req.body.verificationMessage,
								type: {
									[Op.or]: ['LOGIN', 'REGISTRATION']
								}
							}
						}));
					}
					else {
						res.sendStatus(404);
						return EMPTY;
					}
				}),
				catchError((error) => {
					//				console.error('Unable to find user record: ', error);
					if (!res.headersSent) res.sendStatus(404);
				}),
				switchMap((verification) => {
					if (verification) {
						//destroy the verification record
						return from(Verification.destroy({
							where: {
								userId: req.body.userId, verificationMessage: req.body.verificationMessage,
								type: {
									[Op.or]: ['LOGIN', 'REGISTRATION']
								}
							}
						}));
					}
					else {
						//					console.log('UNEXPECTED VERIFICATION', verification);
						if (!res.headersSent) res.sendStatus(500);
						return EMPTY;
					}
				}),
				catchError((error) => {
					//				console.error('Unable to delete verification record: ', error);
					if (!res.headersSent) res.sendStatus(500);
				}),
				switchMap((deletedVerification) => {
					if (deletedVerification) {
						// Get all addresses linked to the user
						return from(Addresses.findAll({
							where: {
								userId: userRecord.userId,
							},
							raw: true,
						})).pipe(
							switchMap((addresses) => {
								return from(utils.generateJWT(
									userRecord.userId,
									userRecord.email,
									userRecord.role,
									true,
									userRecord.firstname,
									userRecord.surname,
									userRecord.referralCode,
									userRecord.phone,
									addresses
								));
							})
						);
					} else {
						if (!res.headersSent) res.sendStatus(500);
						return EMPTY;
					}
				}),
				/*
				switchMap((deletedVerification) => {
					if (deletedVerification) {
						//generate jwt token for session
						return from(utils.generateJWT(userRecord.userId, userRecord.email, userRecord.role, true, userRecord.firstname, userRecord.surname, userRecord.referralCode, userRecord.phone));
					}
					else {
						if (!res.headersSent) res.sendStatus(500);
						return EMPTY;
					}
				}),
				*/
				catchError((error) => {
					console.error('Unable to generate JWT token: ', error);
					if (!res.headersSent) res.sendStatus(500);
				})
			).subscribe({
				next: (token) => {
					if (token) {
						console.log('TOKEN:', token)
						//send the token back to the client
						if (!res.headersSent) res.send({ token });
					}
					else {
						console.log('NO TOKEN:', token);
						if (!res.headersSent) res.sendStatus(500);
					}
				},
				error: (error) => {
					console.error('Unable to complete login: ', error);
					if (!res.headersSent) res.sendStatus(500);
				}
			});
	}
	else {
		res.sendStatus(400);
	}
}

async function updateUser(userId, firstName, lastName, profilePicture) {
	try {
		const user = await Account.findByPk(userId);
		if (!user) {
			throw new Error('User not found');
		}

		if (firstName) {
			user.firstName = firstName;
		}

		if (lastName) {
			user.lastName = lastName;
		}

		if (profilePicture) {
			user.profilePicture = profilePicture;
		}

		await user.save();

		return user;
	} catch (error) {
		throw new Error(`Failed to update user: ${error.message}`);
	}
}



module.exports = {
	startLogin, registerUserStep1, updateUser,
	completeLogin, registerUserStep2,

}