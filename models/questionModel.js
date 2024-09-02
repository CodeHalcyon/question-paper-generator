const mongoose = require("mongoose")

const questionSchema = mongoose.Schema({
    Q_No: Number,
    Question: String,
    Marks: String,
    BL: String,
    CO: String,
})

module.exports = mongoose.model("question",questionSchema)