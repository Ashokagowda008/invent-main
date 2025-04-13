/**
 * This module was created by the BASEditor
 */
sap.ui.define(["sap/ui/integration/Designtime"], function (
    Designtime
) {
    "use strict";
    return function () {
        return new Designtime({
			"form": {
				"items": {
					"groupheader1": {
						"label": "General Settings",
						"type": "group"
					},
                    "Items": {
						"label": "Items",
					    "manifestpath": "/sap.card/configuration/parameters/Items/value",
						"type": "string",
						"cols": 1,
						"allowDynamicValues": true
					}
                	}
			},
			"preview": {
				"modes": "None"
			}
		});
	};
});
