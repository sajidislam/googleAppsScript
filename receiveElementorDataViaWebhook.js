 /* Google app-script to receive Elementor Pro Forms data via webhook
 * From : https://github.com/pojome/elementor/issues/5894
 */
var emailNotification = false; /* Change to true to enable email notifications */
var emailAddress = "youremail@email.com"; /* EDIT this to your email */



// DO NOT EDIT THESE NEXT PARAMS
var isNewSheet = false;
var receivedData = [];

/**
 * this is a function that fires when the webapp receives a GET request
 * Not used but required.
 */
function doGet( e ) {
	return HtmlService.createHtmlOutput( "Yep this is the webhook URL, request received" );
}

// Webhook Receiver - triggered with form webhook to published App URL.
function doPost( e ) {
	var params = JSON.stringify(e.parameter);
	params = JSON.parse(params);
	insertToSheet(params);

	// HTTP Response
	return HtmlService.createHtmlOutput( "post request received" );
}

// Flattens a nested object for easier use with a spreadsheet
function flattenObject( ob ) {
	var toReturn = {};
	for ( var i in ob ) {
		if ( ! ob.hasOwnProperty( i ) ) continue;
		if ( ( typeof ob[ i ] ) == 'object' ) {
			var flatObject = flattenObject( ob[ i ] );
			for ( var x in flatObject ) {
				if ( ! flatObject.hasOwnProperty( x ) ) continue;
				toReturn[ i + '.' + x ] = flatObject[ x ];
			}
		} else {
			toReturn[ i ] = ob[ i ];
		}
	}
	return toReturn;
}

// normalize headers
function getHeaders( formSheet, keys ) {
	var headers = [];
  
	// retrieve existing headers
    if ( ! isNewSheet ) {
	  headers = formSheet.getRange( 1, 1, 1, formSheet.getLastColumn() ).getValues()[0];
    }

	// add any additional headers
	var newHeaders = [];
	newHeaders = keys.filter( function( k ) {
		return headers.indexOf( k ) > -1 ? false : k;
	} );

	newHeaders.forEach( function( h ) {
		headers.push( h );
	} );
	return headers;
}

// normalize values
function getValues( headers, flat ) {
	var values = [];
	// push values based on headers
	headers.forEach( function( h ){
		values.push( flat[ h ] );
	});
	return values;
}

// Insert headers
function setHeaders( sheet, values ) {
	var headerRow = sheet.getRange( 1, 1, 1, values.length )
	headerRow.setValues( [ values ] );
	headerRow.setFontWeight( "bold" ).setHorizontalAlignment( "center" );
}

// Insert Data into Sheet
function setValues( sheet, values ) {
	var lastRow = Math.max( sheet.getLastRow(),1 );
	sheet.insertRowAfter( lastRow );
	sheet.getRange( lastRow + 1, 1, 1, values.length ).setValues( [ values ] ).setFontWeight( "normal" ).setHorizontalAlignment( "center" );
}

// Find or create sheet for form
function getFormSheet( formName ) {
	var formSheet;
	var activeSheet = SpreadsheetApp.getActiveSpreadsheet();

	// create sheet if needed
	if ( activeSheet.getSheetByName( formName ) == null ) {
      formSheet = activeSheet.insertSheet();
      formSheet.setName( formName );
      isNewSheet = true;
	}
	return activeSheet.getSheetByName( formName );
}


// key function where it all happens
function insertToSheet( data ){
	var flat = flattenObject( data );
	var keys = Object.keys( flat );
	var formName = data["form_name"];
	var formSheet = getFormSheet( formName );
	var headers = getHeaders( formSheet, keys );
	var values = getValues( headers, flat );
	setHeaders( formSheet, headers );
	setValues( formSheet, values );
	
    if ( emailNotification ) {
		sendNotification( data, getSeetURL() );
	}
}

function getSeetURL() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  return spreadsheet.getUrl();
}

function sendNotification( data, url ) {
	var subject = "A new Elementor Pro Forms submission has been inserted to your sheet";
  var message = "A new submission has been received via " + data['form_name'] + " form and inserted into your Google sheet at: " + url;
	MailApp.sendEmail( emailAddress, subject, message, {
		name: 'Automatic Emailer Script'
	} );
}

