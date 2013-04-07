var Schema = require('mongoose').Schema;

module.exports = new Schema({
    aliases: Schema.Types.Mixed,
    email: String,
    name: String
});