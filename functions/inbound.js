exports.handler = function(context, event, callback) {

    const MonkeyLearn = require('monkeylearn')
    
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    var shortid = require('shortid');

    var inboundmessage = event.Body.toLowerCase();
    
    if (inboundmessage.includes('menu') == true){

        console.log('menu');

        // TODO extract table number & short url

        var response = 'Hi welcome to ' + process.env.PLACE + ' check out our menu ' + process.env.HOST + '/menu.html?table=43&location=1'

        callback(null, response);

    }else{

        console.log('order');

        var orderid = shortid.generate();

        const ml = new MonkeyLearn(process.env.MLKEY)
        let model_id = process.env.MLMODEL
        let data = [inboundmessage]

        var order = [];
        
        /*
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
                            qty = parseInt(parsed_value);
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
                        order[currentorder].base = 'Drinks';
                        
                        currentorder = currentorder + 1;
                        
                        break;
                }

            });
        })
        */


        // testing struct so we don't have to hit ML platform every time
        
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

        // this is the end of testing... 


        base('Orders').create([
            {
                "fields":   {   "Phonenumber"   : event.From,
                                "status"        : "created",
                                "OrderID"       : orderid
                            }
            },
        ], function(err, records) {
            if (err) {
                console.error(err);
                return;
            }

            records.forEach(function (record) {

                console.log(orderid);

                order.forEach(function (orderitem) {

                    var order_record = record.getId();
                    
                    base('Products').select({
                        filterByFormula: `{keyword} = "${orderitem.parsed_value}"`
                    }).eachPage(function page(records, fetchNextPage) {

                        records.forEach(function(record) {

                            base('Order Items').create([
                                {
                                    "fields": {     "keyword"       : [record.getId()],
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

                    });
                    

                        
                });                

                callback(null, 'Thank you for your order head over to ' + process.env.HOST + '/payment.html?orderid=' +  orderid);

            });

            
        });

    }
}
