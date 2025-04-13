using {scp.cloud.PurchasingInfo as my} from '../db/schema';

@path: 'purchasinginfoservice'
service PurchasingInfoService {
   entity PurchasingInfoSrv          as projection on my.A_PurchasingInfoRecordType;
   entity A_PurchasingInfoStdRecords as projection on my.A_PurchasingInfoStd;
   function RefreshLllm(PurchInfo : String) returns String;
   function GetLogs() returns array of { message:String };
}
