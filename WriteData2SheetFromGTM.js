// Usage
// 1. Enter sheet name where data is to be written below
// 1. Enter sheet name and key where data is to be written below
var SHEET_NAME = "<NAME_OF_YOUR_SHEET_TAB>";
var SHEET_KEY = "<ENTERT_YOUR_SHEET_KEY>";
var SECRET_KEY = "<SECRET_KEY>";
var EXPECTED_REFERER = "<PUT_YOUR_DOMAIN_NAME_FOR_ADDED_SECURITY>";


// 2. Run &gt; setup
//
// 3. Publish &gt; Deploy as web app
// - enter Project Version name and click 'Save New Version'
// - set security level and enable service (most likely execute as 'me' and access 'anyone, even anonymously)
//
// 4. Copy the 'Current web app URL' and post this in your form/script action
//
// 5. Insert column names on your destination sheet matching the parameter names of the data you are passing in (exactly matching case)

var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// If you don't want to expose either GET or POST methods you can comment out the appropriate function
function doGet(e){
return handleResponse(e);
}

function doPost(e){
  return handleResponse(e);
  }

function handleResponse(e) {
  var lock = LockService.getPublicLock();
  lock.waitLock(30000); // wait 30 seconds before conceding defeat.

  //Logger.log("Received secret_key: " + e.parameter.secret_key);
  //Logger.log("Received custom_referer: " + e.parameter.custom_referer);

  // Verify Source by checking secret key
  var secretKey = e.parameter.secret_key || "";
  if (secretKey !== SECRET_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({"result":"error", "error": "Unauthorized - Invalid Secret Key"}))
      .setMimeType(ContentService.MimeType.JSON);
    }

  // Check custom_referer
/*
  var customReferer = e.parameter.custom_referer || "";
  if (customReferer !== EXPECTED_REFERER) {
    return ContentService
      .createTextOutput(JSON.stringify({"result":"error", "error": "Unauthorized - Invalid custom_referer"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
*/
  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SHEET_KEY);
    var sheet = doc.getSheetByName(SHEET_NAME);

    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = [];
    // loop through the header columns
    for (i in headers){
      if (headers[i] == "Timestamp"){ // special case if you include a 'Timestamp' column
        row.push(new Date());
      } else { // else use header name to get data
        row.push(e.parameter[headers[i]]);
    }
  }
   // more efficient to set values as [][] array than individually
   sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
   // return json success results
   return ContentService
    .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
    .setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    // Log the error
    Logger.log(e);
    return ContentService
      .createTextOutput(JSON.stringify({"result":"error", "error": e}))
      .setMimeType(ContentService.MimeType.JSON);
    } finally { //release lock
        lock.releaseLock();
    }
  }
