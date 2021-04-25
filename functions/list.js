exports.handler = function(context, event, callback) {

    const stripe = require('stripe')(process.env.STRIPE);

    stripe.checkout.sessions.list({
        limit: 100,
    }, function(err, response){
        
        
        
        callback(null, response.data);
    });

    /*
    var response = [];

    response[0] = {};
    response[0].id = '12345';
    response[0].name = 'Rob';
    response[0].price = '10';

    callback(null, response)
    */
}