exports.handler = function(context, event, callback) {

    const stripe = require('stripe')(process.env.STRIPE);

    stripe.checkout.sessions.list({
        limit: 100,
    }, function(err, response){
        callback(null, response.data);
    });
}