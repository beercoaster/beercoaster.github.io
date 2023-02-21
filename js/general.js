/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//				Restarting this all from scratch because it's become an absolute mess thanks to JavaScript's crappy sort stuff
//
//				So now we're going to shift over to importing the CSV file into a SQLite database, and pulling the results from there
//				
//				The question really though is whether to prep the data first, then put it into a table
//				Or to put it all into a table in a straigh CSV import, and then add the extra columns that we want for BCScore, 
//				and go through all the results working out the BCScore and adding it to the row
//
//				It seems that the most sensible way to do it is to read in the CSV file, then sort the BCScore data, and enter that into the table
//				The alternative is to import the csv to a table, update the table to add the BCScore column, then UPDATE the table/data to fill in the BCScore data
//				This second way seems to make more sense, but not sure how easy/difficult it would be.
//					Down side, can't import a CSV string to a SQLite table. Only a local file.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
Database Stuff
*/


//Callback function when the transaction is failed.
function errorCB(err) {
//	console.log("Error occured while executing SQL: "+err.code);
}

// Callback function when the transaction is success.
function successCB() {
//	var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
//	db.transaction(queryDB, errorCB);
//	console.log("db transaction successful");
}


///////////////////////////////////////////////
//
// 	EAST TO WEST 
//
///////////////////////////////////////////////

function createTableEW(tx) {
        tx.executeSql('DROP TABLE IF EXISTS ewResults');
        tx.executeSql('CREATE TABLE IF NOT EXISTS ewResults (data)');
}

////////
function csvSQLLoadEW(data, target, callback) {
	resStrEW = "";
	resArrayEW = [];
	posCountEW = 1;
	arrCountEW = 0;
	resColEW = "";
	resIndexEW = "";
	
	var xmlhttp;
	if (window.XMLHttpRequest)
	  {// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp=new XMLHttpRequest();
	  }
	else
	  {// code for IE6, IE5
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	  }
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
		var dbEW;
		/* so instead of returning it now, we want to manipulate the incoming csv data */
		var csvData = xmlhttp.responseText.split('\r\n');
		var resHeader = csvData.shift();
		resIndexesEW = resHeader.split(',');
		var resLeng = csvData.length;
		// set up the database
		dbEW = window.openDatabase("BCDatabase", "1.0", "resultsDatabase", 200000);
		// create the table 
		dbEW.transaction(createTableEW, errorCB, successCB);
		
		csvData.forEach(prepResEW);
		
		resStrEW = "<h3>Results:</h3>\r\n ";
		resStrEW += "<table>\r\n"+
					"<tr><th>#</th><th class=\"pointer\" title=\"Beer Coaster Score is calculated to take distance, time and elevation into account.\">BCS</th><th>Name</th><th>Time (hh:mm:ss)</th><th>Dist. (km)</th><th>Elev. (m)</th><th>Cat.</th><th>Date</th><th>Link</th></tr>\r\n";
		
		dbEW.transaction(function(tx) {
			
			tx.executeSql('SELECT data FROM ewResults ORDER BY data ASC;', [],
			
				function(transaction, result) {
			
					if (result != null && result.rows != null) {
						for (var i = 0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							ordKey = row.data;
								if(posCountEW % 2 == 0) {
									rowCol = "even";
								} else {
									rowCol = "odd";
								}
								var ordRes = displayObjEW[ordKey];
								resStrEW += "<tr class='"+rowCol+"'><td>"+posCountEW+"</td><td>"+ordRes["BCScore"]+"</td><td>"+ordRes["Runner Name"]+"</td><td class='cen'>"+ordRes["Time (hh:mm:ss)"]+"</td><td class='cen'>"+ordRes["Distance (km)"]+"</td><td class='cen'>"+ordRes["Elevation (m)"]+"</td><td>"+ordRes["Age/Category"]+"</td><td>"+ordRes["Date of Run"]+"</td><td><a href=\""+ordRes["Run Link (eg Strava)"]+"\" target=\"_blank\">link</a></td></tr>";
								posCountEW++;
						}
						resStrEW += "</table>\r\n";
						document.getElementById(target).innerHTML=resStrEW;
					}
				}, 
			errorCB, successCB);
		});
		if(callback) callback();
		}
	  }
	xmlhttp.open("GET",data,true);
	xmlhttp.send();	
}

function prepResEW(csvRow) {
	var resArr = csvRow.split(',');2
	var resLen = resArr.length;
	var i = 0;
	var resHead;
	var resData;
	newArr = [];
	newObj = {};
	while(i<resLen){
			resHead = resIndexesEW[i].trim();
			resData = resArr[i].trim();
			i++;
			newArr[resHead] = resData;
			newObj[resHead] = resData;
	}
	// now we get and work out the DAT - thankfully we know the variable names as we defined them when defining the form
	var resTime = newArr["Time (hh:mm:ss)"];
	var resDistance = newArr["Distance (km)"];
	var resElevation = newArr["Elevation (m)"];
	// now resTime is in hh:mm:ss format, so we need to sort that
	var timeArr = resTime.split(':');
	var timeHour = timeArr[0];
	var timeMinute = timeArr[1];
	var timeSeconds = parseFloat(timeArr[2]);
	timeHour = parseFloat(timeHour*3600);
	timeMinute = parseFloat(timeMinute*60);
	var totalSeconds = (timeHour+timeMinute)+timeSeconds;
	
	var workDistance = resDistance*1000;
	// work out the pace
	var workPace = (totalSeconds/workDistance);
	var workStart = (workPace/workDistance);
	var workSecond = (workStart/resElevation);
	var resScore = Math.round(workSecond * 100000000000)/100;

	newObj["BCScore"] = resScore;

	displayObjEW[resScore] = newObj;

	dbEW = window.openDatabase("BCDatabase", "1.0", "resultsDatabase", 200000);
	dbEW.transaction(function(tx) {
		tx.executeSql('INSERT INTO ewResults(data) VALUES('+resScore+')');
	}, errorCB, successCB);
	
}


