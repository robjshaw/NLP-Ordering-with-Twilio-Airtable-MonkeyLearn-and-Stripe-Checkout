exports.handler = function(context, event, callback) {

    // we need to handle event.BODY
    
    var response = 'Hi welcome to ' + process.env.PLACE + ' check out our menu' + process.env.HOST + '?menu.html?table=43&location=1'

    callback(null, response);

}