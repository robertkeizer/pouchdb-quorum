'use strict';
//var utils	= require('./pouch-utils');

exports.QuorumAdapter = function () {
	
};

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
