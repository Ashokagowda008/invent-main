sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "cit/ux/exportplugin/model/models",
    "sap/m/MessageToast",
    "sap/m/Dialog",
	"sap/m/Button"
],
    function (UIComponent, Device, models, MessageToast,Dialog,Button) {
        "use strict";

        return UIComponent.extend("cit.ux.exportplugin.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                var rendererPromise = this._getRenderer();
                // var jQueryScript = document.createElement('script');
                // jQueryScript.setAttribute('src', 'https://html2canvas.hertzen.com/dist/html2canvas.min.js');
                // document.head.appendChild(jQueryScript);
                
                // This is example code. Please replace with your implementation!
                rendererPromise.then(function (oRenderer) {
                    oRenderer.addHeaderEndItem({
                        icon: "sap-icon://action",
                        tooltip: "Export",
                        press: this._useExport.bind(this)
                    }, true, false);
                }.bind(this));
                // rendererPromise.then(function (oRenderer) {
                //     oRenderer.addHeaderEndItem({
                //         icon: "sap-icon://begin",
                //         tooltip: "Export",
                //         press: this._showDialog.bind(this)
                //     }, true, false);
                // }.bind(this));
            },
            // _useExport: function (oEvent) {
            //     // window.addEventListener("load", (event) => {
            //         $(document).ready(function() {
            //             // var bodyHTML = $('body').html();
            //             // // Your code here

            //             // document.body.innerHTML = bodyHTML;
            //             window.print();
            //             // document.body.innerHTML = originalContent;
            //             window.location.reload();
            //         });

            //     //   });

            // },
            // _useExport: function (oEvent) {
            //     var that =this;
            //     // $(document).ready(function() {
            //     //     html2canvas(document.body).then(function(canvas) {
            //     //         that.saveAs(canvas.toDataURL(), 'screenshot.png');
            //     //     });
            //     //   html2canvas(document.body).then(function (canvas) {
                    
            //     //         // // Export the canvas to a data URL
            //     //         // var img = canvas.toDataURL();

            //     //         // // Create a new image element
            //     //         // var image = new Image();

            //     //         // // Set the src of the image to the data URL
            //     //         // image.src = img;

            //     //         // // Append the image to the body
            //     //         // document.body.appendChild(image);
            //     //     });
            //     // });
                
            // },
            _useExport:function() {
                var link = document.createElement('a');
                // if (typeof link.download === 'string') {
                    link.href = "/417da11e-af27-439d-a259-ee20ea03917b.cituxexportplugin.cituxexportplugin/~260224114437+0000~/model/CO2e_Dashboard.pdf";
                    link.download = "CO2e_Dashboard.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                // } else {
                //     window.open(uri);
                // }
            },
            // _showDialog: function () {
            //     // this.DialogFirstRun = true;
              
            //     // new sap.m.Dialog({ id: "dialog", 
            //     // content: new sap.ui.core.HTML( { content: "<html><body><iframe src='https://cnjbs7.axshare.com/?id=yylh9o&p=joule&sc=2&dp=0&fn=0&c=1' id='redirect'></iframe></html>"}), 
            //     // endButton: new sap.m.Button( {text: "Close", id: "close", press: function () { this._close(); } })  });
              
            //     if (!this.oDefaultDialog) {
            //         this.oDefaultDialog = new Dialog({
            //             showHeader :false,
            //             contentWidth: '400',
            //             contentHeight: '600',
            //             content: new sap.ui.core.HTML( { content: "<iframe width='500' height='650' src='https://cnjbs7.axshare.com/?id=yylh9o&p=joule&sc=2&dp=0&fn=0&c=1' frameborder='0' allowfullscreen></iframe>" ,sanitizeContent:false}), 
            //             endButton: new Button({
            //                 text: "Close",
            //                 press: function () {
            //                     this.oDefaultDialog.close();
            //                 }.bind(this)
            //             })
            //         });
    
            //         // to get access to the controller's model
            //         // this.addDependent(this.oDefaultDialog);
            //     }
    
            //     this.oDefaultDialog.open();
            // },

            /**
             * Returns the shell renderer instance in a reliable way,
             * i.e. independent from the initialization time of the plug-in.
             * This means that the current renderer is returned immediately, if it
             * is already created (plug-in is loaded after renderer creation) or it
             * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
             * before the renderer is created).
             *
             *  @returns {object}
             *      a jQuery promise, resolved with the renderer instance, or
             *      rejected with an error message.
             */
            _getRenderer: function () {
                var that = this,
                    oDeferred = new jQuery.Deferred(),
                    oRenderer;

                that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
                if (!that._oShellContainer) {
                    oDeferred.reject(
                        "Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
                } else {
                    oRenderer = that._oShellContainer.getRenderer();
                    if (oRenderer) {
                        oDeferred.resolve(oRenderer);
                    } else {
                        // renderer not initialized yet, listen to rendererCreated event
                        that._onRendererCreated = function (oEvent) {
                            oRenderer = oEvent.getParameter("renderer");
                            if (oRenderer) {
                                oDeferred.resolve(oRenderer);
                            } else {
                                oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
                            }
                        };
                        that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
                    }
                }
                return oDeferred.promise();
            }
        });
    }
);