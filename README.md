# spot
NodeJS fully promisified SPOT POS Integration Wrapper


#### Initialization

`var SPOT = require('node-spot');`
`var pos = new SPOT({ account_key: your_account_key, security_id: your_security_id, production: true });`


#### Basic use

First setup the token: `pos.Util.GetToken();`

Then you can query any of the SPOT endpoints: https://developer.spotpos.com/
such as `pos.User.Login(email, password);`