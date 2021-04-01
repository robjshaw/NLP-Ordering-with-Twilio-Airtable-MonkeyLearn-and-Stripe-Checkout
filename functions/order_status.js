exports.handler = function(context, event, callback) {

    const stripe = require('stripe')(process.env.STRIPE);

    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    var response = {};
    response.order = event.orderid;

    base('Orders').select({
        filterByFormula: `{OrderID} = "${event.orderid}"`
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {

            stripe.checkout.sessions.retrieve(
                String(record.get('payment_reference')
            ),function (err, session){

                response.session = session;

                callback(null, response);

            });
        });
    });

    
}