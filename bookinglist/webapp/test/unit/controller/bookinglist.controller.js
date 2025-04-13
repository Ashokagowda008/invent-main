/*global QUnit*/

sap.ui.define([
	"bookinglist/controller/bookinglist.controller"
], function (Controller) {
	"use strict";

	QUnit.module("bookinglist Controller");

	QUnit.test("I should test the bookinglist controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
