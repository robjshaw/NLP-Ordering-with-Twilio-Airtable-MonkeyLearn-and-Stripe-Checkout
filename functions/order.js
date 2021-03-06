exports.handler = function(context, event, callback) {

    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    var response = {};

    response.order_items = [];
    response.total = 0;

    base('Order Items').select({
        filterByFormula: `{OrderID} = "${event.OrderID}"`
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {

            console.log('test');

            var tmp = {};
            tmp.qty = record.get('qty');
            tmp.price = record.get('Price');
            tmp.name = record.get('Product Name');

            response.total = response.total + (parseInt(tmp.qty) * parseInt(tmp.price));

            response.order_items.push(tmp);
        });

        callback(null, response);

    });
}