/*global QUnit*/

sap.ui.define([
	"bidcomparision/controller/BidComparisionReport.controller"
], function (Controller) {
	"use strict";

	QUnit.module("BidComparisionReport Controller");

	QUnit.test("I should test the BidComparisionReport controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
