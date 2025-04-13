/*global QUnit*/

sap.ui.define([
	"carpoolbooking/controller/booking.controller"
], function (Controller) {
	"use strict";

	QUnit.module("booking Controller");

	QUnit.test("I should test the booking controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
