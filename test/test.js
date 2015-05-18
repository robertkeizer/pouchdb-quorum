/*jshint expr:true */
'use strict';

var Pouch = require('pouchdb');

//
// Include pouchdb-quorum
//
var quorumPlugin = require('../');
Pouch.plugin(quorumPlugin);

var chai = require('chai');
chai.use(require("chai-as-promised"));

//
// more variables you might want
//
chai.should(); // var should = chai.should();
require('bluebird'); // var Promise = require('bluebird');

var assert = require("assert");

/*
var dbs;
if (process.browser) {
  dbs = 'testdb' + Math.random() +
    ',http://localhost:5984/testdb' + Math.round(Math.random() * 100000);
} else {
  dbs = process.env.TEST_DB;
}

dbs.split(',').forEach(function (db) {
  var dbType = /^http/.test(db) ? 'http' : 'local';
  tests(db, dbType);
});
*/

var quorum = require("../");

describe("QuorumPouch", function () {
	it("Exists", function () {
		assert.ok(quorum.QuorumPouch);
	});

	it("Errors if no options are specified", function (callback) {
		new quorum.QuorumPouch(function (error) {
			if (!error) {
				return callback(new Error("No error was returned."));
			}
			callback(null);
		});
	});

	it("Errors if no backends are specified", function (callback) {
		new quorum.QuorumPouch({}, function (error) {
			if (!error) {
				return callback(new Error("No error was returned."));
			}
			callback(null);
		});
	});

	it("Errors if backends is not an array", function (callback) {
		new quorum.QuorumPouch({ backends: "foo" }, function (error) {
			if (!error) {
				return callback(new Error("No error was specified."));
			}
			callback(null);
		});
	});

	it("Errors if backends array is empty.", function (callback) {
		new quorum.QuorumPouch({ backends: [ ] }, function (error) {
			if (!error) {
				return callback(new Error("No error was specified."));
			}
			callback(null);
		});
	});

	it("Errors if backends array object is invalid", function (callback) {
		new quorum.QuorumPouch({ backends: [ { "foo": "bar" } ]}, function (error) {
			if (!error) {
				return callback(new Error("No error was specified."));
			}
			callback(null);
		});
	});
});
