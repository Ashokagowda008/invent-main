using { API_INFORECORD_PROCESS_SRV } from './API_INFORECORD_PROCESS_SRV';

  extend service API_INFORECORD_PROCESS_SRV {

  @topic: 'sap.s4.beh.purchasinginforecord.v1.PurchasingInfoRecord.Created.v1'
  event Created : {
    PurchasingInfoRecord : API_INFORECORD_PROCESS_SRV.A_PurchasingInfoRecord:PurchasingInfoRecord
  }

  @topic: 'sap.s4.beh.purchasinginforecord.v1.PurchasingInfoRecord.Changed.v1'
  event Changed : {
      PurchasingInfoRecord : API_INFORECORD_PROCESS_SRV.A_PurchasingInfoRecord:PurchasingInfoRecord
  }
}
