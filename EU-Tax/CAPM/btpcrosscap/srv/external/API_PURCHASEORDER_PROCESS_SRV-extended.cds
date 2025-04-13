using { API_PURCHASEORDER_PROCESS_SRV } from './API_PURCHASEORDER_PROCESS_SRV';

  extend service API_PURCHASEORDER_PROCESS_SRV {
   @topic: 'sap.s4.beh.purchaseorder.v1.PurchaseOrder.Created.v1'
  event Created : {
    PurchasingInfoRecord : API_PURCHASEORDER_PROCESS_SRV.A_PurchaseOrder:PurchaseOrder
  }
}
