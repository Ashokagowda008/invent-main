const cds = require('@sap/cds')
const { PurchasingInfo } = cds.entities;
const LOG = cds.log('purchasinginfo-service');
const axios = require('axios');
const { purchinfo_log, getLogs } = require('./code/purchasinginfo-log');  // To log all the activities in application
const { Console, log } = require('console');
require("dotenv").config();
let tx = cds.transaction();


module.exports = cds.service.impl(async function () {

    const { PurchasingInfoSrv } = this.entities
    const bupa = await cds.connect.to('API_INFORECORD_PROCESS_SRV');
    const posrv = await cds.connect.to('API_PURCHASEORDER_PROCESS_SRV');

    this.on('READ', 'A_PurchasingInfoStdRecords', async req => {
        return bupa.run(req.query);
    });

    bupa.on('Created', async (msg) => {
        const { PurchasingInfoRecord } = msg.data;
        /*log*/
        await purchinfo_log({ type: "Info", message: "Create event triggered for the Purchasing info record '" + PurchasingInfoRecord + "'" });
        let PurchasingInfo = await getPurchasingInfo(PurchasingInfoRecord);
        if (PurchasingInfo) {
            LOG.info("Creating purchasing info entry in hana-cloud for '" + PurchasingInfoRecord + "'");
            await createEventsData(PurchasingInfo, "Create");
        } else {
            LOG.error("Error Creating purchasing info entry in hana-cloud for '" + PurchasingInfoRecord + "'");
        }
    });
    posrv.on('Created', async (msg) => {
        const { PurchaseOrder } = msg.data;
        /*log*/
        // await purchinfo_log({ type: "Info", message: "Create Event triggered for the Purchasing Order record '" + PurchaseOrder + "'" });
        LOG.info("Create Event triggered for the Purchasing Order record '" + PurchaseOrder + "'");
        updateScreeningId(PurchaseOrder);

    });

    bupa.on('Changed', async (msg) => {
        try {
            const { PurchasingInfoRecord } = msg.data;
            /*log*/
            await purchinfo_log({ type: "Info", message: "Delete event triggered for the Purchasing info record '" + PurchasingInfoRecord + "'" });
            LOG.info("Delete :" + PurchasingInfoRecord)
            let PurchasingInfo = await checkPurchInfoExist(PurchasingInfoRecord);
            if (PurchasingInfo["IsDeleted"]) {
                LOG.info("'" + PurchasingInfoRecord + "'Record deleted in S4, Deleting entry in hana-cloud");
                removePurchaseInfoDatafromHana(PurchasingInfoRecord);
            }
        } catch (err) {
            LOG.error("Error Deleting purchasing info entry in hana-cloud for '" + PurchasingInfoRecord + "'");
            LOG.error("Delete err info:" + err)
        }
    });
    async function checkPurchInfoExist(PurchasingInfoRecord) {
        const matdescapi = await cds.connect.to("matdescapi");
        /*log*/
        await purchinfo_log({ type: "Info", message: "Checking Purchasing info record '" + PurchasingInfoRecord + "' available in S4" })
        let PurchasingInfo = await matdescapi.send('GET', "/sap/opu/odata/sap/API_INFORECORD_PROCESS_SRV/A_PurchasingInfoRecord('" + PurchasingInfoRecord + "')?$select=IsDeleted");
        return PurchasingInfo;
    }

    async function createEventsData(PurchasingInfo, RequestType) {
        const restApiToken = await cds.connect.to("ai4sauth");
        const restApi = await cds.connect.to("ai4s");

        await restApiToken.send('GET', "/?grant_type=client_credentials").then(async (response) => {
            let accesstoken = response.access_token;
            const enrichData = JSON.stringify({
                "Material ID": PurchasingInfo.Material,
                "Material Text": PurchasingInfo.ProductDescription,
                "Category": PurchasingInfo.ProductCategory,
                "EAN": PurchasingInfo.ProductStandardID,
                "Manufacturer": PurchasingInfo.Manufacturer,
                "Supplier Text": PurchasingInfo.SupplierName
            })
            LOG.info("accesstoken :" + accesstoken);
            LOG.info("Bing Key :" + process.env.BingKey);
            LOG.info("enrichData :" + enrichData);
            let LLMFail = false;
            if (PurchasingInfo.ProductDescription && PurchasingInfo.Material && PurchasingInfo.ProductStandardID) {
                /*log*/
                await purchinfo_log({ type: "Info", message: "LLM service triggered to fetch the Taxonomy information for the Material '" + PurchasingInfo.Material + "'" });
                let payload = PurchasingInfo;
                let createdDate = dateISOConverter(new Date());
                // let code = "";
                var postData = "";
                try {
                    postData = await restApi.send('POST', '/enrich-material?show_all_new_properties=true', enrichData, { 'Bing-Key': process.env.BingKey, "Content-Type": "application/Json", "Authorization": "bearer " + accesstoken });
                } catch (llmerr) {
                    LLMFail = true
                    LOG.error("LLM service err:" + llmerr);
                    /*log*/
                    await purchinfo_log({ type: "Error", message: "Technical error in LLM service while fetching Taxonomy details for the Material '" + PurchasingInfo.Material + "'" });
                }
                payload.CreationDate = createdDate
                if (postData) {
                    /*log*/
                    await purchinfo_log({ type: "Success", message: "Taxonomy flag fetched from LLM service for the Material '" + PurchasingInfo.Material + "'" });
                    console.log(postData)
                    payload.TaxononomyFlag = postData['EU-Tax Aligned'];
                    payload.EnergyEffClass = postData['EEC'];
                    payload.LLMFail = false
                    // code = "Y";
                } else {
                    LOG.error("Error while getting enrich details.");
                    payload.TaxononomyFlag = "";
                    payload.EnergyEffClass = "";
                    payload.LLMFail = true
                    // code = "N";
                }
                if (RequestType === "Create") {
                    try {
                        await INSERT.into('PurchasingInfoService.PurchasingInfoSrv').entries(payload);
                        /*log*/
                        await purchinfo_log({ type: "Success", message: "Entry created in Hana Cloud for the Purchasing info record '" + PurchasingInfo.PurchasingInfoRecord + "'" });
                    } catch (crterr) {
                        postData = "";
                        /*log*/
                        await purchinfo_log({ type: "Error", message: "Error while creating entry in Hana Cloud for the Purchasing info record '" + PurchasingInfo.PurchasingInfoRecord + "'" });
                        LOG.error("Error while Inserting record:" + crterr);
                    }
                } else if (!LLMFail) {
                    let query = await UPDATE('PurchasingInfoService.PurchasingInfoSrv').set({
                        TaxononomyFlag: payload.TaxononomyFlag, EnergyEffClass: payload.EnergyEffClass, LLMFail: payload.LLMFail
                    }).where({ PurchasingInfoRecord: PurchasingInfo.PurchasingInfoRecord });
                    LOG.info("query : " + JSON.stringify(query));
                }

            } else {
                LOG.error("Insufficient Material Information");
                LOG.info("Material Text:" + PurchasingInfo.ProductDescription);
                LOG.info("Material:" + PurchasingInfo.Material);
                LOG.info("EAN:" + PurchasingInfo.ProductStandardID);
            }
        });

    };
    async function getPurchasingInfo(PurchasingInfoRecord) {
        LOG.info("getting info details from S4 for " + PurchasingInfoRecord);
        const matdescapi = await cds.connect.to("matdescapi");
        /*log*/
        await purchinfo_log({ type: "Info", message: "Retrieving the details from S4 for the Purchasing info record '" + PurchasingInfoRecord + "'" });
        let PurchasingInfo = await matdescapi.send('GET', "/sap/opu/odata/sap/YY1_PUR_INFO_CDS/YY1_PUR_INFO('" + PurchasingInfoRecord + "')?$select=PurchasingInfoRecord,Supplier,Material,MaterialGroup,CreationDate,PurchasingInfoRecordDesc,SupplierMaterialNumber,SupplierRespSalesPersonName,SupplierPhoneNumber,BaseUnit,SupplierMaterialGroup,PriorSupplier,VarblPurOrdUnitIsActive,Manufacturer,IsRegularSupplier,SupplierSubrange,ProductOldID,ProductDescription,ProductCategory,ProductStandardID")
        if (!PurchasingInfo.ProductDescription && PurchasingInfo.Material) {
            let prdDesc = await matdescapi.send('GET', "/sap/opu/odata/sap/API_PRODUCT_SRV/A_ProductBasicText?$filter=Product eq '" + PurchasingInfo.Material + "'&$select=LongText")
            if (prdDesc.length > 0) {
                PurchasingInfo.ProductDescription = prdDesc[0].LongText;
            } else {
                /*log*/
                await purchinfo_log({ type: "Error", message: "Product Long Text not available in S4 for the Material '" + PurchasingInfo.Material + "'" });
            }
            let productManufacturerInfo = await matdescapi.send('GET', "/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product?$filter=Product eq '" + PurchasingInfo.Material + "'&$select=ProductManufacturerNumber,ProductType")
            if (productManufacturerInfo.length > 0) {
                PurchasingInfo.Manufacturer = productManufacturerInfo[0].ProductManufacturerNumber;
            }
            let supDetails = await matdescapi.send('GET', "/sap/opu/odata/sap/YY1_EXTENS_CDS/YY1_EXTENS?$top=1&$filter=Language eq 'EN'and Product eq '" + PurchasingInfo.Material + "'")
            if (supDetails.length > 0) {
                PurchasingInfo.ProductCategory = supDetails[0].ProductCategory;
                PurchasingInfo.SupplierName = supDetails[0].SupplierName;
                // PurchasingInfo.Manufacturer = PurchasingInfo.Manufacturer != "" ? PurchasingInfo.Manufacturer : PurchasingInfo.SupplierName;
            }
            /*log*/
            await purchinfo_log({ type: "Success", message: "Retrieved the details from S4 for the Purchasing info record '" + PurchasingInfoRecord + "'" });
        }

        return PurchasingInfo;
    };

    // Trigger once we click on refresh button in purchase info record sapui5 app
    this.on('RefreshLllm', async req => {
        let PurchasingInfoRecord = req.data.PurchInfo + "";
        // LOG.info("Query Data : " + JSON.stringify(req.data));
        if (PurchasingInfoRecord) {
            try {
                let PurchasingInfo = await getPurchasingInfo(PurchasingInfoRecord);
                if (PurchasingInfo) {
                    /*log*/
                    await purchinfo_log({ type: "Info", message: "Refresh service triggered to fetch the Taxonomy flag for the Material '" + PurchasingInfo.Material + "'" });
                    LOG.info("Updating event record in hdb for " + JSON.stringify(PurchasingInfo));
                    await createEventsData(PurchasingInfo, "update");
                }

            } catch (refresherr) {
                /*log*/
                await purchinfo_log({ type: "Error", message: "Refresh service error while fetching Taxonomy flag details for the Material '" + PurchasingInfo.Material + "'" });
                LOG.info("Status Code:" + refresherr.message.includes("Resource not found"));
                
            }
        } else {
            LOG.info("Records not available in Back End for this Purchasing Info Record");
        }

    });
    async function removePurchaseInfoDatafromHana(PurchasingInfoRecord) {
        let PurchasingInfoRecordNo = PurchasingInfoRecord + "";
        if (PurchasingInfoRecord) {
            console.log(PurchasingInfoRecord)
            try {
                const affectedRows = await tx.run(
                    DELETE.from('PurchasingInfoService.PurchasingInfoSrv')
                        .where({ PurchasingInfoRecord: PurchasingInfoRecord })
                );
                console.log(affectedRows)
                await tx.commit();
                if (affectedRows === 0) {
                    LOG.info('No records were deleted');
                } else {
                    /*log*/
                    await purchinfo_log({ type: "Success", message: "Purchasing info record '" + PurchasingInfoRecord + "' deleted from Hana Cloud" });
                    LOG.info(`${affectedRows} record(s) were deleted`);
                }
            } catch (err) {
                LOG.info('Error while deleting the record:', err);
            }
        }
    }


    this.after('READ', 'PurchasingInfoSrv', each => {
        if (each.TaxononomyFlag == "") {
            each.LLMFail = true
        }
        else { each.LLMFail = false }
    })

    function dateISOConverter(dValue) {
        if (dValue) {
            let date = dValue;
            date.setHours(date.getHours() + 5);
            date.setMinutes(date.getMinutes() + 30);
            let isoString = date.toISOString();
            isoString = isoString.slice(0, -5) + 'Z';
            return isoString;
        } else { return dValue }
    };

    this.on('GetLogs', async req => {
        try {
            var Data = await getLogs();
            let finalData = Data.split("\n").map(message => ({ message }))
            return finalData;
        } catch (err) {
            LOG.info('Error while getting logs:', err);
        }
    });
    async function updateScreeningId(PO) {
        let matdescapi = await cds.connect.to("matdescapi");
        let PurchaseOrder = PO + "";
        try {
            let PODetails = await matdescapi.send('GET', "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrderItem?$filter=PurchaseOrder eq '" + PurchaseOrder + "'&$select=PurchasingInfoRecord,PurchaseOrderItem");
            // LOG.info(PODetails)
            // LOG.info(matdescapi.send())
            PODetails.forEach(async (item, idx) => {
                if (item.PurchasingInfoRecord) {
                    let POInfo = await SELECT.from('PurchasingInfoService.PurchasingInfoSrv').where({ PurchasingInfoRecord: item.PurchasingInfoRecord })
                    LOG.info(POInfo)
                    if (POInfo && POInfo.length > 0) {
                        let timeout = 1200;
                        try {
                            setTimeout(async () => {
                                 /*log*/
                                await purchinfo_log({ type: "Info", message: "Updating Screening ID to S4 for the Purchasing order '" + PurchaseOrder + "' and Item '" + item.PurchaseOrderItem + "'" })
                                let screeningId = POInfo[0].TaxononomyFlag === "Y" ? "1" : "2";
                                LOG.info("screeningId :" + screeningId);
                                patchRequestForSID(PurchaseOrder, item.PurchaseOrderItem,screeningId);
                             }, timeout * idx);


                        } catch (pierr) {
                            /*log*/
                            await purchinfo_log({ type: "Error", message: "Error while updating Screening ID to S4 for the Purchasing order '" + PurchaseOrder + "' and Item '" + item.PurchaseOrderItem + "'" });
                            LOG.error(pierr)
                            // await purchinfo_log(results, request);
                        }
                    } else {
                        /*log*/
                        await purchinfo_log({ type: "Info", message: "Purchasing info record '" + item.PurchasingInfoRecord + "' details not available in Hana Cloud to update the Screning ID" });
                    }
                }
            })
        } catch {
            LOG.info("Error while fetching Purchase order '" + PurchaseOrder + "'")
        }
    };
    async function  patchRequestForSID(PurchaseOrder, PurchaseOrderItem,screeningId){
        let matdescapi = await cds.connect.to("matdescapi");
        await matdescapi.send('PATCH', "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrderItem(PurchaseOrder='" + PurchaseOrder + "',PurchaseOrderItem='" + PurchaseOrderItem + "')", { YY1_ScreenID_PDI: screeningId })
        .then(async (response)  => {
            console.log('Request successful, response:', response);
            /*log*/
          await purchinfo_log({ type: "Success", message: "Updated Screening ID to S4 for the Purchasing order '" + PurchaseOrder + "' and Item '" + item.PurchaseOrderItem + "'" });
        })
        .catch((error) => {
            patchRequestForSID(PurchaseOrder, PurchaseOrderItem,screeningId)
            console.error('Error making the request:', error);
        });
     }

   
    this.on('READ', 'PurchasingInfoSrv', async A_PurchasingInfoRecordTypeData => {
        // await UPDATE('PurchasingInfoService.PurchasingInfoSrv',PurchasingInfo.PurchasingInfoRecord).with({ TaxononomyFlag : payload.TaxononomyFlag , EnergyEffClass : payload.EnergyEffClass, LLMFail : payload.LLMFail})
        let PO = '4500106251';
        updateScreeningId(PO);

    });


});