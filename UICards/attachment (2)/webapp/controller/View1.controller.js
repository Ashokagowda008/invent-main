sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/util/File"
], function (Controller, File) {
    "use strict";

    return Controller.extend("attachment.controller.View1", {
        onInit: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
        },
        onUpload1: function () {
            const UploadData = [{
                "timestamp": "2023-11-04T11:38:37Z",
                "sensor_id": "123",
                "reading": 12.2
            }, {
                "timestamp": "2023-11-05T11:38:37Z",
                "sensor_id": "123",
                "reading": 12.2
            }, {
                "timestamp": "2023-11-06T11:38:37Z",
                "sensor_id": "123",
                "reading": 12.2
            }]
            const sUrl = this.appModulePath + "/Sustainability/uploadData";
            $.ajax({
                url: sUrl,
                method: "POST",
                async: false,
                data: JSON.stringify({ uploadData: UploadData }),
                headers: {
                    'Accept': 'application/json',
                    "Content-Type": "application/json"
                },
                success: function (result, xhr, data) {
                    console.log(results.value);
                }
            });
        },
        onTypeMismatch: function (oEvent) {
            var sSupportedFileTypes = oEvent
                .getSource()
                .getFileType()
                .map(function (sFileType) {
                    return "*." + sFileType;
                })
                .join(", ");

            showError(
                "The file type *." +
                oEvent.getParameter("fileType") +
                " is not supported. Choose one of the following types: " +
                sSupportedFileTypes
            );
        },
        onUploadComplete: function (oEvent) {
            var iStatus = oEvent.getParameter("status");
            var oFileUploader = oEvent.getSource()

            oFileUploader.clear();
            if (iStatus >= 400) {
                var oRawResponse;
                try {
                    oRawResponse = JSON.parse(oEvent.getParameter("responseRaw"));
                } catch (e) {
                    oRawResponse = oEvent.getParameter("responseRaw");
                }
                if (oRawResponse && oRawResponse.error && oRawResponse.error.message) {
                    showError(oRawResponse.error.code, oRawResponse.error.target, oRawResponse && oRawResponse.error && oRawResponse.error.message);
                }
            } else {
                MessageToast.show("File uploaded successfully");
                oExtensionAPI.refresh()
                closeDialog();
            }
        },
        onReadFile: function () {
            let orderNo = '4006961';
            var sServiceUrl = this.appModulePath + "/sap/opu/odata/sap/ZINV_MAINT_ORDER_SRV";
            var sUrl = "/GetEquipDocSet('4006961')/$value"; 

            var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
            oModel.read(sUrl, {
                success: function (oData, oResponse) {
                  
                    var blob = new Blob([oResponse.body], {type: 'application/octet-stream'});
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        // for IE
                        window.navigator.msSaveOrOpenBlob(blob);
                    } else {
                        // for Non-IE 
                        var objectUrl = URL.createObjectURL(blob);
                        var a = $("<a>")
                            .attr("href", objectUrl)
                            .attr("download", orderNo+".vds") // replace with your filename
                            .appendTo("body");
                        a[0].click();
                        a.remove();
                        URL.revokeObjectURL(objectUrl);
                    }
                },
                error: function (oError) {
                    // handle error
                    sap.m.MessageToast.show("Error while downloading PDF");
                }
            });


            // $.ajax({
            //     url: this.appModulePath + "/sap/opu/odata/sap/ZINV_MAINT_ORDER_SRV/GetEquipDocSet(OrderNo='4006961')",
            //     method: "GET",
            //     async: false,
            //     success: function (oData, oResponse) {
            //         var aData = oData;
            //         that.downloadPdf(aData);
            //     },
            //     error: function (oError) {
            //         console.error("Error fetching PDF data", oError);
            //     }
            // });
        },
        downloadPdf: function (aData) {
            // var sPdfData = atob(sBase64);
            // var aBytes = new Uint8Array(sPdfData.length);
            // for (var i = 0; i < sPdfData.length; i++) {
            //     aBytes[i] = sPdfData.charCodeAt(i);
            // }
            // var blob = new Blob([aBytes], { type: "application/pdf" });
            // var link = document.createElement('a');
            // link.href = window.URL.createObjectURL(blob);
            // link.download = "filename.pdf";
            // link.click();
            // direct
            // var oByteArray = atob(aData.b64);
            // var u8Array = new Uint8Array(oByteArray.length);
            // for (var i = 0; i < oByteArray.length; i++) {
            //     u8Array[i] = oByteArray.charCodeAt(i);
            // }
            // var oBlob = new Blob([aData.direct], { type: 'application/pdf' });
            // var sUrl = window.URL.createObjectURL(oBlob);

            // var oLink = document.createElement('a');
            // oLink.href = sUrl;
            // oLink.download = "download.pdf";  // replace with your file name
            // document.body.appendChild(oLink);
            // oLink.click();
            // document.body.removeChild(oLink);

            // var sUrl = URL.createObjectURL(new Blob([aData.direct], { type: "application/pdf" }));
            // var link = document.createElement('a');
            // link.href = sUrl;
            // link.download = "MyFile.pdf";
            // link.click();

            // Output as Data URI

        },
        onUpload: function () {
            // var oFileUploader = this.byId("fileUploader");
            // if (!oFileUploader.getValue()) {
            //     MessageToast.show("Choose a file first");
            //     return;
            // }
            // oFileUploader.checkFileReadable().then(function() {
            //     oFileUploader.upload();
            // }, function(error) {
            //     MessageToast.show("The file cannot be read. It may have changed.");
            // }).then(function() {
            //     oFileUploader.clear();
            // });
            var oFileUploader = this.byId("uploader");
            var headPar = new sap.ui.unified.FileUploaderParameter();
            // headPar.setName('slug');
            // headPar.setValue("ExcelUpload");
            // oFileUploader.removeHeaderParameter('slug');
            // oFileUploader.addHeaderParameter(headPar);
            var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
            var sUploadUri = docuServiceBaseUrl + "/Sustainability/ExcelUpload/excel";
            oFileUploader.setUploadUrl(sUploadUri);
            oFileUploader.checkFileReadable()
                .then(function () {
                    oFileUploader.upload();
                })
                .catch(function (error) {
                    showError("The file cannot be read.");

                })
        },
        handleValueChange1: function () {
            var oFileUploader = this.byId("uploader");
            var headPar = new sap.ui.unified.FileUploaderParameter();
            headPar.setName('slug');
            headPar.setValue("ExcelUpload");
            oFileUploader.removeHeaderParameter('slug');
            oFileUploader.addHeaderParameter(headPar);
            var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
            var sUploadUri = docuServiceBaseUrl + "/Sustainability/ExcelUpload/excel";
            oFileUploader.setUploadUrl(sUploadUri);
            oFileUploader.checkFileReadable()
                .then(function () {
                    oFileUploader.upload();
                })
                .catch(function (error) {
                    showError("The file cannot be read.");

                })
        },
        _getDocServiceRuntimeBaseURL: function () {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            var appModulePath = jQuery.sap.getModulePath(appPath);
            return appModulePath;
        },

        // onFileChange: function (oEvent) {
        //     var file = oEvent.getParameters("files").files[0];
        //     this.file = file;
        // },
        onFileChange: function (oEvent) {
            var oUploadSet = this.byId("__fileUploader");
            var domRef = oUploadSet.getFocusDomRef();
            var file = oEvent.getParameter('files')[0];
            var filetype = file.name.split(".")[1];
            // Create a File Reader object
            var reader = new FileReader();
            var t = this;
            var data = [];
            reader.onload = async function (ev) {
                // get an access to the content of the file
                var Data = [];
                // var workbook = XLSX.read(ev.currentTarget.result, {
                //     type: 'binary'
                // });
                // workbook.SheetNames.forEach(function (sheetName) {
                //     data = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                // });
                this.content = ev.currentTarget.result.split(',')[1];
                this.createfile(filetype, this.content);
            }.bind(this);
            reader.readAsDataURL(file);
            //    reader.readAsBinaryString(file);
        },
        createfile: function (filetype, base64) {
            var that = this;
            var docuServiceBaseUrl = this._getDocServiceRuntimeBaseURL();
            $.ajax({
                url: docuServiceBaseUrl + "/Sustainability/uploadExcel",
                method: "POST",
                async: false,
                timeout: 300000,
                data: JSON.stringify({ ExcelFile: base64, fileType: filetype }),
                headers: {
                    "Content-Type": "application/json"
                },
                success: function (result, xhr, data) {
                    console.log(result);
                }
            });
        },

    });
});
// var oFileUploader = byId("uploader");
// var headPar = new sap.ui.unified.FileUploaderParameter();
// headPar.setName('slug');
// headPar.setValue(Entity);
// oFileUploader.removeHeaderParameter('slug');
// oFileUploader.addHeaderParameter(headPar);
// var sUploadUri = oExtensionAPI._controller.extensionAPI._controller._oAppComponent.getManifestObject().resolveUri(“./StudentsSrv/ExcelUpload/excel")
// oFileUploader.setUploadUrl(sUploadUri);
// oFileUploader
//     .checkFileReadable()
//     .then(function () {
//         oFileUploader.upload();
//     })
//     .catch(function (error) {
//         showError("The file cannot be read.");
//         setDialogBusy(false)
//     })

