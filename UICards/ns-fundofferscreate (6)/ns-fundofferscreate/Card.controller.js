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
            var oData = {
                reviewButton: false,
                backButtonVisible: false,
                productVAT: false,
                promotypeText:"RS30 - Supermarket US",
                PurGrpText:"R30 - Retail Standard US",
                productmatSet: [],
                Fund: { FundCategory: "" },
                OfferDetails: {},
                Offer: {
                     promo_type :"RS30",
                     pur_grp_id : "R30",
                     vdr_dl_id: "",
                    offerid: "",
                    ToTerm: [{
                        offerid: "",
                        disc_val :"",
                        trm_tcd: "1",
                        prod_id:"",
                        prod_qty:"",
                        disc_tcd :"01"
                        }]
                }
            };
            var oModel = new JSONModel(),
                oInitialModelState = Object.assign({}, oData);
            oModel.setData(oInitialModelState);
            this.getView().setModel(oModel);
            this.getView().byId("fFundId").setFilterFunction(function(sTerm, oItem) {
				return oItem.getText().match(new RegExp(sTerm, "i")) || oItem.getKey().match(new RegExp(sTerm, "i"));
			});
            // var definitionId = "promoofferworkflow";
            // this.onStartWorkflow();
            var oComponent = this.getOwnerComponent(),
                oParameters = oComponent.card.getCombinedParameters();
              
            // oComponent.card.request({
            //     "url": "{{destinations.wfapi}}/rest/v1/workflow-instances",
            //     "method": "POST",
            //     "parameters": JSON.stringify(contextNew),
                 
            //     "withCredentials": true,
            //     "dataType": "json",
            //     "headers": {
            //         "Content-Type": "application/json"
            //     }
            // }).then(function (aData) {

            //     debugger;
            // });
        },
        onAfterRendering: function () {
            var oComponent = this.getOwnerComponent();
            this.Card = oComponent.card;
            this._oWizard = this.byId("CreateProductWizard");
            var VendurFunds = [];

            this.handleButtonsVisibility();
            if (this.Card.getModel().getData().hasOwnProperty("d")) {
                VendurFunds = this.Card.getModel().getData().d.results;
                // VendurFunds.unshift({ VdrDlId: "(Select)" });
            }
             var oModel = new JSONModel(VendurFunds);
             this.getView().setModel(oModel, "Funds");
             this.getView().byId("fDisountType").fireChange(this.getView().byId("fDisountType"));
             this.getView().byId("promo_type").fireChange(this.getView().byId("promo_type"));
             this.getView().byId("pur_grp_id").fireChange(this.getView().byId("pur_grp_id"));          
          },
        onFundType: function(aValue){
            var value ="";
             if(aValue === "1"){
               value = aValue +" - Off Invoice";
            } else if (aValue === "2"){
                value = aValue +" - Scanback";
            } else if (aValue === "3"){
                value = aValue +" - Billback";
            }else if (aValue === "4"){
                value = aValue +" - Lump Sum";
            }else if (aValue === "5"){
                 value = aValue +" - Fixed Sum" ;
            }
            return value;
        },
        onFundCat: function(aValue){
            var value ="";
            if(aValue){
            if(aValue === "01"){
             value = aValue +" - On Purchase";
            } else if (aValue === "02"){
              value = aValue +" - On Invoice";
            } else {
                value = aValue +" - On Sale";
            }
           }            
          return value;
        },
        handleButtonsVisibility: function () {
            var oModel = this.getView().getModel();
            switch (this._oWizard.getProgress()) {
                case 1:
                    oModel.setProperty("/nextButtonVisible", true);
                    oModel.setProperty("/nextButtonEnabled", false);
                    oModel.setProperty("/backButtonVisible", false);
                    oModel.setProperty("/reviewButtonVisible", false);
                    oModel.setProperty("/finishButtonVisible", false);
                    oModel.setProperty("/ForecastButtonVisible", false);
                    oModel.setProperty("/AssignButtonVisible", false);
                    break;
                case 2:
                    oModel.setProperty("/finishButtonVisible", false);
                    oModel.setProperty("/backButtonVisible", true);
                    oModel.setProperty("/nextButtonVisible", true);
                    oModel.setProperty("/reviewButtonVisible", false);
                    oModel.setProperty("/ForecastButtonVisible", false);
                    oModel.setProperty("/AssignButtonVisible", false);
                    break;
                case 3:
                    oModel.setProperty("/finishButtonVisible", false);
                    oModel.setProperty("/backButtonVisible", true);
                    oModel.setProperty("/nextButtonVisible", true);
                    oModel.setProperty("/reviewButtonVisible", false);
                    oModel.setProperty("/ForecastButtonVisible", false);
                    oModel.setProperty("/AssignButtonVisible", false);
                    break;    
                case 4:
                    oModel.setProperty("/nextButtonVisible", false);
                    oModel.setProperty("/reviewButtonVisible", true);
                    oModel.setProperty("/finishButtonVisible", false);
                    oModel.setProperty("/backButtonVisible", true);
                    oModel.setProperty("/ForecastButtonVisible", true);
                    oModel.setProperty("/AssignButtonVisible", true);
                    break;
                case 5:
                    oModel.setProperty("/nextButtonVisible", false);
                    oModel.setProperty("/reviewButtonVisible", false);
                    oModel.setProperty("/finishButtonVisible", true);
                    oModel.setProperty("/backButtonVisible", true);
                    oModel.setProperty("/ForecastButtonVisible", false);
                    oModel.setProperty("/AssignButtonVisible", false);
                    break;

                default: break;
            }

        },
        onchangePromotype : function(oEvent){
          var selectedText=  oEvent.getSource().getSelectedItem().getText();
          this.getView().getModel().setProperty("/PromotypeText", selectedText);
        },
        onchangePurchaseGrp : function(oEvent){
          var selectedText=  oEvent.getSource().getSelectedItem().getText();
          this.getView().getModel().setProperty("/PurGrpText", selectedText);
        },
        onchangeDiscountType : function(oEvent){
          var selectedText=  oEvent.getSource().getSelectedItem().getText();
          this.getView().getModel().setProperty("/DisountType", selectedText);
        },
        // onchangeFundType : function(oEvent){
        //   var selectedText=  oEvent.getSource().getSelectedItem().getText();
        //   this.getView().getModel().setProperty("/FundTypeText", selectedText);
        // },
        onSelectProduct: function(oEvent){
          var selectedText=  oEvent.getSource().getSelectedItem().getText();
           this.getView().getModel().setProperty("/ProductText", selectedText);
        },
        _handleNavigationToStep: function (iStepNumber) {
            this._pDialog.then(function (oDialog) {
                oDialog.open();
                this._oWizard.goToStep(this._oWizard.getSteps()[iStepNumber], true);
            }.bind(this));
        },
        onDialogNextButton: function () {
            if (this._oWizard.getProgress() === 2) {
                this.onDialogNextButtonsValidation();
            }else if(this._oWizard.getProgress() === 3){
                this.onOfferDetailsValidation();
            } else {
                if (this._oWizard.getProgressStep().getValidated()) {
                    this._oWizard.nextStep();
                }
                this.handleButtonsVisibility();
            }

        },
        onOfferDetailsValidation : function(){
            var MessageModel = [];
            var oModel = this.getView().getModel();
            var modelData = oModel.getData();
            if (!modelData.Offer.ToTerm[0].prod_qty) {
                MessageModel.push("Please enter Quantity/Unit of Measure");
                oModel.setProperty("/QuantityState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/QuantityState", sap.ui.core.ValueState.None);
            }
            if (!modelData.Offer.ToTerm[0].disc_val) {
                MessageModel.push("Please enter Discount");
                oModel.setProperty("/DiscountState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/DiscountState", sap.ui.core.ValueState.None);
            }
             if (MessageModel.length === 0) {
                this._oWizard.validateStep(this.byId("idOfferDetails"));
                if (this._oWizard.getProgressStep().getValidated()) {
                    this._oWizard.nextStep();
                    this.handleButtonsVisibility();
                }
            } else {
                var messages = MessageModel[0];
                MessageModel.forEach(function (value, index, items) {
                    if (index !== 0) {
                        messages = messages + "\n" + value;
                    }
                })
                MessageBox.error(messages);
            }
        },

        onDialogBackButton: function () {
            this._oWizard.previousStep();
            this.handleButtonsVisibility();
            this.getView().getModel().setProperty("/nextButtonEnabled", true);
        },
        onSelectFundId: function (oEvent) {
           var selectedObject = oEvent.getSource().getSelectedItem().getBindingContext("Funds").getObject()
            // var selectedObject = oEvent.getParameter("selectedItem").getBindingContext("Funds").getObject();
            var oModel = this.getView().getModel();
            if (selectedObject.VdrDlId === "(Select)" || selectedObject.VdrDlId === "") {
                oModel.setProperty("/Offer/vdr_dl_id", "");
                oModel.setProperty("/Fund/FundID", "");
                oModel.setProperty("/Fund/VdrDlName", "");
                oModel.setProperty("/Fund/VdrId", "");
                oModel.setProperty("/Fund/SalesOrg", "");
                oModel.setProperty("/Fund/DistrCh", "");
                oModel.setProperty("/Fund/FundCategory", "");
                oModel.setProperty("/Fund/VdrDlTcd", "");
                
                oModel.setProperty("/FundIdValueState", CoreLibrary.ValueState.Error);
                oModel.setProperty("/FundIdValueStateText", "Please select Fund ID");
                oModel.setProperty("/nextButtonEnabled", false);
                oModel.setProperty("/productmatSet", []);
                oModel.setProperty("/Offer/ToTerm/0/prod_id", "");
                oModel.setProperty("/ProductText", "");  
            } else {
                oModel.setProperty("/Offer/vdr_dl_id", selectedObject.VdrDlId);
                oModel.setProperty("/Fund/FundID", selectedObject.VdrDlId);
                oModel.setProperty("/Fund/VendorName", selectedObject.VendorName);
                oModel.setProperty("/Fund/VdrDlName", selectedObject.VdrDlName);
                oModel.setProperty("/Fund/VdrId", selectedObject.VdrId);
                oModel.setProperty("/Fund/SalesOrg", selectedObject.SalesOrg);
                oModel.setProperty("/Fund/DistrCh", selectedObject.DistrCh);
                oModel.setProperty("/Fund/FundCategory", selectedObject.FundCategory);
                oModel.setProperty("/FundIdValueState", sap.ui.core.ValueState.None);
                oModel.setProperty("/FundIdValueStateText", "");
                oModel.setProperty("/Fund/VdrDlTcd", selectedObject.VdrDlTcd);
                oModel.setProperty("/nextButtonEnabled", true);
                oModel.setProperty("/productmatSet", selectedObject.productmatSet.results);
                if(selectedObject.productmatSet.results.length > 0){
                oModel.setProperty("/Offer/ToTerm/0/prod_id", selectedObject.productmatSet.results[0].prod_id);                }
                oModel.setProperty("/ProductText", selectedObject.productmatSet.results[0].product_name);  
            }
        },
        onDialogNextButtonsValidation: function () {
            var MessageModel = [];
            var oModel = this.getView().getModel();
            var modelData = oModel.getData();
            if (!modelData.Offer.ofr_name) {
                MessageModel.push("Please enter Promotional Name");
                oModel.setProperty("/OfferNameState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/OfferNameState", sap.ui.core.ValueState.None);
            }
            if (!modelData.Offer.promo_type) {
                MessageModel.push("Please enter Promotional Type");
                oModel.setProperty("/PromoTypeState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/PromoTypeState", sap.ui.core.ValueState.None);
            }
           
            if (!modelData.Offer.start_date) {
                MessageModel.push("Please select Promotion Start Date");
                oModel.setProperty("/PromoStartState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/PromoStartState", sap.ui.core.ValueState.None);
            }
            if (!modelData.Offer.End_Date) {
                MessageModel.push("Please select Promotion End Date");
                oModel.setProperty("/PromoEndState", sap.ui.core.ValueState.Error);
            } else {
                oModel.setProperty("/PromoEndState", sap.ui.core.ValueState.None);
            }
            if (MessageModel.length === 0) {
                this._oWizard.validateStep(this.byId("CreateOfferSteps"));
                if (this._oWizard.getProgressStep().getValidated()) {
                    this._oWizard.nextStep();
                    this.handleButtonsVisibility();
                }
            } else {
                var messages = MessageModel[0];
                MessageModel.forEach(function (value, index, items) {
                    if (index !== 0) {
                        messages = messages + "\n" + value;
                    }
                })
                MessageBox.error(messages);
            }
        },


        handleWizardSubmit: function () {

            this.onStartWorkflow();
            // this._handleMessageBoxOpen("Are you sure you want to submit your report?", "confirm");
        },
        onStartWorkflow: function () {
            var definitionId = "promoofferworkflow";
            var oModel = this.getView().getModel().getData();
            var context = {
                PurGrpText : oModel.PurGrpText,
                PromotypeText : oModel.PromotypeText,
                ProductText : oModel.ProductText,
                DisountType  : oModel.DisountType,            
                start_date : new Date(oModel.Offer.start_date),
                End_Date : new Date(oModel.Offer.End_Date),
                fundData: oModel.Fund,
                offersData: oModel.Offer,
                Approver: { ApproverId: "ranjith.kumar@sap.com" },
                
            }
            var data = {
                definitionId: definitionId,
                context: context
            };
            // this.SubmitRecord(oModel.Offer);
            this.startWorkflowInstance(data);
        },

        startWorkflowInstance: function (contextdata) {
            var fetchedToken;
            var that = this;
            $.ajax({
                url: "https://solswzgla22.workzone.cfapps.eu10.hana.ondemand.com/dynamic_dest/wfapi/rest/v1/workflow-instances",
                method: "POST",
                error: function (xhr, ajaxOptions, throwError) {
                    MessageToast.show('Error');
                },
                success: function (result) {
                    MessageToast.show("WorkFlow Triggered Successfully");
                },
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                xhrFields: {
                    withCredentials: true
                },
                data: JSON.stringify(contextdata),
                async: false,
                contentType: "application/json"
            });
        },

        _fetchToken: function (Url, contextdata) {
            var fetchedToken;

            jQuery.ajax({
                url: Url + "/rest/v1/xsrf-token",
                method: "GET",
                async: false,
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success(result, xhr, data) {
                    fetchedToken = data.getResponseHeader("X-CSRF-Token");
                    jQuery.ajax({
                        url: Url + "/rest/v1/workflow-instances",
                        method: "POST",
                        async: false,
                        contentType: "application/json",
                        // headers: {
                        //     "X-CSRF-Token":fetchedToken
                        // },
                        data: JSON.stringify(contextdata),
                        success: function (result, xhr, data) {
                            console.log(data);
                        }
                    });
                }
            });
            // return fetchedToken;
        },
        SubmitRecord: function (Offer) {
            var that = this;
            that.Card.resolveDestination("VendorFunds").then(function (sUrl) {
                that.Card.request({
                    "url": sUrl + "/sap/opu/odata/sap/ZVENDOR_PROMOTIONAL_OFR_SRV/offerSet",
                    "dataType": "json",
                    "method": "POST",
                    "parameters": JSON.stringify(Offer),
                    "headers": {
                        "Content-Type": "application/json"
                    }
                }).then(function (oData) {
                    that.Card.showMessage("Submitted", "Success");
                }).catch(function (sErrorMessage) {
                    that.Card.showMessage(" issue", "Error");
                });
            });
        },
        // _getWorkflowRuntimeBaseURL: function () {
        //     var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
        //     var appPath = appId.replaceAll(".", "/");
        //     var appModulePath = jQuery.sap.getModulePath(appPath);
        //     return appModulePath + "/bpmworkflowruntime/v1";
        // },


    });
});