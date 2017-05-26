(function() {
    'use strict';

    const credAlgorithm = 'RS256';

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

    /*******************************
     *                             *
     *       Helper Functions      *
     *                             *
     *******************************/

    /* eslint-disable */

    // License and other comments
    // library code

    /*
			The following function stringToBytes, utf8Slice, and decodeUtf8Char comes from TextEncoderLite:
	 			https://github.com/coolaj86/TextEncoderLite
	 		Thank you coolaj.86 and Feross et al! :-)
			The TextEncoderLite is licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
		*/

    const stringToBytes = function(string, units) {
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

    const decodeUtf8Char = function(str) {

        try {
            return decodeURIComponent(str)
        } catch (err) {
            return String.fromCharCode(0xFFFD) // UTF 8 invalid char
        }

    }


    const bytesToString = function(buf, start, end) {

        var res = ''
        var tmp = ''
        end = Math.min(buf.length, end || Infinity)
        start = start || 0;

        for (var i = start; i < end; i++) {

            if (buf[i] <= 0x7F) {
                res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
                tmp = ''
            } else {
                tmp += '%' + buf[i].toString(16)
            }
        }

        return res + decodeUtf8Char(tmp)

    }

    const arrayBufferToBase64Str = function(buf) {

        return arrayBufferToBlob(buf, 'string').then(function(blob) {

            return blobToBase64String(blob).then(function(string) {

                return string;

            })
        }).catch(function(err) {
            log(`arrayBufferToBase64Str failed: ${err}`)
        })
    };


    const base64StrToArrayBuffer = function(str) {

        return base64StringToBlob(str, 'string').then(function(blob) {

            return blobToArrayBuffer(blob).then(function(array) {

                return array;

            })

        }).catch(function(err) {

            log('arrayBufferToBase64Str failed: ${err}');
        })

    };

    /*******************************
     *                             *
     *            UI Flow          *
     *                             *
     *******************************/

    /* eslint-enable */


    const gotoHome = function() {
        location.href = 'home.html';
    };

    const gotoRegister = function() {
        location.href = 'webauthnregister.html';
    };

    const sendToServer = function() {
        /* This is where you would send data to the server.
           Currently nothing is actually sent. */
    };

    const log = function(message) {
        console.log(message);
    };

    // Create random non-capitalized character of different length.
    const randomStr = function(length) {
        let text = '';
        const possible = 'abcdefghijklmnopqrstuvwxyz';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };

    const addPasswordField = function() {
        buttonLogon.style.display = 'block';
        textboxPwd.style.display = 'block';
        buttonLogonWWinHello.style.display = 'none';
        buttonLogonwPwd.style.display = 'none';
        buttonLogonWoRegister.style.display = 'none';
    };

    const hidePasswordField = function() {
        buttonLogon.style.display = 'none';
        textboxPwd.style.display = 'none';
        buttonLogonWoRegister.style.display = 'none';
        buttonLogonWWinHello.style.display = 'block';
        buttonLogonwPwd.style.display = 'block';
    };

    const showSetupWindowsHelloDialog = function(show) {
        if (show) {
            divSetupwWinHello.style.display = 'none';
        } else {
            divSetupwWinHello.style.display = 'none';
        }
    };

    const helpSetup = function(reason) {
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

    const addDirectSignIn = function() {
        textboxPwd.style.display = 'block';
        buttonLogonWoRegister.style.display = 'block';
        buttonLogonwPwd.style.display = 'none';
        buttonLogonWWinHello.style.display = 'none';
    };

    const signinOrRegister = function() {
        if (navigator.credentials) {
            // If Windows Hello is supported, offer to register Windows Hello
            gotoRegister();
        } else {
            /* If the WebAuthN API is not supported, neglect the WebAuthN register
               page and jump to the inbox page directly. */
            gotoHome();
        }
    };

    const addRandomAcctInfo = function() {
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

    const resetPage = function() {
        /* Only authenticators can delete credentials. To reset the session, we
           use a different account name and password. LocalStorage is also cleared
           to give a fresh start.*/
        addPasswordField();
        localStorage.clear();
        addRandomAcctInfo();
    };

    // Detect whether a credential has been created for this origin.
    const featureDetect = function() {
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

    /*******************************
     *                             *
     *    Calling WebAuthn API     *
     *                             *
     *******************************/

    // Register user with Web AuthN API
    const createCredential = function() {
        try {
            var createOptions = {
                /* The challenge is typically a random quantity generated by the server.
                This ensures the assertions are freshly generated and not replays. */
                challenge: new Uint8Array(stringToBytes('Four score and seven years ago')),

                rp: {
                    name: 'puppycam', // Name of relying party
                },

                // The following account information is typically stored in the server
                // side. To keep the demo as simple as possible, it is stored in localStorage.
                user: {
                    id: localStorage.getItem('acctId'), // Account identifier, such as john.smith@example.com
                    name: localStorage.getItem('acctName'), // Detailed name of account
                    // User name for display. such as John Smith
                    displayName: localStorage.getItem('displayName')
                },

                // This Relying Party will accept either an ES256 or RS256 credential, but
                // prefers an ES256 credential.
                parameters: [{
                        type: "public-key",
                        algorithm: "RS256",
                    },
                    {
                        type: "public-key",
                        algorithm: "ES256",
                    },
                ],

                timeout: 60000, // 1 minute

                /* In consistent with the general Javascript rule about dictionary, if a member is not needed,
                there is no need to specify it or give it a null value. For the sake of
                demonstration, excludeList, and extensions are specified here. */
                excludeList: [], // No excludeList
                extensions: void 0,
            };

            //navigator.credentials.create(publicKey)
			return navigator.credentials.create({"publicKey": createOptions})
                .then(function(credInfo) {
                    // Web developers can also store the credential id on their server.
                    arrayBufferToBase64Str(credInfo.credential.id).then(function(credIdStr) {
                            localStorage.setItem('credentialId', credIdStr);
                        })
                        .catch(function(err) {
                            log(`arrayBufferToBase64Str failed in converting credId: ${err}`);
                        });
                    //localStorage.setItem('credentialId', credInfo.credential.id);
                    // The public key here is a JSON object.
                    localStorage.setItem('publicKey', credInfo.publicKey);

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
    const verify = function() {

        let credIdStrFromStorage = localStorage.getItem('credentialId');

        base64StrToArrayBuffer(credIdStrFromStorage).then(function(credIdArray) {

                var options = {
                    /*The challenge is typically a random quantity generated by the server
		 		 This ensures that any assertions are freshly generated and not replays */
                    challenge: new Uint8Array(stringToBytes('Hello Windows')),
                    timeout: 60000, // 1 minute
                    allowList: [{
                        /* There is only one type defined in the WebAuthN spec in Sept 29th. The link to
				 	this version of the spec is: http://www.w3.org/TR/2016/WD-webauthn-20160928/ */
                        type: "public-key",

                        /* Because the current website only supports one user to login,
                           there should only be one credential available to use. */
                        id: credIdArray
                    }],

                    rpId: void 0,
                    extensions: void 0

                }

                return navigator.credentials.get({ "publicKey": options })
                    .then(function(assertion) {
                        // If the assertion calls succeeds, send assertion to the server.
                        sendToServer(assertion);

                        // If authenticated, sign in to regular inbox.
                        gotoHome();
                    })
                    .catch(function(err) {
                        log(`getAssertion() failed: ${err}`);

                        gotoHome();
                    });
            })
            .catch(function(err) {
                log(`arrayBufferToBase64Str failed in converting credId: ${err}`);
            });
    };


    /*******************************
     *                             *
     *   Add Listener to UI Event  *
     *                             *
     *******************************/

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
