exports.handler = function(context, event, callback) {

    const stripe = require('stripe')(process.env.STRIPE);

    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    console.log(event.orderid);

    var items = [];

    base('Order Items').select({
        filterByFormula: `{OrderID} = "${event.orderid}"`
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            
            var item = {};

            item.quantity = 1;
            item.price_data = {};
            item.price_data.unit_amount = parseInt(record.get('Price') * 100) ;
            item.price_data.product_data = {};
            item.price_data.product_data.name = String(record.get('Product Name'));
            item.price_data.currency = 'usd';

            items.push(item);

        });

        console.log(items);

        stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items : items,
            mode: 'payment',
            success_url: process.env.HOST + '/success.html' + '?orderid=' + event.orderid,
            cancel_url: process.env.HOST + '/cancel.html' + '?orderid=' + event.orderid,
        },
        function (err, session){
            callback(null, { id : session.id })
        });
    });
}