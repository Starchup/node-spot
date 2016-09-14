/**
 * Modules from the community: package.json
 */
var request = require('request-promise');

/**
 * Constructor
 */
var SPOT = function(config) {

    var self = this;

    //Default CONFIG
    self.CONFIG = {
        AccountKey: null,
        SessionId: null,
        SecurityId: null,
        CustomerName: null,
        URL: "https://servicestest.spotpos.com/ccapi/q",
        Settings: null,
        UserAgent: "Backend Integration",
        headers: {
            'Content-type': 'application/json'
        }
    };

    config = JSON.parse(JSON.stringify(config));

    self.CONFIG.AccountKey = config.account_key;
    self.CONFIG.SecurityID = config.security_id;

    // SPOT Requires SessionId & CustomerName to be in the request even when they have no value
    if (config.session_id) self.CONFIG.SessionID = config.session_id;
    if (config.customer_name) self.CONFIG.CustomerName = config.customer_name;

    if (config.settings) self.CONFIG.Settings = config.settings;
    if (config.production) self.CONFIG.URL = "https://api.mydrycleaner.com/q";


    /**
     * Implementation
     */
    // Request Functions and Objects
    self.Request = {

        CreateRequest: function(requestType, body) {

            // Clear out any null parameters in the body
            for (var attr in body) {
                if (body[attr] === null || body[attr] === undefined) delete body[attr];
            }

            // BUild main request body with configuration variables
            var requestBody = {};
            requestBody.RequestType = requestType;
            requestBody.AccountKey = self.CONFIG.AccountKey;
            requestBody.SecurityID = self.CONFIG.SecurityID;
            requestBody.UserAgent = self.CONFIG.UserAgent;

            if (self.CONFIG.SessionID) requestBody.SessionID = self.CONFIG.SessionID;
            if (body) requestBody.Body = Util.base64._encode(JSON.stringify(body));

            var options = {
                headers: self.CONFIG.headers,
                uri: self.CONFIG.URL,
                method: 'POST',
                body: JSON.stringify(requestBody)
            };

            return request(options).then(function(result) {
                result = JSON.parse(result);
                return new Promise(function(resolve, reject) {
                    var err = new Error(result.Message);
                    err.code = 490;

                    if (result.Failed !== true && result.Message === 'Change account request succeeded') return resolve();
                    if (result.Failed === true || !result.ReturnObject) return reject(err);

                    resolve(result.ReturnObject);
                });
            });
        }
    };

    // AR Functions and Objects
    self.AR = {
        //Private - ARStatement ID
        ARStatement: function(statementId) {
            this.statementId = statementId;
        },

        //Private - ARPayment for Insert
        ARPayment: function(cardOnFileId, cardNo, cardExp, addCardToAccount, amount) {
            this.cardOnFileId = cardOnFileId;
            this.cardNo = cardNo;
            this.cardExp = cardExp;
            this.addCardToAccount = addCardToAccount;
            this.amount = amount;
        },

        //Public - Retrieve current AR Balance
        GetARBalance: function() {
            return new self.Request.CreateRequest('ARBalance', null);
        },

        //Public - Retrieve current AR activity
        GetARCurrentActivity: function() {
            return new self.Request.CreateRequest('ARCurrentActivity', null);
        },

        //Public - Retrieve detailed list of payments.
        GetPaymentDetails: function() {
            return new self.Request.CreateRequest('ARPaymentsDetail', null);
        },

        //Public - Retrieve information about a single statement.
        GetStatementDetails: function(statementId) {
            return new self.Request.CreateRequest('ARStatementDetail', new this.ARStatement(statementId));
        },

        //Public - Retrieve list of statements with summary information
        GetStatementsList: function() {
            return new self.Request.CreateRequest('ARStatementsList', null);
        },

        SavePayment: function(cardOnFileId, cardNo, cardExp, addCardToAccount, amount) {
            return new self.Request.CreateRequest('SavePayment', new this.ARPayment(cardOnFileId, cardNo, cardExp, addCardToAccount, amount));
        }
    };

    // Customer functions and objects
    self.Customer = {
        AddressObject: function(address1, address2, city, state, zip) {
            this.address1 = address1;
            this.address2 = address2;
            this.city = city;
            this.state = state;
            this.zip = zip;
        },

        Award: function(awardId) {
            this.id = awardId;
        },

        //Private - Save customer object
        CustomerInfo: function(clientAccountID, firstName, lastName, emailAddress, serviceType, password, accountNodeID, title, statementDestination, comments, referralSource, birthDate, routeID, clientInfo, primaryAddress1, primaryAddress2, primaryAddressCity, primaryAddressState, primaryAddressZip, deliveryAddress1, deliveryAddress2, deliveryAddressCity, deliveryAddressState, deliveryAddressZip, billingAddress1, billingAddress2, billingAddressCity, billingAddressState, billingAddressZip, phones) {
            this.clientAccountID = clientAccountID;
            this.firstName = firstName;
            this.lastName = lastName;
            this.emailAddress = emailAddress;
            this.serviceType = serviceType;
            this.password = password;
            this.accountNodeID = accountNodeID;
            this.title = title;
            this.statementDestination = statementDestination;
            this.comments = comments;
            this.referralSource = referralSource;
            this.birthDate = birthDate;
            this.routeID = routeID;
            this.clientInfo = clientInfo;
            this.primaryAddress = {
                Address1: primaryAddress1,
                Address2: primaryAddress2,
                City: primaryAddressCity,
                State: primaryAddressState,
                Zip: primaryAddressZip
            };
            this.deliveryAddress = {
                Address1: deliveryAddress1,
                Address2: deliveryAddress2,
                City: deliveryAddressCity,
                State: deliveryAddressState,
                Zip: deliveryAddressZip
            };
            this.billingAddress = {
                Address1: billingAddress1,
                Address2: billingAddress2,
                City: billingAddressCity,
                State: billingAddressState,
                Zip: billingAddressZip
            };
            this.phones = phones;
        },

        // Private GiftCard Object
        GiftCardNumber: function(giftCardNumber) {
            this.number = giftCardNumber;
        },

        // Private Notification Object
        Notification: function(notificationTypeName, notificationMethodName, notificationValue) {
            this.notificationTypeName = notificationTypeName;
            this.notificationMethodName = notificationMethodName;
            this.notificationValue = notificationValue;
        },

        ConvertToDelivery: function(routeId) {
            return new self.Request.CreateRequest('ConvertToDelivery', routeId);
        },

        // Public - Get Customer Info
        GetCustomer: function() {
            return new self.Request.CreateRequest('CustomerDetail', null);
        },

        // Public - Apply Award Code
        IssueAward: function(awardId) {
            return new self.Request.CreateRequest('IssueAward', new this.Award(awardId));
        },

        // Public - Send Notification of Pickup to Store
        NotifyPickup: function(storeId, timeRequested) {
            return new self.Request.CreateRequest('NotifyPickup', new this.PickupNotification(storeId, timeRequested));
        },

        // Private - Notify Pickup Object
        PickupNotification: function(storeId, timeRequested) {
            this.storeId = SPAccountNodeID;
            this.timeRequested = TimeRequested;
        },

        // Public - Redeem Gift Card
        RedeemGiftCard: function(giftCardNumber) {
            return new self.Request.CreateRequest('GiftCardRedeem', new this.GiftCardNumber(giftCardNumber));
        },

        // Public - Retrieve Gift Card Balance
        RetrieveGiftCardBalance: function(giftCardNumber) {
            return new self.Request.CreateRequest('GiftCardBalance', new this.GiftCardNumber(giftCardNumber));
        },

        // Public - Retrieve Gift Cards
        RetrieveGiftCards: function() {
            return new self.Request.CreateRequest('RetrieveGiftCards', null);
        },

        // Public - Save Customer Info
        SaveCustomer: function(clientInfo) {
            if (!clientInfo.clientAccountID || clientInfo.clientAccountID === '') {
                return new self.Request.CreateRequest('Signup', clientInfo);
            } else {
                return new self.Request.CreateRequest('SaveCustomer', clientInfo);
            }
        },

        // Public - Unsubscribe / Enable
        SaveNotification: function(notifications) {
            return new self.Request.CreateRequest('Unsubscribe', notifications);
        },

        // Public - Unsubscribe / Enable
        SaveNotificationNoUser: function(notifications) {
            return new self.Request.CreateRequest('UnsubscribeNoUser', notifications);
        },

        // Public - Unsubscribe All / Enable All
        SaveNotificationAll: function(notification) {
            return new self.Request.CreateRequest('UnsubscribeAll', notification);
        },

        // Public - Unsubscribe All / Enable All
        SaveNotificationAllNoUser: function(notification) {
            return new self.Request.CreateRequest('UnsubscribeAllNoUser', notification);
        },
        SendEmail: function(email) {
            return new self.Request.CreateRequest('SendEmail', email);
        }
    };

    //Invoice Functions and Objects
    self.Invoice = {
        //Private - InvoiceID
        Invoice: function(invoiceId) {
            this.invoiceId = invoiceId;
        },

        InvoicesList: function(filterTypeId, startDate, endDate) {
            this.filterTypeId = filterTypeId;
            this.startDate = startDate;
            this.endDate = endDate;
        },

        InvoicesListGarment: function(garmentDesc, descriptor) {
            this.garmentDesc = garmentDesc;
            this.descriptor = descriptor;
        },

        //Public - Retrieve Invoice Info
        GetInvoiceDetails: function(invoiceId) {
            return new self.Request.CreateRequest('InvoiceDetail', new this.Invoice(invoiceId));
        },

        GetInvoiceList: function(filterTypeId, startDate, endDate) {
            return new self.Request.CreateRequest('InvoicesList', new this.InvoicesList(filterTypeId, startDate, endDate));
        },

        GetInvoiceListGarment: function(garmentDesc, descriptor) {
            return new self.Request.CreateRequest('InvoicesByGarment', new this.InvoicesListGarment(garmentDesc, descriptor));
        }
    };

    // Route Pickup/Cancellation Functions and Objects
    self.Route = {
        CancellationRequest: function(fromDate, toDate, comments, instructionsRequest) {
            this.fromDate = fromDate;
            this.toDate = toDate;
            this.comments = comments;
            this.instructionsRequest = instructionsRequest;
        },

        PickupRequest: function(accountTransactionNumber, pickupDate, comments, instructionsRequest, deliveryType, visitType, deliveryDate) {
            this.accountTransactionNumber = accountTransactionNumber;
            this.comments = comments;
            this.instructionsRequest = instructionsRequest;
            this.deliveryType = deliveryType;
            this.pickupDate = pickupDate;
            this.visitType = visitType;
            this.deliveryDate = deliveryDate;
        },

        GetRouteDeliveryZones: function() {
            return new self.Request.CreateRequest('GetDeliveryZones', null);
        },

        PendingCancellations: function() {
            return new self.Request.CreateRequest('PendingCancellations', null);
        },

        PendingPickups: function() {
            return new self.Request.CreateRequest('PendingPickups', null);
        },

        SaveCancellationRequest: function(cancellationRequest) {
            return new self.Request.CreateRequest('CancellationRequest', cancellationRequest);
        },

        SavePickupRequest: function(pickupRequest) {
            return new self.Request.CreateRequest('PickupRequest', pickupRequest);
        }
    };

    // Settings
    self.Settings = {
        GetNotifications: function() {
            return new self.Request.CreateRequest('GetNotifications', null);
        },

        GetPreferences: function() {
            return new self.Request.CreateRequest('GetPreferences', null);
        },

        GetSettings: function() {
            return new self.Request.CreateRequest('GetSettings', null);
        }
    };

    // Store functions and objects
    self.Store = {
        GetStoreList: function() {
            return new self.Request.CreateRequest('StoreList', null);
        }
    };

    //User Functions and Objects
    self.User = {

        // Private - Message To Manager object.
        MessageToManager: function(subject, message, invoiceid) {
            this.subject = subject;
            this.message = message;
            this.invoiceid = invoiceid;
        },

        // Public - Change Password for logged in user.
        ChangePassword: function(newPassword) {
            return new self.Request.CreateRequest('ChangePassword', newPassword);
        },

        // Public - Send Message To Manager
        SendMessage: function(subject, body, invoiceid) {
            return new self.Request.CreateRequest('MessageToManagerNoUser', new this.MessageToManager(subject, body, null));
        },

        // Public - Send Message To Manager
        SendMessageUser: function(subject, body, invoiceid) {
            return new self.Request.CreateRequest('MessageToManagerUser', new this.MessageToManager(subject, body, invoiceid));
        },

        // Private - Login Object
        LoginObject: function(emailAddress, password) {
            this.user = emailAddress;
            this.password = password;
        },

        // Public - Initiate Login
        Login: function(emailAddress, password) {
            return new self.Request.CreateRequest('Login', new this.LoginObject(emailAddress, password))
                .then(function(result) {
                    return new Promise(function(resolve, reject) {
                        var err = new Error('Could not login');
                        err.code = 490;

                        if (!result.SessionID || !result.CustomerName) return reject(err);

                        self.CONFIG.SessionID = result.SessionID;
                        self.CONFIG.CustomerName = result.CustomerName;

                        resolve(result);
                    });
                });
        },

        // Public  - Intiate Logout Request
        Logout: function() {
            return new self.Request.CreateRequest('Logoff', null)
                .then(function(result) {
                    return new Promise(function(resolve, reject) {
                        self.CONFIG.SessionId = null;
                        self.CONFIG.CustomerName = null;

                        resolve(result);
                    });
                }).catch(function(error) {
                    return new Promise(function(resolve, reject) {
                        reject(error);
                    });
                });
        },

        // Public - Request password reminder
        PasswordReminder: function(requestInfo) {
            return new self.Request.CreateRequest('RememberPasswordRequest', requestInfo);
        },

        // Public - Request password reminder
        FinishPasswordReminder: function(requestInfo) {
            return new self.Request.CreateRequest('RememberPasswordFinish', requestInfo);
        },

        // Private - Insert Event Object
        InsertEventRequest: function(productName, customerID, eventStartDateTime, eventSource, eventEndDateTime) {
            this.productName = productName;
            this.customerID = customerID;
            this.eventStartDateTime = eventStartDateTime;
            this.eventSource = eventSource;
            this.eventEndDateTime = eventEndDateTime;
        },

        // Public - Insert a tracking event
        InsertEvent: function(requestInfo) {
            return new self.Request.CreateRequest('InsertEvent', requestInfo);
        },

        // Public - Update Event Object
        UpdateEventRequest: function(instanceID, customerID, eventEndDateTime) {
            this.instanceID = instanceID;
            this.customerID = customerID;
            this.eventEndDateTime = eventEndDateTime;
        },

        // Public - Update a tracking event
        UpdateEvent: function(requestInfo) {
            return new self.Request.CreateRequest('UpdateEvent', requestInfo);
        }
    };

    // Util functions
    self.Util = {
        GetToken: function() {
            return new self.Request.CreateRequest('GetToken', null)
                .then(function(result) {
                    try {
                        self.CONFIG.SessionID = result.SessionID;
                    } catch (e) {
                        e.message = "Could not setup SPOT with AccountKey: %s and SecurityID: %s", self.CONFIG.AccountKey, sef.CONFIG.SecurityID;
                        throw e;
                    }
                });
        },
        // Private - Encode Base64.
        base64: {
            _PADCHAR: "=",
            _ALPHA: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            _VERSION: "1.0",

            _getbyte64: function(s, i) {
                var idx = this._ALPHA.indexOf(s.charAt(i));
                if (idx === -1) {
                    throw "Cannot decode base64";
                }
                return idx;
            },

            _decode: function(s) {
                var pads = 0,
                    i, b10,
                    imax = s.length,
                    x = [];
                s = String(s);
                if (imax === 0) {
                    return s;
                }
                if (imax % 4 !== 0) {
                    throw "Cannot decode base64";
                }
                if (s.charAt(imax - 1) === this._PADCHAR) {
                    pads = 1;
                    if (s.charAt(imax - 2) === this._PADCHAR) {
                        pads = 2;
                    }
                    imax -= 4;
                }
                for (i = 0; i < imax; i += 4) {
                    b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12) | (this._getbyte64(s, i + 2) << 6) | this._getbyte64(s, i + 3);
                    x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255, b10 & 255));
                }
                switch (pads) {
                    case 1:
                        b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12) | (this._getbyte64(s, i + 2) << 6);
                        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 255));
                        break;
                    case 2:
                        b10 = (this._getbyte64(s, i) << 18) | (this._getbyte64(s, i + 1) << 12);
                        x.push(String.fromCharCode(b10 >> 16));
                        break;
                }
                return x.join("");
            },

            _getbyte: function(s, i) {
                var x = s.charCodeAt(i);
                if (x > 255) {
                    throw "INVALID_CHARACTER_ERR: DOM Exception 5";
                }
                return x;
            },

            _encode: function(s) {
                if (arguments.length !== 1) {
                    throw "SyntaxError: exactly one argument required";
                }
                s = String(s);
                var i, b10, x = [],
                    imax = s.length - s.length % 3;
                if (s.length === 0) {
                    return s;
                }
                for (i = 0; i < imax; i += 3) {
                    b10 = (this._getbyte(s, i) << 16) | (this._getbyte(s, i + 1) << 8) | this._getbyte(s, i + 2);
                    x.push(this._ALPHA.charAt(b10 >> 18));
                    x.push(this._ALPHA.charAt((b10 >> 12) & 63));
                    x.push(this._ALPHA.charAt((b10 >> 6) & 63));
                    x.push(this._ALPHA.charAt(b10 & 63));
                }
                switch (s.length - imax) {
                    case 1:
                        b10 = this._getbyte(s, i) << 16;
                        x.push(this._ALPHA.charAt(b10 >> 18) + this._ALPHA.charAt((b10 >> 12) & 63) + this._PADCHAR + this._PADCHAR);
                        break;
                    case 2:
                        b10 = (this._getbyte(s, i) << 16) | (this._getbyte(s, i + 1) << 8);
                        x.push(this._ALPHA.charAt(b10 >> 18) + this._ALPHA.charAt((b10 >> 12) & 63) + this._ALPHA.charAt((b10 >> 6) & 63) + this._PADCHAR);
                        break;
                }
                return x.join("");
            }
        },

        Validate: {
            CCExpiration: function(s) {
                if (/^[0-9]{2}[//][0-9]{2}$/.test(s)) {
                    if (new Date().getFullYear() < Number(s.split('/')[1]) + 2000) {
                        return true;
                    }
                }
                return false;
            },

            CCNumber: function(s) {
                var ca, sum = 0,
                    mul = 1;
                var len = s.length;
                while (len--) {
                    ca = parseInt(s.charAt(len), 10) * mul;
                    sum += ca - (ca > 9) * 9;
                    mul ^= 3;
                }
                return (sum % 10 === 0) && (sum > 0);
            },

            CCType: function(s) {
                if (typeof self.CONFIG.Settings.CCTypesSupported == 'undefined') {
                    return false;
                }

                if (self.CONFIG.Settings.CCTypesSupported.search(self.Util.Validate.GetCCType(s)) == -1) {
                    return false;
                }

                return self.Util.Validate.CCNumber(s);
            },

            EmailAddress: function(s) {
                return /^[A-Za-z0-9.]+@[A-Za-z0-9]+\.[A-Za-z]{2,4}/.test(s);
            },

            GetCCType: function(s) {
                var cc = (s + '').replace(/\s/g, ''); //remove space

                if ((/^(34|37)/).test(cc) && cc.length == 15) {
                    return 'AMEX'; //AMEX begins with 34 or 37, and length is 15.
                } else if ((/^(51|52|53|54|55)/).test(cc) && cc.length == 16) {
                    return 'MC'; //MasterCard beigins with 51-55, and length is 16.
                } else if ((/^(4)/).test(cc) && (cc.length == 13 || cc.length == 16)) {
                    return 'VISA'; //VISA begins with 4, and length is 13 or 16.
                } else if ((/^(300|301|302|303|304|305|36|38)/).test(cc) && cc.length == 14) {
                    return 'DNRS'; //Diners Club begins with 300-305 or 36 or 38, and length is 14.
                } else if ((/^(6011)/).test(cc) && cc.length == 16) {
                    return 'DISC'; //Discover begins with 6011, and length is 16.
                } else if ((/^(3)/).test(cc) && cc.length == 16) {
                    return 'JCB'; //JCB begins with 3, and length is 16.
                } else if ((/^(2131|1800)/).test(cc) && cc.length == 15) {
                    return 'JCB'; //JCB begins with 2131 or 1800, and length is 15.
                } else if ((/^(300|301|302|303|304|305|36|38)/).test(cc) && cc.length == 14) {
                    return 'CART'; //Cart Blanche begins with 300-305 or 36 or 38 and length of 14.
                } else if ((/^(6334|6767)/).test(cc) && (cc.length == 16 || cc.length == 18 || cc.length == 19)) {
                    return 'SOLO'; //Solo begins with 6334 or 6767 and length is 16, 18, or 19.
                } else if ((/^(4903|4905|4911|4936|564182|633110|633|6759)/).test(cc) && (cc.length == 16 || cc.length == 18 || cc.length == 19)) {
                    return 'SWTC'; //Switch begins with 4903, 4905, 4911, 4936, 564182, 633110, 6333, 6759 and length is 16, 18, or 19.
                } else if ((/^(5020|6)/).test(cc) && (cc.length == 16 || cc.length == 18)) {
                    return 'MAES'; //Maestro begins with 5020 or 6 and length is 16 or 18.
                }
                return 'UNKN'; //unknown type
            },

            Password: function(s) {
                if (!/^.{6,30}$/.test(s) || !/[A-Z]/.test(s) || !/[0-9]/.test(s)) {
                    return false;
                } else {
                    return true;
                }
            },

            Phone10: function(s) {
                var p = (s + '').replace(/[^\d]/g, '');
                return /^[\d]{10}$/.test(p);
            }
        }
    };
};
module.exports = SPOT;