namespace scp.cloud.PurchasingInfo;

using {managed} from '@sap/cds/common';
using {API_INFORECORD_PROCESS_SRV as bupa} from '../srv/external/API_INFORECORD_PROCESS_SRV';

entity A_PurchasingInfoRecordType {
    key PurchasingInfoRecord           : String(10);
        Supplier                       : String(10);
        Material                       : String(40);
        MaterialGroup                  : String(9);
        CreationDate                   : DateTime;
        IsDeleted                      : Boolean;
        PurchasingInfoRecordDesc       : String(40);
        PurgInfoRecNonStockItmSortTerm : String(10);
        SupplierMaterialNumber         : String(35);
        SupplierRespSalesPersonName    : String(30);
        SupplierPhoneNumber            : String(16);
        BaseUnit                       : String(3);
        SupplierMaterialGroup          : String(18);
        PriorSupplier                  : String(10);
        AvailabilityStartDate          : DateTime;
        AvailabilityEndDate            : DateTime;
        VarblPurOrdUnitIsActive        : String(1);
        Manufacturer                   : String(100);
        IsRegularSupplier              : Boolean;
        SupplierSubrange               : String(6);
        SupplierName                   : String(150);
        LastChangeDateTime             : DateTime;
        IsEndOfPurposeBlocked          : String(1);
        TaxononomyFlag                 : String(1);
        EnergyEffClass                 : String(5);
        ProductOldID                   : String(20);
        ProductDescription             : String(300);
        ProductCategory                : String(50);
        ProductStandardID              : String(50);
        LLMFail                     : Boolean;
};

entity A_PurchasingInfoStd as projection on bupa.A_PurchasingInfoRecord {
    key PurchasingInfoRecord,
        Supplier,
        Material,
        MaterialGroup,
        CreationDate,
        IsDeleted,
        PurchasingInfoRecordDesc,
        PurgInfoRecNonStockItmSortTerm,
        PurgDocOrderQuantityUnit,
        OrderItemQtyToBaseQtyNmrtr,
        OrderItemQtyToBaseQtyDnmntr,
        SupplierMaterialNumber,
        SupplierRespSalesPersonName,
        SupplierPhoneNumber,
        BaseUnit,
        SupplierMaterialGroup,
        PriorSupplier,
        AvailabilityStartDate,
        AvailabilityEndDate,
        VarblPurOrdUnitIsActive,
        Manufacturer,
        IsRegularSupplier,
        SupplierSubrange,
        NoDaysReminder1,
        NoDaysReminder2,
        NoDaysReminder3,
        ProductPurchasePointsQty,
        ProductPurchasePointsQtyUnit,
        SupplierSubrangeSortNumber,
        LastChangeDateTime,
        IsEndOfPurposeBlocked
}
