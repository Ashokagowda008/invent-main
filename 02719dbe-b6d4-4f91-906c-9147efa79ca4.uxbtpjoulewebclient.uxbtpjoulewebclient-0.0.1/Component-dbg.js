/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "uxbtpjoulewebclient/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("uxbtpjoulewebclient.Component", {
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

                // This is example code. Please replace with your implementation!
                rendererPromise.then(function (oRenderer) {
                    // this._opneJoule();
                    oRenderer.addHeaderEndItem({
                        icon: "sap-icon://da",
                        tooltip: "Joule",
                        press: this._opneJoule.bind(this)
                    }, true, false);
                }.bind(this));

                // // call the base component's init function
                // UIComponent.prototype.init.apply(this, arguments);

                // // enable routing
                // this.getRouter().initialize();

                // // set the device model
                // this.setModel(models.createDeviceModel(), "device");
            },
		
            _opneJoule: function (oEvent) {
                window.open('https://cnjbs7.axshare.com/?id=yylh9o&p=joule&sc=2&dp=0&fn=0&c=1','popup','width=400,height=600,toolbar=0,location=0,top=600,left=1000' )
                
                // // Add the Web Client to the current web page
                // // Example of a Web Client Bridge setup
                // if(sap.das.webclient && sap.das.webclient.isLoaded()){
                //     sap.das.webclient.show();
                // }
                // else{
                //     window.sapdas = window.sapdas || {};
                //     window.sapdas.webclientBridge = window.sapdas.webclientBridge || {};
                    
                //     window.sapdas.webclientBridge = {
                //         getBotPreferences: () => {
                //             return {
                //                 headerTitle: 'SAP Digital Assistant',
                //                 userInputPlaceholder: 'How can I help you?',
                //             };
                //         }
                //     }
                //     // https://cit.eu10.sapdas.cloud.sap/webclient/standalone/dcom
                //     // https://build-demo.eu10.sapdas.cloud.sap/resources/public/webclient/bootstrap.js
                //     // DAS Tenant properties
                //     var das_props = {
                //         url: 'https://cit.eu10.sapdas.cloud.sap/resources/public/webclient/bootstrap.js',
                //         botname: 'dcom',
                //     };
                    
                //     // Create and add the script
                //     var wc_script = document.createElement('script');
                    
                //     wc_script.setAttribute('src', das_props.url);
                //     wc_script.setAttribute('data-bot-name', das_props.botname);
                //     wc_script.setAttribute('data-expander-type', 'DEFAULT');
                //     wc_script.setAttribute('data-expander-preferences', 'JTdCJTIyYWNjZW50Q29sb3IlMjIlM0ElMjIlMjNFMDVBNDclMjIlMkMlMjJiYWNrZ3JvdW5kQ29sb3IlMjIlM0ElMjIlMjNGRkZGRkYlMjIlMkMlMjJjb21wbGVtZW50YXJ5Q29sb3IlMjIlM0ElMjIlMjNGRkZGRkYlMjIlMkMlMjJvbmJvYXJkaW5nTWVzc2FnZSUyMiUzQSUyMkNvbWUlMjBzcGVhayUyMHRvJTIwbWUhJTIyJTJDJTIyZXhwYW5kZXJUaXRsZSUyMiUzQSUyMiUyMiUyQyUyMmV4cGFuZGVyTG9nbyUyMiUzQSUyMkNVWF9BdmF0YXIuc3ZnJTIyJTJDJTIydGhlbWUlMjIlM0ElMjJzYXBfaG9yaXpvbiUyMiU3RA==');
                    
                //     wc_script.onload = () => {
                //         // Use the Web Client API to do some initialization if needed such as setting a different theme and showing the Web Client
                //         sap.das.webclient.setTheme('sap_horizon')
                //         // sap.das.webclient.show()
                //     }
                //     document.head.appendChild(wc_script);
                // }
            },

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