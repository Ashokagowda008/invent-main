/*global QUnit*/

sap.ui.define([
	"successorlist/controller/successorview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("successorview Controller");

	QUnit.test("I should test the successorview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
