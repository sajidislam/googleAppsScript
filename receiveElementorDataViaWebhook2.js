// In case you want to change the Sheet name
var sheetName = 'Sheet1'
var scriptProp = PropertiesService.getScriptProperties()

// Lowercasing all input keys in the POST data by default (to avoid Message vs message confusion)
var shouldLowerCaseHeaders = true

function intialSetup () {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  scriptProp.setProperty('key', activeSpreadsheet.getId())
}

function filterRow (parameters, mandatoryFields) {
    return mandatoryFields.every(field => parameters[field.toString().toLowerCase()] && parameters[field.toString().toLowerCase()].length > 0)
}

function doPost (e) {
  var lock = LockService.getScriptLock()
  lock.tryLock(10000)
  // Uncomment and add fields which must be mandatory when submitting a form
  //const mandatoryFields = ['questions']
  const mandatoryFields = []

  try {
    // Get the current open Google Sheet
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'))
    var sheet = doc.getSheetByName(sheetName)

    // IMPORTANT: Create headers in your google sheet first
    //            If you dont create headers this won't match the data
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    var nextRow = sheet.getLastRow() + 1

    var parameters = e.parameter;

    // Lower casing header keys - True by default
    if (shouldLowerCaseHeaders){
      Object.entries(e.parameter).map(([key, value]) => parameters[key.toString().toLocaleLowerCase()] = value)
    }
    
    const shouldInsertToSheet = filterRow(parameters, mandatoryFields)
    
    if (shouldInsertToSheet){
      var newRow = headers.map(function(header) {
        return header.toString().toLowerCase() === 'timestamp' ? new Date() : parameters[header.toString().toLowerCase()]
      })
      sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow])
    }
    
    return HtmlService.createHtmlOutput("post request received");
  }

  catch (e) {
      return HtmlService.createHtmlOutput("post request received");
  }

  finally {
    lock.releaseLock()
  }
}
