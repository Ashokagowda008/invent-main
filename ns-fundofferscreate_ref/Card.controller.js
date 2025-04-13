sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/library",
    "sap/m/MessageBox"
], function (MessageToast, Controller, JSONModel, CoreLibrary, MessageBox) {
    "use strict";
    return Controller.extend("ns.fundofferscreate.Card", {
        onInit: function () {
           
           
        },
        onAfterRendering: function () {
            var oComponent = this.getOwnerComponent();
            this.Card = oComponent.card;
            var oModel = new JSONModel()
            oModel.setData(this.Card.getCombinedParameters().Items);
            this.getView().setModel(oModel);
                  
          }
     

    });
});