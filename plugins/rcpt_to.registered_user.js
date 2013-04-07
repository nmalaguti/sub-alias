// Check RCPT TO domain belongs to a user

var mongoose = require('mongoose');
var userSchema = require('./schemas/user');
var configSchema = require('./schemas/config');

var User = mongoose.model('User', userSchema);
var Config = mongoose.model('Config', configSchema);

var options = {
    server: {
        socketOptions: {
            keepAlive: 1
        }
    },
    replSet: {
        socketOptions: {
            keepAlive: 1
        }
    }
};

exports.hook_init_master = function (next) {
    var dbUri = this.config.get('rcpt_to.registered_user.db', 'value');
    server.logdebug(this, 'Connecting to ' + dbUri);

    mongoose.connect(dbUri, options);

    mongoose.connection.on('error', function (err) {
        return next(DENY);
    });
    mongoose.Connection.on('open', function () {
        return next();
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

    Config.findOne({ option: "domain" }).exec().then(function (config) {
        connection.logdebug('Config: ' + config);
        return config.value;
    }).then(function (domain) {
        connection.logdebug('Domain: ' + domain);
        if (parts.length !== 3 || parts.slice(1).join('.') !== domain) {
            return next();
        }

        var username = parts[0];
        connection.logdebug(this, 'Username: "' + username + '"');

        User.findOne({ name: username }).exec().then(function (user) {
            connection.logdebug('Found forwarding email: ' + user.email);
            connection.transaction.forwardTo = user.email;
            return next(OK);
        }, function (err) {
            throw err;
        });
    }, function (err) {
        connection.logdebug('Error: ', err);
        return next();
    });
}