///////////////////////////////////////////////
//
// 	WEST TO EAST
//
///////////////////////////////////////////////

function createTableWE(tx) {
        tx.executeSql('DROP TABLE IF EXISTS weResults');
        tx.executeSql('CREATE TABLE IF NOT EXISTS weResults (data)');
}

////////
function csvSQLLoadWE(data, target, callback) {
	resStrWE = "";
	resArrayWE = [];
	posCountWE = 1;
	arrCountWE = 0;
	resColWE = "";
	resIndexWE = "";
	
	var xmlhttp;
	if (window.XMLHttpRequest)
	  {// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp=new XMLHttpRequest();
	  }
	else
	  {// code for IE6, IE5
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	  }
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
		var dbWE;
		/* so instead of returning it now, we want to manipulate the incoming csv data */
		var csvData = xmlhttp.responseText.split('\r\n');
		var resHeader = csvData.shift();
		resIndexesWE = resHeader.split(',');
		var resLeng = csvData.length;
		// set up the database
		dbWE = window.openDatabase("BCDatabase", "1.0", "resultsDatabase", 200000);
		// create the table 
		dbWE.transaction(createTableWE, errorCB, successCB);
		
		csvData.forEach(prepResWE);
		
		resStrWE = "<h3>Results:</h3>\r\n ";
		resStrWE += "<table>\r\n"+
					"<tr><th>#</th><th class=\"pointer\" title=\"Beer Coaster Score is calculated to take distance, time and elevation into account.\">BCS</th><th>Name</th><th>Time (hh:mm:ss)</th><th>Dist. (km)</th><th>Elev. (m)</th><th>Cat.</th><th>Date</th><th>Link</th></tr>\r\n";
		
		dbWE.transaction(function(tx) {
			
			tx.executeSql('SELECT data FROM weResults ORDER BY data ASC;', [],
			
				function(transaction, result) {
			
					if (result != null && result.rows != null) {
						for (var i = 0; i < result.rows.length; i++) {
							var row = result.rows.item(i);
							ordKey = row.data;
								if(posCountEW % 2 == 0) {
									rowCol = "even";
								} else {
									rowCol = "odd";
								}
								var ordRes = displayObjWE[ordKey];
								resStrEW += "<tr class='"+rowCol+"'><td>"+posCountEW+"</td><td>"+ordRes["BCScore"]+"</td><td>"+ordRes["Runner Name"]+"</td><td class='cen'>"+ordRes["Time (hh:mm:ss)"]+"</td><td class='cen'>"+ordRes["Distance (km)"]+"</td><td class='cen'>"+ordRes["Elevation (m)"]+"</td><td>"+ordRes["Age/Category"]+"</td><td>"+ordRes["Date of Run"]+"</td><td><a href=\""+ordRes["Run Link (eg Strava)"]+"\" target=\"_blank\">link</a></td></tr>";
								posCountWE++;
						}
						resStrWE += "</table>\r\n";
						document.getElementById(target).innerHTML=resStrWE;
					}
				}, 
			errorCB, successCB);
		});
		if(callback) callback();
		}
	  }
	xmlhttp.open("GET",data,true);
	xmlhttp.send();	
}

function prepResWE(csvRow) {
	var resArr = csvRow.split(',');2
	var resLen = resArr.length;
	var i = 0;
	var resHead;
	var resData;
	newArr = [];
	newObj = {};
	while(i<resLen){
			resHead = resIndexesWE[i].trim();
			resData = resArr[i].trim();
			i++;
			newArr[resHead] = resData;
			newObj[resHead] = resData;
	}
	// now we get and work out the DAT - thankfully we know the variable names as we defined them when defining the form
	var resTime = newArr["Time (hh:mm:ss)"];
	var resDistance = newArr["Distance (km)"];
	var resElevation = newArr["Elevation (m)"];
	// now resTime is in hh:mm:ss format, so we need to sort that
	var timeArr = resTime.split(':');
	var timeHour = timeArr[0];
	var timeMinute = timeArr[1];
	var timeSeconds = parseFloat(timeArr[2]);
	timeHour = parseFloat(timeHour*3600);
	timeMinute = parseFloat(timeMinute*60);
	var totalSeconds = (timeHour+timeMinute)+timeSeconds;
	
	var workDistance = resDistance*1000;
	// work out the pace
	var workPace = (totalSeconds/workDistance);
	var workStart = (workPace/workDistance);
	var workSecond = (workStart/resElevation);
	var resScore = Math.round(workSecond * 100000000000)/100;

	newObj["BCScore"] = resScore;

	displayObjWE[resScore] = newObj;

	dbWE = window.openDatabase("BCDatabase", "1.0", "resultsDatabase", 200000);
	dbWE.transaction(function(tx) {
		tx.executeSql('INSERT INTO weResults(data) VALUES('+resScore+')');
	}, errorCB, successCB);
	
}