var Schema = require('mongoose').Schema;

module.exports = new Schema({
    option: String,
    value: Schema.Types.Mixed
});