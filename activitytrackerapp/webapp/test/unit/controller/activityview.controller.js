/*global QUnit*/

sap.ui.define([
	"ns/activitytrackerapp/controller/activityview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("activityview Controller");

	QUnit.test("I should test the activityview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
