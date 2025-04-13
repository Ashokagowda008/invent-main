
function dbDateFormatter(dateString, idxflag) {
    // idxflag = 0 no modification -1 prev timestamp, +1 next timestamp
    var date = new Date();
    if (dateString) {
        const [datePart, timePart] = dateString.split(' ');
        let [month, day, year] = [new Date(datePart).getUTCMonth(), new Date(datePart).getUTCDate(), new Date(datePart).getUTCFullYear()]
        // // Split date into components
        // if (datePart && datePart.split('-').length > 1) {
        //     [day, month, year] = datePart.split('-');
        // } else {
        //     [month, day, year] = datePart.split('/');
        // }
        // Split time into components
        const [hours, minutes] = timePart.split(':');
        // Create a new date object

        year.length === 2 ? date.setFullYear(2000 + Number(year)) : date.setFullYear(Number(year));  // Assuming year is in 'yy' format
        date.setMonth(Number(month));  // Months are 0-indexed in JS
        date.setDate(Number(day));
        date.setHours(Number(hours));
        date.setMinutes(Number(minutes));
        date.setSeconds(0);
        if (idxflag && (idxflag == -1)) {
            date.setTime(date.getTime() - (60 * 60 * 1000))
        } else if (idxflag && (idxflag == +1)) {
            date.setTime(date.getTime() + (60 * 60 * 1000))
        }
        return date.toISOString().split('.')[0] + 'Z';
        // Format the date to ISO string and remove milliseconds

    } else {
        return "";
    }

}
// function newRecordDateFormatter (dValue) {
//     if (dValue) {
//         let splittedValue = dValue.split("/");
//         dValue = splittedValue[1] + "/" + splittedValue[0] + "/" + splittedValue[2]
//         var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
//             pattern: "yyyy-MM-dd"
//         });
//         dValue = dateFormat.format(new Date(dValue));
//         dValue = dValue + "T00:00:00Z";
//     }
//     return dValue
// }
function dbSensorDataStructue(dbValue) {
    let structure = {};
    if (dbValue) {
        structure = {
            timestamp: dbValue["TIMESTAMP"],
            reading: parseFloat(dbValue["READING"]).toFixed(2),
            sensor_id: dbValue["SENSORID"],
            hourlydeff: dbValue["hourlydeff"]
        }
    }
    return structure
}
function filterPeriodWiseData(filter) {
    // Parse the filter into start and end months
    let startMonth, endMonth;
    if (filter === 'Q1') {
        startMonth = 1; // January
        endMonth = 3; // March
    } else if (filter === 'Q2') {
        startMonth = 4; // April
        endMonth = 6; // June
    } else if (filter === 'Q3') {
        startMonth = 7; // July
        endMonth = 9; // September
    } else if (filter === 'Q4') {
        startMonth = 10; // October
        endMonth = 12; // December
    } else {
        // If the filter is a month
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        startMonth = endMonth = monthNames.indexOf(filter.toLowerCase()) + 1;
    }
    return { startMonth, endMonth }
};
function filterMonthName(monthValue) {
    // Parse the filter into start and end months
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[parseInt(monthValue) - 1];
};
function getFirstAndLastDates(startMonth, endMonth, year) {
    // JavaScript counts months from 0, so subtract 1 from month number
    let startDate = new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0));
    let endDate =  new Date(Date.UTC(year, endMonth, 0, 23, 59, 59));

    let startStr = startDate.toISOString();
    let endStr = endDate.toISOString();

    return {
        start: startStr,
        end: endStr
    };
}

module.exports = { dbDateFormatter, dbSensorDataStructue, filterPeriodWiseData, filterMonthName, getFirstAndLastDates }