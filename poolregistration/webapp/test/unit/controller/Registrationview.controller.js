/*global QUnit*/

sap.ui.define([
	"poolregistration/controller/Registrationview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Registrationview Controller");

	QUnit.test("I should test the Registrationview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
