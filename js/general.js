/**************************************************************************************/
/*
pLoad is a simple ajax page load function that gets the content of the called file and 
puts it into content element of the page
*/
/**************************************************************************************/
/*
function pLoad(page, callback) {
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
		document.getElementById("page").innerHTML=xmlhttp.responseText;
		if(callback) callback();
		}
	  }
	xmlhttp.open("GET",page,true);
	xmlhttp.send();
}
*/

var arrCount = 0;
var posCount = 1;
var resIndexes;
var resArray = [];
var newArr = [];
var displayObj = {};
var resStr = "";
var rowCol = "";

/******************************************************************************************/
/*
dLoad is a simple data load function that gets the content of the called file and 
assigns it to a variable
*/
/*******************************************************************************************/
function csvLoad(data, target, callback) {
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
			
			/* This is where we now have the csv or other data in the responseText string.
				So we need to call the function we want to strip out what we don't want.
				Best way to do this here is have another function csvLoad that calls this function,
				and then have this function pass that data back to csvLoad
				That way, this function can be used for other data loading tasks */
			/* don't do this though as the page won't have properly loaded when this is called, so the target element won't be there */
		
		/* so instead of returning it now, we want to manipulate the incoming csv data */
		var csvData = xmlhttp.responseText.split('\r\n');
		
		var resHeader = csvData.shift();
		resIndexes = resHeader.split(',');
		var resLeng = csvData.length;
		
		// now for each of the csvData elements, which are the individual runner results, we prepRow to get the data into 
		// associated indexes, and with the DAT time.
		// then we also put that new array into the display array
		csvData.forEach(prepRow);
		
		
		//now we should have displayArr with all the data in the right order
		/// now to sort the array, which apparantly you shouldn't do because why would you be doing so ?!>
		var ordered = Object.keys(displayObj).sort();
		// now we have a list of the DAT keys in the right order, we can build the return string, using those keys to get the runner data
		resStr = "<h3>Results:</h3>\r\n ";
		// put in position, DAT, time, distance, name, category (m/f/age), run/walk/cycle, link to record, date
		// although run/walk/cycle should be different forms and different tables?
		resStr += "<table>\r\n"+
					"<tr><th>Position</th><th>DAT (hh:mm:ss)</th><th>Name</th><th>Time (hh:mm:ss)</th><th>Distance (km)</th><th>Elevation (m)</th><th>Category</th><th>Date</th><th>Link</th></tr>\r\n";
					
		ordered.forEach(setRes);
					
		resStr += "</table>\r\n";
		
	//	return xmlhttp.responseText;	
		document.getElementById(target).innerHTML=resStr;
		// obviously this will need to be something different so that we can get the other results for the route
		if(callback) callback();
		}
	  }
	xmlhttp.open("GET",data,true);
	xmlhttp.send();	
}


function setRes(ordKey) {
	if(posCount % 2 == 0) {
		rowCol = "even";
	} else {
		rowCol = "odd";
	}
		
	var ordRes = displayObj[ordKey];
	resStr += "<tr class='"+rowCol+"'><td>"+posCount+"</td><td>"+ordRes["DAT"]+"</td><td>"+ordRes["Runner Name"]+"</td><td class='cen'>"+ordRes["Time (hh:mm:ss)"]+"</td><td class='cen'>"+ordRes["Distance (km)"]+"</td><td class='cen'>"+ordRes["Elevation (m)"]+"</td><td> - - </td><td> --- </td><td> ---- </td></tr>";
	posCount++;
}


function prepRow(csvRow) {
	/******************************************************************************************/
	/* Now here is a weird and wonderful function to sort an array of csv data strings.
		first we're going to split each csv string into it's own array
		then we're going to calculate the DAT data for that array
		then, we're going to use the DAT data as the index to insert the rest of the data into a new array.
		the DAT data as the index will then give us the results data sorted by the Distance Adjusted Time
		Once we've done that, we can start to build the table to display */
	/*****************************************************************************************/
	prepRes(csvRow);
	arrCount++
}

function prepRes(csvRow) {
	var resArr = csvRow.split(',');
	// now we have resArr which *should* be in the same order as resIndexes, so we *should* be able to assign them as index elements to a new array.
	// we can then use those to work out the DAT
	// and then we can use the DAT as the index to put this array into a new array
	var resLen = resArr.length;
	var i = 0;
	var resHead;
	var resData;
	newArr = [];
	newObj = {};
	while(i<resLen){
			resHead = resIndexes[i].trim();
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
	var resGain = 1+(resElevation/workDistance);
	var resTime = totalSeconds/resGain;

	var datResult = new Date(resTime * 1000).toISOString().slice(11, 19);

	newObj.DAT = datResult;
	// now put the associated data into an array, with the DAT time as its index
	// change this to check that there's not already an index with that time though
	displayObj[datResult] = newObj;
}