exports.handler = function(context, event, callback) {

    const MonkeyLearn = require('monkeylearn')
    
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLEKEY}).base(process.env.AIRTABLEBASE);

    var inboundmessage = event.Body.toLowerCase();
    
    if (inboundmessage.includes('menu') == true){

        console.log('menu');

        // TODO extract table number & short url

        var response = 'Hi welcome to ' + process.env.PLACE + ' check out our menu ' + process.env.HOST + '/menu.html?table=43&location=1'

        callback(null, response);

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
                            qty = parseInt(parsed_value);
                        }

                        order[currentorder] = { 'qty' : qty};

                        break;

                    case 'product':

                        console.log('product1');

                        order[currentorder].parsed_value = arrayItem.parsed_value;

                        currentorder = currentorder + 1;
                    
                        break;

                    case 'drink':

                        console.log('drink1');

                        order[currentorder].parsed_value = arrayItem.parsed_value;
                        
                        currentorder = currentorder + 1;
                        
                        break;

                }
            });

            callback(null, order);
        })

    }

}