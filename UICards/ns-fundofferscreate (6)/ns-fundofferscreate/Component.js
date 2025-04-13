sap.ui.define(['sap/ui/core/UIComponent','sap/ui/model/json/JSONModel'],
    function (UIComponent,JSONModel) {
        "use strict";

        var Component = UIComponent.extend("ns.fundofferscreate.Component", {

            metadata: {
                manifest: "json"
            },
            onCardReady: function (oCard) {
                // Holds the card for use inside the controller
                this.card = oCard;
                oCard.getManifestEntry("/sap.card");
                // oCard.resolveDestination("VendorFunds").then(function (sUrl) {
                //     oCard.request({
                //         "url": sUrl+"/sap/opu/odata/sap/ZVENDOR_FUND_MAIN_SRV/vendorfundSet"
                //     }).then(function (oData) {
                //        var oModel = new JSONModel(oData.value);
				//        this.setModel(oModel, "VendorFunds");
                //     }.bind(this)).catch(function (oErr) {
                //         return oErr;
                //     }.bind(this));
                // }.bind(this));
               
            }
        });

        return Component;

    });
