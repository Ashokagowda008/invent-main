const cds = require("@sap/cds");
const LOG = cds.log('SusService');
const tx = cds.transaction();


async function getEquipDocument(req) {
    let [OrderNo] = [req.data.OrderNo];
    const plantmaintsrv = await cds.connect.to("plantmaintorderdest");
    console.log(plantmaintsrv);
     let response = await plantmaintsrv.send('GET', "/GetEquipDocSet(Orderno='" + OrderNo + "')/$value", { responseType: 'arraybuffer' })
    //  .then(response => {
        // Note that response.data is an ArrayBuffer.
        const base64 = Buffer.from(response, 'binary').toString('base64');
        
        console.log(base64);
        return {b64: base64} 
    // })
        // .catch(error => {
        //     console.log('Error', error);
        // });
    
}
module.exports = { getEquipDocument }