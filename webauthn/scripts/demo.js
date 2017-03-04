(function () {
	'use strict';

	const credAlgorithm = 'RSASSA-PKCS1-v1_5';

	/******************************************
	 *                                        *
	 *	      Retrieve HTML Elements          *
	 *                                        *
	 ******************************************/

	const buttonLogon = document.getElementById('idButton_Logon');
	const buttonLogonWWinHello = document.getElementById('idButton_LogonWWinHello');
	const textboxAcctName = document.getElementById('idDiv_AcctName');
	const textboxPwd = document.getElementById('idInput_Pwd');
	const buttonLogonwPwd = document.getElementById('idButton_LogonWPwd');
	const buttonLogonWoRegister = document.getElementById('idButton_LogonWoRegister');
	const buttonReset = document.getElementById('idButton_Reset');
	const buttonMaybeLater = document.getElementById('idButton_MaybeLater');
	const buttonRegisterWinHello = document.getElementById('idButton_RegisterWinHello');
	const buttonSetupWinHello = document.getElementById('idButton_SetupWinHello');
	const divSetupwWinHello = document.getElementById('idDiv_SetupWindowsHello');


	/******************************************
	 *                                        *
	 *	           Helper Functions           *
	 *                                        *
	 ******************************************/

	/*
		The following function utf8ToBytes, utf8Slice, and decodeUtf8Char comes from TextEncoderLite:
	 		https://github.com/coolaj86/TextEncoderLite
	 	Thank you coolaj.86 and Feross et al! :-)
		The TextEncoderLite is licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
	*/

	const utf8ToBytes = function (string, units) {
		units = units || Infinity
		var codePoint
		var length = string.length
		var leadSurrogate = null
		var bytes = []
		var i = 0

		for (; i < length; i++) {
			codePoint = string.charCodeAt(i)

			// is surrogate component
			if (codePoint > 0xD7FF && codePoint < 0xE000) {
				// last char was a lead
				if (leadSurrogate) {
					// 2 leads in a row
					if (codePoint < 0xDC00) {
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						leadSurrogate = codePoint
						continue
					} else {
						// valid surrogate pair
						codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
						leadSurrogate = null
					}
				} else {
					// no lead yet

					if (codePoint > 0xDBFF) {
						// unexpected trail
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						continue
					} else if (i + 1 === length) {
						// unpaired lead
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
						continue
					} else {
						// valid lead
						leadSurrogate = codePoint
						continue
					}
				}
			} else if (leadSurrogate) {
				// valid bmp char, but last char was a lead
				if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
				leadSurrogate = null
			}

			// encode utf8
			if (codePoint < 0x80) {
				if ((units -= 1) < 0) break
				bytes.push(codePoint)
			} else if (codePoint < 0x800) {
				if ((units -= 2) < 0) break
				bytes.push(
					codePoint >> 0x6 | 0xC0,
					codePoint & 0x3F | 0x80
				)
			} else if (codePoint < 0x10000) {
				if ((units -= 3) < 0) break
				bytes.push(
					codePoint >> 0xC | 0xE0,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				)
			} else if (codePoint < 0x200000) {
				if ((units -= 4) < 0) break
				bytes.push(
					codePoint >> 0x12 | 0xF0,
					codePoint >> 0xC & 0x3F | 0x80,
					codePoint >> 0x6 & 0x3F | 0x80,
					codePoint & 0x3F | 0x80
				)
			} else {
				throw new Error('Invalid code point')
			}
		}

		return bytes
	}

	const log = function (message) {
		console.log(message);
	};

	// Create random non-capitalized character of different length.
	const randomStr = function (length) {
		let text = '';
		const possible = 'abcdefghijklmnopqrstuvwxyz';

		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	};

	/******************************************
	 *                                        *
	 *	               UI Flow                *
	 *                                        *
	 ******************************************/


	const gotoHome = function() {
		location.href = 'home.html';
	};

	const gotoRegister = function() {

		startSessionOnServer();

		location.href = 'webauthnregister.html';
	};

	const addPasswordField = function() {
		buttonLogon.style.display = 'block';
		textboxPwd.style.display = 'block';
		buttonLogonWWinHello.style.display = 'none';
		buttonLogonwPwd.style.display = 'none';
		buttonLogonWoRegister.style.display = 'none';
	};

	const hidePasswordField = function () {
		buttonLogon.style.display = 'none';
		textboxPwd.style.display = 'none';
		buttonLogonWoRegister.style.display = 'none';
		buttonLogonWWinHello.style.display = 'block';
		buttonLogonwPwd.style.display = 'block';
	};

	const showSetupWindowsHelloDialog = function (show) {
		if (show) {
			divSetupwWinHello.style.display = 'none';
		} else {
			divSetupwWinHello.style.display = 'none';
		}
	};

	const helpSetup = function (reason) {
		// Windows Hello isn't setup, show dialog explaining how to set up
		if (reason === 'NotAllowedError') {
			showSetupWindowsHelloDialog(true);
		} else {
			/* For other special error, direct to the regular inbox without
			   bothering to set up with windows hello. */
			gotoHome();
		}

		log(`Windows Hello failed (${reason.message}).`);
	};

	const addDirectSignIn = function () {
		textboxPwd.style.display = 'block';
		buttonLogonWoRegister.style.display = 'block';
		buttonLogonwPwd.style.display = 'none';
		buttonLogonWWinHello.style.display = 'none';
	};

	const signinOrRegister = function () {
		if (navigator.authentication) {
			// If Windows Hello is supported, offer to register Windows Hello
			gotoRegister();
		} else {
			/* If the WebAuthN API is not supported, neglect the WebAuthN register
			   page and jump to the inbox page directly. */
			gotoHome();
		}
	};

	const addRandomAcctInfo = function () {
		const randomDisplayName = randomStr(7);
		const randomAcctName = (`${randomDisplayName}@${randomStr(5)}.com`);
		const randomPasswd = randomStr(10);

		/* An account identifier used by the website to control the number of
		   credentials. There is only one credential for every id. */
		const acctId = randomStr(6);

		/* Account related information is typically stored in the server
		   side. To keep the demo as simple as possible, it is stored in
		   localStorage. */
		localStorage.setItem('displayName', randomDisplayName);
		localStorage.setItem('acctName', randomAcctName);
		localStorage.setItem('acctId', acctId);
		localStorage.setItem('passwd', randomPasswd);

		textboxAcctName.setAttribute('value', randomAcctName);
		textboxPwd.setAttribute('value', randomPasswd);
	};

	const resetPage = function () {
		/* Only authenticators can delete credentials. To reset the session, we
		   use a different account name and password. LocalStorage is also cleared
		   to give a fresh start.*/
		addPasswordField();
		localStorage.clear();
		addRandomAcctInfo();
	};

	const featureDetect = function () {
		const credentialId = localStorage.getItem('credentialId');

		if (credentialId) {
			const acctName = localStorage.getItem('acctName');

			textboxAcctName.setAttribute('value', acctName);

			/* If the user registered to use Windows Hello before, they can logon without using
			 his/her password. */
			hidePasswordField();
		} else {
			// Any error means that the user cannot sign in with WebAuthN and needs sign in with password.
			addPasswordField();
			addRandomAcctInfo();
		}
	};

	/******************************************
	 *                                        *
	 *	 Server Side Implementation on JS     *
	 *                                        *
	 ******************************************/


	const startSessionOnServer = function () {
		localStorage.setItem('acctIdOnServer', localStorage.getItem('acctId'));
		localStorage.setItem('acctNameOnServer', localStorage.getItem('acctName'));

	}

	const registerCredOnServer = function (credInfo) {
		/* This is where you would send data to the server.
		   For the sake of simplicity, nothing is sent.
		   Typically, the following information will be linked with the Account ID on the database. Since in the
		   demo site, there is only one user at any given time, the code doesn't differentiate between users.
		 */

		// Web developers can also store the credential id on their server.
		localStorage.setItem('credentialIdOnServer', credInfo.credential.id);
		localStorage.setItem('credentialTypeOnServer', credInfo.credential.type);
		// The public key here is a JSON object.

		localStorage.setItem('publicKeyOnServer', credInfo.publicKey);
	};

	const verifyAssertionOnServer = function (assertion) {

		var credentialID =

		if (navigator.authentication) {



		} else {
			verifyMSFidoSignature()
		}

	};

	// function verifyMSFidoSignature(clientData,authenticatorData,signature,publicKey) {
    //
	// 	var hash;
    //
	// 	// the server would have to validate that the clientData contained the same challenge
	// 	// that was generated on the server for the getAssertion call
	// 	return crypto.subtle.digest("SHA-256",parseBase64(clientData))
    //
	// 		.then(function(h) {
	// 			hash = new Uint8Array(h);
	// 			return crypto.subtle.importKey("jwk",JSON.parse(publicKey),credAlgorithm,false,["verify"]);
	// 		})
    //
	// 		.then(function(key) {
    //
	// 			return crypto.subtle.verify({name:credAlgorithm, hash: { name: "SHA-256" }},
	// 				key,parseBase64(signature),concatUint8Array(parseBase64(authenticatorData),hash));
	// 		});
	// }
    //
	// function verifyWD2Signature(clientData,authenticatorData,signature,publicKey) {
    //
	// 	var hash;
    //
	// 	// the server would have to validate that the clientData contained the same challenge
	// 	// that was generated on the server for the getAssertion call
	// 	return crypto.subtle.digest("SHA-256",parseBase64(clientData))
    //
	// 		.then(function(h) {
	// 			hash = new Uint8Array(h);
	// 			return crypto.subtle.importKey("jwk",JSON.parse(publicKey),credAlgorithm,false,["verify"]);
	// 		})
    //
	// 		.then(function(key) {
    //
	// 			return crypto.subtle.verify({name:credAlgorithm, hash: { name: "SHA-256" }},
	// 				key,parseBase64(signature),concatUint8Array(parseBase64(authenticatorData),hash));
	// 		});
	// }
    //
	// function verifySignature(clientData,authenticatorData,signature,publicKey) {
	//
	// 	if (navigator.authentication) {
	// 		return verifyWD2Signature(clientData, authenticatorData, signature, publicKey)
	// 	} else {
	// 		return verifyMSFidoSignature(clientData, authenticatorData, signature, publicKey)
	// 	}
	//
	// }

	/******************************************
	 *                                        *
	 *	   Calling Web Authentication API     *
	 *                                        *
	 ******************************************/

	// Register user with Web AuthN API
	const createCredential = function () {
		try {
			// This information would normally come from the server
			const accountInfo = {
				rpDisplayName: 'puppycam', // Name of relying party

				// The following account information is typically stored in the server
				// side. To keep the demo as simple as possible, it is stored in
				// localStorage.

				// Name of user account in relying partying
				displayName: localStorage.getItem('displayName'),
				name: localStorage.getItem('acctName'), // Detailed name of account
				id: localStorage.getItem('acctId') // Account identifier
			};

			const cryptoParameters = [{
				type: 'ScopedCred',
				algorithm: credAlgorithm
			}];

			/* The challenge is typically a random quantity generated by the server.
			This ensures the assertions are freshly generated and not replays. */
			const attestationChallenge = new Uint8Array(utf8ToBytes('Four score and seven years ago'));

			/* In consistent with the general Javascript rule about dictionary, if a member is not needed,
			there is no need to specify it or give it a null value. For the sake of
			demonstration, rpId, allowList, and extensions are specified here. */
			const options = [{
				timeoutSeconds: 60,
				rpId: '',
				excludeList: [],
				extensions: void 0
			}];

			navigator.authentication.makeCredential(accountInfo, cryptoParameters, attestationChallenge, options)
				.then(function (credInfo) {

					localStorage.setItem('credentialId', credInfo.credential.id);

					registerCredOnServer(credInfo);
					gotoHome();
				})
				.catch(function(reason) {
						// Windows Hello isn't setup, show dialog explaining how to set it up
					helpSetup(reason.message);
				});
		} catch (ex) {
			log('Cannot get the display name of the site, the account name, or the account id');
			gotoHome();
		}
	};


	// Authenticate the user
	const verify = function () {
		/*The challenge is typically a random quantity generated by the server
		  This ensures that any assertions are freshly generated and not replays */
		const challenge = new Uint8Array(utf8ToBytes('Our fathers brought forth on this continent, a new nation'));

		const allowList = [{
			/* There is only one type defined in the WebAuthN spec in Sept 29th. The link to
			   this version of the spec is: http://www.w3.org/TR/2016/WD-webauthn-20160928/ */

			type: 'ScopedCred',

				/* Because the current website only supports one user to login,
				   there should only be one credential available to use. */
			id: localStorage.getItem('acctId')
		}];

		/* The options parameters are ignored in the Microsoft preliminary implementation.
		   It is created and passed in as an example of what the code may look like with the
		   current WebAuthN API. */
		const options = {
			timeoutSeconds: 60,
			rpId: void 0,
			allowList, // Specify the allowList parameter
			extensions: {}
		};

		return navigator.authentication.getAssertion(challenge, options)
			.then(function(assertion) {
				// If the assertion calls succeeds, send assertion to the server.
				verifyAssertionOnServer(assertion);

				// If authenticated, sign in to regular inbox.
				gotoHome();
			})
			.catch(function(err) {
				log(`getAssertion() failed: ${err}`);

				gotoHome();
			});
	};



	/******************************************
	 *                                        *
	 *	   Add Listener to HTML Elements      *
	 *                                        *
	 ******************************************/

	document.addEventListener('DOMContentLoaded', function() {
		/* If the password field exists, detect whether the register with Windows Hello
		   exists. If so, hide the password field and show the "Sign In with Windows  Hello" button. */
		if (textboxAcctName) {
			featureDetect();
		}

		if (buttonLogon) {
			buttonLogon.addEventListener('click', signinOrRegister);
		}

		if (buttonLogonWWinHello) {
			buttonLogonWWinHello.addEventListener('click', verify);
		}

		if (buttonLogonwPwd) {
			buttonLogonwPwd.addEventListener('click', addDirectSignIn);
		}

		if (buttonReset) {
			buttonReset.addEventListener('click', resetPage);
		}

		if (buttonMaybeLater) {
			buttonMaybeLater.addEventListener('click', gotoHome);
		}

		if (buttonRegisterWinHello) {
			buttonRegisterWinHello.addEventListener('click', createCredential);
		}

		if (buttonSetupWinHello) {
			buttonSetupWinHello.addEventListener('click', showSetupWindowsHelloDialog(false));
		}

		if (buttonLogonWoRegister) {
			buttonLogonWoRegister.addEventListener('click', gotoHome);
		}
	});
}());