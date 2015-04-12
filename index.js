'use strict';

var utils = require('./pouch-utils');

exports.quorumStatus = utils.toPromise(function (callback) {
	callback(null, null);
});

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
