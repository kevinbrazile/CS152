'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var blogPost = Schema( {
  title: String,
  content: String,
  createdAt: Date,
  userId: ObjectId,
  googlename:String,
} );

module.exports = mongoose.model( 'BlogPost', blogPost );
