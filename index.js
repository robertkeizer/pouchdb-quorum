'use strict';

var utils = require('./pouch-utils');

exports.configureQuorum = utils.toPromise(function (callback) {
	callback(null);
});

exports.quorumStatus = utils.toPromise(function (callback) {
	callback(null);
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
