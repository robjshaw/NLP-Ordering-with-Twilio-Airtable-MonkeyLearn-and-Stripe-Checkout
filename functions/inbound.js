exports.handler = function(context, event, callback) {

    const MonkeyLearn = require('monkeylearn');
    var fuzz = require('fuzzball');
    
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    var shortid = require('shortid');

    var inboundmessage = event.Body.toLowerCase();
    
    if (inboundmessage.includes('menu') == true){ 

        console.log('menu');

        // TODO short url

        var table_number = parseInt(inboundmessage.replace(/[^0-9]/g,''));
        var orderid = shortid.generate();

        base('Orders').create([
            {
                "fields":   {   "Phonenumber"   : event.From,
                                "status"        : "created",
                                "OrderID"       : orderid,
                                "table"         : table_number
                            }
            },
        ], function(err, records) {
            if (err) {
                console.error(err);
                return;
            }

            var response = 'Hi welcome to ' + process.env.PLACE + ' check out our menu ' + process.env.HOST + '/menu.html'

            callback(null, response);
        });

    }else{

        console.log('order');

        const ml = new MonkeyLearn(process.env.MLKEY)
        let model_id = process.env.MLMODEL
        let data = [inboundmessage]

        var order = [];
        
        ml.extractors.extract(model_id, data).then(res => {
            
            console.log(null, res.body);

            var response = res.body[0];

            response = response.extractions;

            var currentorder = 0;

            response.forEach(function (arrayItem) {
                var type = arrayItem.tag_name;

                switch(type) {
                    case 'quantity':

                        var qty = 0;

                        if (arrayItem.parsed_value == 'a'){
                            qty = 1;
                        }else{
                            qty = parseInt(arrayItem.parsed_value);
                        }

                        order[currentorder] = { 'qty' : qty};

                        break;

                    case 'product':

                        console.log('Products');

                        order[currentorder].parsed_value = arrayItem.parsed_value;
                        order[currentorder].base = 'Products';

                        currentorder = currentorder + 1;
                    
                        break;

                    case 'drink':

                        console.log('Drinks');

                        order[currentorder].parsed_value = arrayItem.parsed_value;
                        order[currentorder].base = 'Products';
                        
                        currentorder = currentorder + 1;
                        
                        break;
                }

            });
        })

        // testing struct so we don't have to hit ML platform every time

        /*

        var order = [
            {
                "qty": 1,
                "parsed_value": "beef",
                "type": "Products"
            },
            {
                "qty": 1,
                "parsed_value": "beer",
                "type": "Drinks"
            }
        ];

        */

        // this is the end of testing..

        var product_keywords = [];
        var product_keywords_records = [];

        var order_record = '';
        var order_id = '';
        
        base('Products').select({
            maxRecords: 100,
            view: "Grid view"
        }).eachPage(function page(records, fetchNextPage) {
        
            records.forEach(function(record) {
                product_keywords.push(record.get('keyword'));
                product_keywords_records.push(record.getId());
            });

            console.log(event.From);
            
            // TODO - ORDER STATUS

            base('Orders').select({
                filterByFormula: `{Phonenumber} = "${event.From}"`
            }).eachPage(function page(records, fetchNextPage) {

                records.forEach(function(record) {
                    order_record = record.getId();
                    order_id = record.get('OrderID')
                    console.log(order_record);
                });

                // TODO if order isn't already created create one

                order.forEach(function (orderitem) {

                    var selected_product = {};

                    selected_product.confidence = 0;

                    var i = 0;

                    product_keywords.forEach(function (product, i) {

                        var tmp = fuzz.ratio(product, orderitem.parsed_value);

                        if (tmp > selected_product.confidence){
                            selected_product.confidence = tmp;
                            selected_product.product = product;
                            selected_product.id = product_keywords_records[i];
                        }

                        // TODO if confidence not > ~75 check in per product.

                    });

                    console.log(selected_product);

                    base('Order Items').create([
                        {
                            "fields": {     "keyword"       : [selected_product.id],
                                            "qty"           : orderitem.qty,
                                            "OrderID"       : [order_record]
                                    }
                        }
                        ], function(err, records) {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        records.forEach(function (record) {
                            console.log(record.getId());
                        });
                    });

                });

                callback(null, 'Thank you for your order head over to ' + process.env.HOST + '/payment.html?orderid=' +  order_id);

            });

        }, function done(err) {
            if (err) { console.error(err); return; }
        });

    }
}