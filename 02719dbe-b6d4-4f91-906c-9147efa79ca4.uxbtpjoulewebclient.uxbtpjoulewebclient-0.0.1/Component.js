sap.ui.define(["sap/ui/core/UIComponent","sap/ui/Device","uxbtpjoulewebclient/model/models"],function(e,t,n){"use strict";return e.extend("uxbtpjoulewebclient.Component",{metadata:{manifest:"json"},init:function(){var e=this._getRenderer();e.then(function(e){e.addHeaderEndItem({icon:"sap-icon://da",tooltip:"Joule",press:this._opneJoule.bind(this)},true,false)}.bind(this))},_opneJoule:function(e){window.open("https://cnjbs7.axshare.com/?id=yylh9o&p=joule&sc=2&dp=0&fn=0&c=1","popup","width=400,height=600,toolbar=0,location=0,top=600,left=1000")},_getRenderer:function(){var e=this,t=new jQuery.Deferred,n;e._oShellContainer=jQuery.sap.getObject("sap.ushell.Container");if(!e._oShellContainer){t.reject("Illegal state: shell container not available; this component must be executed in a unified shell runtime context.")}else{n=e._oShellContainer.getRenderer();if(n){t.resolve(n)}else{e._onRendererCreated=function(e){n=e.getParameter("renderer");if(n){t.resolve(n)}else{t.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.")}};e._oShellContainer.attachRendererCreatedEvent(e._onRendererCreated)}}return t.promise()}})});
//# sourceMappingURL=Component.js.map