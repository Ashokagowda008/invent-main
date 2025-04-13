sap.ui.define([
	"sap/ui/core/UIComponent",
	'sap/ui/model/json/JSONModel'
], function (UIComponent, JSONModel) {
	"use strict";
	var Component = UIComponent.extend("yokogawaMap.Component", {
		onCardReady: function (oCard) {
			this.oCard = oCard;
		}
		
	});

	return Component;
});
