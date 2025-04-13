sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */

    function (Controller, JSONModel) {
        "use strict";

        return Controller.extend("bidcomparision.controller.EventSummary", {
            onInit: function () {
                this._oView = this.getView();
                this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));

                var oModel = new JSONModel();
                this.getView().setModel(oModel, "summaryModel");

                var tModel = new JSONModel();
                this.getView().setModel(tModel, "tableModel");

                var url = this._getRuntimeBaseURL() + "/ariba_token/v2/oauth/token?grant_type=openapi_2lo";
                this.accessToken = "";
                var that = this;

                $.ajax({
                    url: url,
                    method: "POST",
                    contentType: "application/json",
                    async: true,
                    success: function (odata, jQXHR, status) {
                        // console.log(odata);
                        that.accessToken = odata.access_token;

                        var pendingApprovablesUrl = that._getRuntimeBaseURL() + "/ariba_report/api/sourcing-approval/v2/prod/pendingApprovables?realm=cumulus8-T&documentType=RFXDocument";
                        that.getPendingApprovals(pendingApprovablesUrl, odata.access_token, "pendingApprovables");

                    },
                    error: function (error, jQXHR) {
                        console.log(error);
                    }
                });

            },

            onAfterRendering: function (oEvent) {
                var localModel = this._oComponent.getModel("localModel");
                this.getView().setModel(localModel, "localModel");
                // console.log(localModel.getData());
            },

            _getRuntimeBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);

                return appModulePath;
            },

            getPendingApprovals: function (url, accessToken, modelName) {
                var that = this;
                $.ajax({
                    url: url,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        // console.log(odata);
                        that.getView().getModel("summaryModel").setProperty("/" + modelName, odata);

                        // for now we are using hardcoded task id.
                        var taskId = "TSK242019025";
                        var taskDetailsUrl = that._getRuntimeBaseURL() + "/ariba_report/api/sourcing-approval/v2/prod/Task/" + taskId + "?realm=cumulus8-T";
                        // that.getTaskDetails(taskDetailsUrl, accessToken, "taskDetails");
                        var g = that;
                        $.ajax({
                            url: taskDetailsUrl,
                            method: "GET",
                            contentType: "application/json",
                            async: true,
                            headers: {
                                "Authorization": "Bearer " + accessToken,
                                "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                            },
                            success: function (odata, status) {
                                // console.log(odata);
                                g.getView().getModel("summaryModel").setProperty("/taskDetails", odata);

                                // for demo we are using hardcoded eventId
                                var eventId = "Doc259020677";

                                var itemsUrl = g._getRuntimeBaseURL() + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/" + eventId + "?realm=cumulus8-T&$select=items";
                                g.getLineItems(itemsUrl, accessToken, "items");

                                var itemResponseUrl = g._getRuntimeBaseURL() + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/" + eventId + "?realm=cumulus8-T&$select=itemResponses";
                                g.getLineItems(itemResponseUrl, accessToken, "itemResponse");

                                var invitedSuppUrl = g._getRuntimeBaseURL() + "/ariba_report/api/sourcing-approval/v2/prod/RFXDocument/" + eventId + "?realm=cumulus8-T&$select=invitedSuppliers";
                                g.getLineItems(invitedSuppUrl, accessToken, "invitedSuppliers");

                            },
                            error: function (error) {
                                console.log(error);
                            }
                        });
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            },

            getLineItems: function (url, accessToken, modelName) {
                var that = this;
                $.ajax({
                    url: url,
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    headers: {
                        "Authorization": "Bearer " + accessToken,
                        "apikey": "RUrl2VgdqmTHaOKf9y9xuaxQ2RcDzRsk"
                    },
                    success: function (odata, status) {
                        // console.log(odata);
                        that.getView().getModel("summaryModel").setProperty("/" + modelName, odata);
                        console.log(that.getView().getModel("summaryModel"));
                        // if(last && last === true) {
                        that.BindData();
                        // }
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            },

            BindData: function () {
                var summaryModel = this.getView().getModel("summaryModel");
                var itemData = summaryModel.getProperty("/items");
                var itemResponseData = summaryModel.getProperty("/itemResponse");
                var invitedSuppliersData = summaryModel.getProperty("/invitedSuppliers");
                var lineItems = itemData.items.filter(function (a) { return a.itemType == "Line Item"; });

                //number format
                function numberFormat(value) {
                    const options = {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    };
                    return "$" + Number(value).toLocaleString('en', options);
                }

                var itemId = [];
                var lotData = [];
                var _currency = "USD";
                var _noOfSuppliers = 0;
                var _totalLots = 0;

                for (var i = 0; i < lineItems.length; i++) {
                    itemId.push(lineItems[i].itemId);
                    var suppliers = itemResponseData.itemResponses.filter(function (b) { return b.item.itemId == lineItems[i].itemId });
                    _noOfSuppliers = suppliers.length;

                    var allExtendedPrice = [];
                    var allSavings = [];
                    for (var j = 0; j < suppliers.length; j++) {
                        var suppTerms = suppliers[j].item.terms;
                        allExtendedPrice.push(parseFloat(suppTerms[2].value.amount));
                        allSavings.push(parseFloat(suppTerms[3].value.amount));
                    }

                    Array.min = function (array) {
                        return Math.min.apply(Math, array);
                    };

                    var leadExtendedPrice = Array.min(allExtendedPrice);
                    var leadSavings = Array.min(allSavings);

                    var data = {};
                    data.Id = lineItems[i].displayNumber;
                    data.Name = lineItems[i].title;
                    var historic = lineItems[i].terms[2].value.amount + lineItems[i].terms[3].value.amount;
                    data._historic = historic;
                    data.Historic = numberFormat(historic) + " " + lineItems[i].terms[2].value.currency + " Fx";
                    data._initial = lineItems[i].terms[2].value.amount;
                    data.Initial = numberFormat(lineItems[i].terms[2].value.amount) + " " + lineItems[i].terms[2].value.currency + " Fx";
                    data._leading = leadExtendedPrice;
                    data.Leading = numberFormat(leadExtendedPrice) + " " + lineItems[i].terms[2].value.currency + " Fx";
                    _currency = lineItems[i].terms[2].value.currency;
                    lotData.push(data);
                }
                this.getView().getModel("tableModel").setProperty("/LotDetails", lotData);
                var totalHistoric = 0;
                var totalInitial = 0;
                var totalLeading = 0;
                _totalLots = lotData.length;
                for (var k = 0; k < lotData.length; k++) {
                    totalHistoric = totalHistoric + lotData[k]._historic;
                    totalInitial = totalInitial + lotData[k]._initial;
                    totalLeading = totalLeading + lotData[k]._leading;
                }
                var leadingVsHistoric = totalHistoric - totalLeading;
                var leadVsHistPerc = Math.round((leadingVsHistoric * 100) / totalHistoric);

                var leadingVsInitial = totalInitial - totalLeading;
                var leadVsInitPerc = Math.round((leadingVsInitial * 100) / totalInitial);

                var financials = this.getView().getModel("localModel").getProperty("/Financials");
                for (var l = 0; l < financials.length; l++) {
                    if (financials[l].Name === "Historic:") { 
                        financials[l].Value = numberFormat(totalHistoric) + " " + _currency; 
                    } else if(financials[l].Name === "Initial:") { 
                        financials[l].Value = numberFormat(totalInitial) + " " + _currency; 
                    } else if(financials[l].Name === "Leading vs. Historic:") { 
                        financials[l].Value = numberFormat(leadingVsHistoric) + " " + _currency + "(" + leadVsHistPerc + "%)"; 
                    } else if(financials[l].Name === "Leading vs. Initial:") { 
                        financials[l].Value = numberFormat(leadingVsInitial) + " " + _currency + "(" + leadVsInitPerc + "%)"; 
                    } else if(financials[l].Name === "Leading:") {
                        financials[l].Value = numberFormat(totalLeading) + " " + _currency; 
                    } else if(financials[l].Name === "Savings:") {
                        financials[l].Value = numberFormat(leadingVsHistoric) + " " + _currency + "(" + leadVsHistPerc + "%)"; 
                    }
                }
                this.getView().getModel("localModel").setProperty("/Financials", financials);

                var InvitationSummary = this.getView().getModel("localModel").getProperty("/InvitationSummary");
                for (var l = 0; l < InvitationSummary.length; l++) {
                    if (InvitationSummary[l].Name === "Number Invited:") { 
                        InvitationSummary[l].Value = _noOfSuppliers; 
                    } else if(InvitationSummary[l].Name === "Number Accepted:") { 
                        InvitationSummary[l].Value = _noOfSuppliers; 
                    } else if(InvitationSummary[l].Name === "Number of Bidders/Respondents:") { 
                        InvitationSummary[l].Value = _noOfSuppliers; 
                    }
                }
                this.getView().getModel("localModel").setProperty("/InvitationSummary", InvitationSummary);

                var ProjectSummary = this.getView().getModel("localModel").getProperty("/ProjectSummary");
                for (var l = 0; l < ProjectSummary.length; l++) {
                    if (ProjectSummary[l].Name === "Total Lots:") { 
                        ProjectSummary[l].Value = _totalLots; 
                    } else if(ProjectSummary[l].Name === "Total Lots with Bids:") { 
                        ProjectSummary[l].Value = _totalLots; 
                    }
                }
                this.getView().getModel("localModel").setProperty("/ProjectSummary", ProjectSummary);

            }


        });
    });
