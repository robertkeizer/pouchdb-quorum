'use strict';
var utils	= require('./pouch-utils');

exports.post = utils.toPromise(function (doc, options, callback) {
	return this.post.call(this, doc, options, options, callback);
});

exports.put = utils.toPromise(function (doc, docId, docRev, options, callback) {

	// Have the actual adapter class here..
	//console.log(this.constructor.adapters[this.adapter);

	// this.constructor.super_.prototype.put.call
	console.log("GOT HERE");
	return this.constructor.super_.prototype.put.call( 
		this, doc, docId, docRev, options, callback);
});

exports.quorumStatus = utils.toPromise(function (callback) {
	callback(null, {"foo": "bar"});
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
