const sibMail = require('sib-api-v3-sdk');
const sibClient = sibMail.ApiClient.instance;
const sibApiKey = sibClient.authentications['api-key'];
sibApiKey.apiKey = process.env.SENDINBLUEAPIKEY;
const sibMailerApi = new sibMail.TransactionalEmailsApi();
const { of, Observable, from } = require('rxjs');
const cloudinary = require("cloudinary").v2;
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});
//const request = require('request');
const axios = require('axios');
const jwt = require('jsonwebtoken');

function sendEmail(userId, subject, recipients, ccs = null, htmlContent, textContent, attachmentName = null, attachmentData = null, attachmentType = null, logData) {
	//try sib first. If that fails, try mailchimp
	const completeHtml = htmlContent + `<p>********************************<p>`;
	if (userId && subject && recipients.length > 0 && (htmlContent || textContent) && logData) {
		const sibEmail = {
			sender: { email: process.env.EMAILSENDEREMAIL, name: process.env.EMAILSENDERNAME },
			replyTo: { email: process.env.EMAILSENDEREMAIL, name: process.env.EMAILSENDERNAME },
			to: recipients,
			subject,
			htmlContent: completeHtml,
			textContent
		};
		if (attachmentName && attachmentData) {
			sibEmail.attachment = [{ name: attachmentName, content: attachmentData }];
		}
		if (ccs && ccs.length > 0) {
			sibEmail.cc = ccs;
		}

		sibMailerApi.sendTransacEmail(sibEmail)
			.then(res => logTransaction('info', userId, logData, res))
			.catch(err => {
				console.log(`SIB Email Failed with ${err}. `);
			})
	}
	else {
		console.log('Missing parameters for sendEmail2', arguments);
	}
}

function logTransaction(level, userId, logData, res) {
}

//generate a jwt token with userId, email, role, and active
function generateJWT(userId, email, role, active) {
	const token = jwt.sign({
		userId,
		email,
		role,
		active
	}, process.env.JWTSECRET, { expiresIn: '1d' });
	return of(token);
}

//a function that will take a base64 string representing an image and save it in cloudinary, returning the URL
function saveImageToCloudinary$(imageString) {
	//	const img = 'data:image/jpeg;base64,' + imageString;
	return new Observable(observer => {
		cloudinary.uploader.upload(imageString, (error, result) => {
			if (error) {
				observer.error(error);
			} else {
				observer.next(result.url);
				observer.complete();
			}
		});
	});
}

//a function that will scan an image using base64.ai and return the text
function scanImage(imageString, type, res) {
	let image;
	if(type == 'b64') {
		image = JSON.stringify({ image : imageString.dataUrl});
	}
	if(type == 'url') {
		image = JSON.stringify({ url : imageString });
	}
/*
	const options = {
		'method': 'POST',
		'url': process.env.BASE64URL,
		'headers': {
			'Content-Type': 'application/json',
			'Authorization': process.env.BASE64SECRET
		},
		body: JSON.stringify({ url: imageString }),
		timeout: 10000
	};
	console.log('URL:', process.env.BASE64URL.toString());
	console.log('AUTH', process.env.BASE64SECRET);
	console.log('IMAGE:', imageString);
*/

	return from(axios({
		method : 'POST',
		url : process.env.BASE64URL.toString(),
		headers : {
			'Authorization' : process.env.BASE64SECRET,
			'Content-Type' : 'application/json'
		},
		data : {
			url : imageString,
			timeout : 10000
		}
	}));
	/*
	request(options, function (error, response) {
		console.log('ERROR & RESPONSE:', error, response.body);
		if (error) throw new Error(error);
		res.send({data : response.body});
	});
	*/
}

function validateEmail(email) {
	const re = /\S+@\S+\.\S+/;
	return re.test(email);
}

function generateEmailContent(mailContent) {
	const {reminderType, daysRemaining, firstname, type} = mailContent;
	let htmlContent, textContent;
	switch(reminderType) {
		case 'WEEKLY' :
			htmlContent = `<html>
				<head>
					<title>Document Expiry Reminder</title>
				</head>
				<body>
					<p>Dear ${firstname},</p>
					<p>Your ${type} document expires in 1 week. Please renew it now. Login to Inside for more details.</p>
					<p>Regards,</p>
					<p>Inside Team</p>
				</body>
			</html>`;
			textContent = `Dear ${firstname},
				Your ${type} document expires in 1 week. Please renew it now. Login to Inside for more details.
				Regards,
				Inside Team`;
			break;
		case 'DAILY' :
			htmlContent = `<html>
				<head>
					<title>Document Expiry Reminder</title>
				</head>
				<body>
					<p>Dear ${firstname},</p>
					<p>Your ${type} document expires in a few days! Please renew it now. Login to Inside for more details.</p>
					<p>Regards,</p>
					<p>Inside Team</p>
				</body>
			</html>`;
			textContent = `Dear ${firstname},
				Your ${type} document expires in a few days! Please renew it now. Login to Inside for more details.
				Regards,
				Inside Team`;
			break;
		case 'DUE' :
			htmlContent = `<html>
				<head>
					<title>Document Expiry Reminder</title>
				</head>
				<body>
					<p>Dear ${firstname},</p>
					<p>Your ${type} document expires today! Login to Inside for more details.</p>
					<p>Regards,</p>
					<p>Inside Team</p>
				</body>
			</html>`;
			textContent = `Dear ${firstname},
				Your ${type} document expires today! Login to Inside for more details.
				Regards,
				Inside Team`;
			break;
		default :
			htmlContent = `<html>
				<head>
					<title>Document Expiry Reminder</title>
				</head>
				<body>
					<p>Dear ${firstname},</p>
					<p>Your ${type} document expires in ${daysRemaining} days. Please renew it as soon as possible. Login to Inside for more details.</p>
					<p>Regards,</p>
					<p>Inside Team</p>
				</body>
			</html>`;
			textContent = `Dear ${firstname},
				Your ${type} document expires in ${daysRemaining} days. Please renew it as soon as possible.Login to Inside for more details.
				Regards,
				Inside Team`;
			break;
	}
	return {htmlContent, textContent};
}

//unix timestamp
function timeNow() {
	return Math.floor(Date.now() / 1000);
}

function generateLongRandomString() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

module.exports = {
	sendEmail, generateJWT, logTransaction, saveImageToCloudinary$,
	scanImage, validateEmail, generateEmailContent, timeNow,
	generateLongRandomString
}