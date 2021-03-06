exports.handler = function(context, event, callback) {

    var response = {};

    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    const stripe = require('stripe')(process.env.STRIPE);
    
    response.order = event.orderid;

    base('Orders').select({
        filterByFormula: `{OrderID} = "${event.orderid}"`
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {

            base('Orders').update([
                {
                  "id": record.getId(),
                  "fields": {
                    "status": "paid"
                  }
                }
              ], function(err, records) {
                if (err) {
                  console.error(err);
                  return;
                }
                records.forEach(function(record) {
                  console.log(record.get('OrderID'));
                });
              });

            stripe.checkout.sessions.retrieve(
                String(record.get('payment_reference')
            ),function (err, session){

                response.session = session;

                callback(null, response);

            });
            
        });
    });

}