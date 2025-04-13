sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/ui/model/type/DateTime",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, TypeDateTime, Filter, Fragment, FilterOperator) {
    "use strict";

    return BaseController.extend("purchasinginfo.controller.Worklist", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            var oViewModel;

            // keeps the search state
            this._aTableSearchState = [];
            const appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            const appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            // this.appModulePath = "";
            // Model used to manipulate control states
            oViewModel = new JSONModel({
                worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                count: $.ajax({ type: "GET", url: this.appModulePath + "/purchasinginfoservice/PurchasingInfoSrv/$count", async: false }).responseText
            });
            this.setModel(oViewModel, "worklistView");

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
            // update the worklist's object counter after the table update
            var sTitle,
                oTable = oEvent.getSource(),
                iTotalItems = oEvent.getParameter("total");
            // only update the counter if the length is final and
            // the table is not empty
            if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
            } else {
                sTitle = this.getResourceBundle().getText("worklistTableTitle");
            }
            this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
        },

        /**
         * Event handler when a table item gets pressed
         * @param {sap.ui.base.Event} oEvent the table selectionChange event
         * @public
         */
        onPress: function (oEvent) {
            // The source is the list item that got pressed
            this._showObject(oEvent.getSource());
        },

        /**
         * Event handler for navigating back.
         * Navigate back in the browser history
         * @public
         */
        onNavBack: function () {
            // eslint-disable-next-line fiori-custom/sap-no-history-manipulation
            history.go(-1);
        },
        openQuickView: function (oEvent, matDetails) {
            var oButton = oEvent.getSource(),
                oView = this.getView();

            if (!this._pQuickView) {
                this._pQuickView = Fragment.load({
                    id: oView.getId(),
                    name: "purchasinginfo.view.QuickView",
                    controller: this
                }).then(function (oQuickView) {
                    oView.addDependent(oQuickView);
                    return oQuickView;
                });
            }
            this._pQuickView.then(function (oQuickView) {
                var QVmodel = new JSONModel(matDetails)
                oQuickView.setModel(QVmodel);
                oQuickView.openBy(oButton);
            });
        },
        handleGenericQuickViewPress: function (oEvent) {
            let Obj = oEvent.getSource().getBindingContext().getObject();
            var oGenericModel = new JSONModel(Obj)
            this.getView().setModel(oGenericModel, "QVModel");
            let matDetails = { matDetails: [] }
            matDetails.matDetails.push(Obj)
            this.openQuickView(oEvent, matDetails);
        },

        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {

                this.onRefresh();
            } else {
                var aTableSearchState = [];
                var sQuery = oEvent.getParameter("query");

                if (sQuery && sQuery.length > 0) {
                    aTableSearchState = [new Filter("PurchasingInfoRecord", FilterOperator.Contains, sQuery)];
                }
                this._applySearch(aTableSearchState);
            }

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            var oTable = this.byId("table");
            oTable.getBinding("items").refresh();
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Shows the selected item on the object page
         * @param {sap.m.ObjectListItem} oItem selected Item
         * @private
         */
        _showObject: function (oItem) {
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getPath().substring("/PurchasingInfoSrv".length)
            });
        },

        /**
         * Internal helper method to apply both filter and search state together on the list binding
         * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
         * @private
         */
        _applySearch: function (aTableSearchState) {
            var oTable = this.byId("table"),
                oViewModel = this.getModel("worklistView");
            oTable.getBinding("items").filter(aTableSearchState, "Application");
            // changes the noDataText of the list in case there are no filter results
            if (aTableSearchState.length !== 0) {
                oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
            }
        },
        onRefreshForLLM: function (oEvent) {
            var selectedObj = oEvent.getSource().getBindingContext().getObject();
            var that = this;
            $.ajax({
                type: "GET",
                url: this.appModulePath + "/purchasinginfoservice/RefreshLllm(PurchInfo='" + selectedObj.PurchasingInfoRecord + "')",
                async: false,
                success: function (result) {
                    that.onRefresh();
                },
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                }
            })
        },
        refreshVisible: function (Value) {
            let vValue = false;
            console.log(Value)
            if (Value) {
                vValue = true;
            }
            return vValue;
        },
        covertDateFormat: function (Value) {
            let date = new Date(Value);
            var year = date.getUTCFullYear();
            var month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
            var day = date.getUTCDate().toString().padStart(2, '0');
            var hours = date.getUTCHours().toString().padStart(2, '0');
            var minutes = date.getUTCMinutes().toString().padStart(2, '0');
            var seconds = date.getUTCSeconds().toString().padStart(2, '0');
            return day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
        },
        onClickLogs: function () {
            this.getOwnerComponent().getRouter().navTo("logs");
        }

    });
});
