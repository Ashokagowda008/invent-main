/*global QUnit*/

sap.ui.define([
	"chatuimodule/controller/chatview.controller"
], function (Controller) {
	"use strict";

	QUnit.module("chatview Controller");

	QUnit.test("I should test the chatview controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
