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
            }
        });

        return Component;

    });
