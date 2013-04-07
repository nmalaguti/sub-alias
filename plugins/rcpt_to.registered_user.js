// Check RCPT TO domain belongs to a user

exports.hook_init_master = function (next) {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/test", function(err, db) {
        if (err === null && db !== null) {
            server.notes.db = db;
            server.notes.users = db.collection('users');
            server.notes.config = db.collection('config');
            
            return next();
        } else {
            connection.logdebug('Error connecting to MongoDB: ' + err);
            return next(DENY);
        }
    });
}

exports.hook_rcpt = function (next, connection, params) {
    var rcpt = params[0];
    // Missing @
    if (!rcpt.host) {
        return next();
    }

    connection.logdebug(this, 'Checking if ' + rcpt + ' host belongs to user');

    var domain = rcpt.host.toLowerCase();
    var parts = domain.split('.');
  
    // domain should look like username.x.com
    server.notes.config.findOne({"option": "domain"}, function(err, config) {
        if (err !== null || config !== null) {
            return next();
        }
    
        if (parts.length !== 3 || parts.slice(1).join('.') !== config.value)
        {
            return next();
        }
  
        var username = parts[0];
        connection.logdebug(this, 'Username: "' + username + '"');
  
        server.notes.users.findOne({name: username}, function (err, user) {
            if (err === null && user !== null) {
                connection.logdebug('Found forwarding email: ' + user.email);
                connection.transaction.forwardTo = user.email;
                return next(OK);
            } else {
                return next();
            }
        });
    });
}
