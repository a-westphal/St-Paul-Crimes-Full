var app;
var location;
var geocode = 'http://open.mapquestapi.com/nominatim/v1/search.php?key=uBxMcgwVXryBtdx0zShGffi0qgdlIcVN&format=json&q=';
var reverse = 'http://open.mapquestapi.com/nominatim/v1/reverse.php?key=uBxMcgwVXryBtdx0zShGffi0qgdlIcVN&format=json&';
var latlon;
var visible = [];
var map;
var neighborhoods;
var markersLayer;

function Prompt() {
	$("#dialog-form").dialog({
		autoOpen: true,
		modal: true,
		width: "360px",
		buttons: {
			"Ok": function() {
				var prompt_input = $("#prompt_input");
				Init(prompt_input.val());
				$(this).dialog("close");
			},
			"Cancel": function() {
				$(this).dialog("close");
			}
		}
	});
} //prompt

function Init(crime_api_url) {
	//Map
	/*window.onload = onPageLoad();
	function onPageLoad()
	{
		for(let i = 1; i < 18; i ++)
		{
			var element = "N" + i;
			document.getElementById(element).checked = true;
			addNFilter(element);

		}

	}*/ 

	setCrimeAPI(crime_api_url);
	var southWest = L.latLng(44.8868761,-93.241981);
	var northEast = L.latLng(44.9924769,-93.0132809);
	var bounds = L.latLngBounds(southWest,northEast);

	neighborhoods = {
		"Conway/Battlecreek/Highwood" : {
			lat: 44.929398,
			lon: -93.021122
		},
		"Greater East Side": {
			lat: 44.977504, 
			lon: -93.025306
		},
		"West Side": {
			lat: 44.934140,
			lon: -93.080875
		},
		"Dayton's Bluff": {
			lat: 44.956799, 
			lon: -93.060833
		},
		"Payne/Phalen":{
			lat: 44.977521, 
			lon: -93.065995
		},
		"North End":{
			lat: 44.977401,
			lon: -93.105991
		},
		"Thomas/Dale(Frogtown)":{
			lat: 44.959437, 
			lon: -93.121250
		},
		"Summit/University":{
			lat: 44.948550, 
			lon:-93.126295
		},
		"West Seventh":{
			lat: 44.928392,
			lon: -93.125790
		},
		"Como":{
			lat: 44.987942, 
			lon: -93.220351
		},
		"Hamline/Midway" :{
			lat: 44.962886, 
			lon: -93.167055
		},
		"St. Anthony":{
			lat: 44.974259, 
			lon: -93.194574
		},
		"Union Park":{
			lat: 44.948477,
			lon: -93.174699
		},
		"Macalester-Groveland":{
			lat: 44.934297,
			lon: -93.177209
		},
		"Highland":{
			lat: 44.912524,
			lon: -93.177195
		},
		"Summit Hill":{
			lat: 44.937841, 
			lon: -93.136439
		},
		"Capitol River":{
			lat: 44.948285, 
			lon: -93.091623
		}
	}; //neighborhoods 

	map = L.map('mapid').setView([44.9537,-93.0900], 13);
		L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
			minZoom: 11,
			maxZoom: 18,
			id: 'mapbox/streets-v11',
			accessToken: 'pk.eyJ1IjoiYXdlc3RwaGFsIiwiYSI6ImNrM3Z5M2R5MTBoc2UzcGxiMWR3d2FoYW0ifQ.Eow1YC0uUG2NPxBM-iPmbg'
		}).addTo(map);

	map.setMaxBounds(bounds);

	//search bounds: 
	//NW corner: 44.9924769,-93.241981,
	//NE corner: 44.9924769,-93.0132809,15
	//SE corner: 44.8868761,-93.0132809
	//SW corner: 44.8868761,-93.2063927

	app = new Vue({
		el: "#app",
		data: {
			search_text: "",
			date_from: "2019-10-01",
			date_to: "2019-10-31",
			time_from: "",
			time_to: "",
			//neigh_filter: ["Conway/Battlecreek/Highwood","Greater East Side","West Side","Dayton's Bluff","Payne/Phalen","North End","Thomas/Dale(Frogtown)","Summit/University","West Seventh","Como","Hamline/Midway","St. Anthony","Union Park","Macalester-Groveland","Highland","Summit Hill","Capitol River"],
			incidents: {
								 
			}
		},
		methods: {
			computed:function (neighborhood) 
			{
				if(visible.includes(neighborhood))
				{
					return true;
				}

				else
				{
					return false;
				}
			},
			getClass:function(code)
			{
				if(code >= 110 && code <= 566)
				{
					//violent
					return "violent";
				}
				else if(code >= 600 && code <= 1436)
				{
					//property
					return "property";
				}

				else if(code >=1800 && code <= 9959)
				{
					//other
					return "other";
				} 
			},
			addMarker:function(incident)
			{
				console.log(incident['block']);
				var res = incident['block'].split(" ");
				var block;  
				var block_hold;
				if(res[0].includes("X"))
				{
					block_hold = res[0].replace("X","0");
					block = block_hold.replace(" ","+");
					console.log(block);
				}
				else {
					block = incident['block'].replace(" ","+");
					console.log(block);
				}

				var search = geocode + block;
				console.log(search);
				$.getJSON(geocode, function(data){
					console.log(data);
					//var block_lat = data[0]['lat'];
					//var block_lon = data[0]['lon'];
					//console.log("lat: " + block_lat);
					//console.log("lon: " + block_lon);
					//var list = "<dl><dt>Neighborhood</dt>" + "<dd>" + incident['neighborhood_name'] + "</dd>" + "<dt>Incident:</dt>" + "<dd>" + incident['incident'] + "</dd>" + "<dt> Date: </dt>" +"<dd>" +incident['date'] +"</dd>"
					//L.marker([block_lat,block_lon]).bindPopup(list).addTo(markersLayer);
				})

			}			
		}

	});
	
	var neighborhood_keys = Object.keys(neighborhoods);
	for(let i = 0; i < 17; i ++)
	{
		var element = neighborhood_keys[i];
		document.getElementById(element).checked = true;
	}		

	//data:
	getData(crime_api_url);
			
}//Init

//check if the search button has been clicked:
function searchMap(){
	var locale = app.search_text;
	var locale = locale.split(" ").join("+");
	var search = geocode + locale + "+St+Paul+MN&addressdetails=1&limit=1"; 

	$.getJSON(search, function(data){
				
		var lat = data[0]['lat'];
		var lon = data[0]['lon'];

		if((lat <= 44.9924769 || lat >= 44.8868761) && (lon >= -93.241981 || lon <= -93.0132809))
		{
			map.setView([lat,lon],17);
		}
	}); 
}

function setCrimeAPI(crime_url)
{
	crime = crime_url;
}
function getCrimeAPI()
{
	return this.crime;
}

function setVisible(visible_vals)
{
	visible = visible_vals;
}


function addNFilter(neighborhood)
{
	console.log("addNFilter");
	console.log(app.neigh_filter.includes(neighborhood));
	if(visible.includes(neighborhood))
	{
		var index = visible.indexOf(neighborhood);
		visible.splice(index);
	}
	else
	{
		visible.push(neighborhood);
	}

	getData(crime);
}

function getData(crime)
{
	var count = 0;
	$.getJSON(crime + "/incidents",(data)=>{
		var incidents = data;
		const keys = Object.keys(incidents);
		var crimes = {
			"Conway/Battlecreek/Highwood" : 0,
			"Greater East Side": 0,
			"West Side":0,
			"Dayton's Bluff":0 ,
			"Payne/Phalen":0,
			"North End":0,
			"Thomas/Dale(Frogtown)":0,
			"Summit/University":0,
			"West Seventh":0,
			"Como":0,
			"Hamline/Midway" :0,
			"St. Anthony":0,
			"Union Park":0,
			"Macalester-Groveland":0,
			"Highland":0,
			"Summit Hill":0,
			"Capitol River":0
		};

		const nest_Keys = Object.keys(incidents[keys[0]]);
	
		for(let i = 0; i < keys.length; i ++)
		{

			if((incidents[keys[i]]['date'] <= app.date_to && incidents[keys[i]]['date'] >= app.date_from))
			{
				app.incidents[keys[i]] = incidents[keys[i]];
				app.incidents[keys[i]]['class'] = 'violent';
				for(let j =0; j < nest_Keys.length; j ++)
				{
					if(j == 5)
					{
						neighborhood_hold = incidents[keys[i]][nest_Keys[j]];
						if(crimes.hasOwnProperty(neighborhood_hold))
						{
							crimes[neighborhood_hold] += 1;
						}
					}
				}

				count = count + 1;
			}
		}
		//add markers for each of the keys
		markersLayer = new L.LayerGroup();
		const neigh_Keys = Object.keys(neighborhoods);
		const crime_Keys = Object.keys(crimes);
		for(let i = 0; i < neigh_Keys.length; i ++)
		{
			lat = neighborhoods[neigh_Keys[i]]['lat'];
			lon = neighborhoods[neigh_Keys[i]]['lon'];
			crimes_num = crimes[neigh_Keys[i]];

			var list = "<dl><dt>Neighborhood</dt>" + "<dd>" + neigh_Keys[i] + "</dd>" + "<dt>Crimes</dt>" + "<dd>" + crimes_num + "</dd>"
			L.marker([lat,lon]).bindPopup(list).addTo(markersLayer);
		}

		map.addLayer(markersLayer);

		//check if the map has moved: 
		map.on('moveend',function(){

			var center = map.getCenter();
			var search_out = reverse + "lat=" + center['lat'] + "&lon=" + center['lng'] + "&addressdetails=1"; 
				
			$.getJSON(search_out, function(data) {
				app.search_text = data['display_name'];
			});

			app.search_text=center['lat'] + "," + center['lng'];
			var northWest = L.latLng(map.getBounds().getNorth(), map.getBounds().getWest());
			var southEast = L.latLng(map.getBounds().getSouth(), map.getBounds().getEast());
									
			var myBounds = L.latLngBounds(northWest,southEast);
			var visible_hold = [];	
			for(let i = 0; i < neigh_Keys.length; i ++)
			{
				var lat_two = neighborhoods[neigh_Keys[i]]['lat'];
				var lon_two = neighborhoods[neigh_Keys[i]]['lon'];
				if(myBounds.getNorth() < lat_two || myBounds.getSouth() > lat_two || myBounds.getEast() < lon_two || myBounds.getWest() > lon_two )
				{
									
				}
				else
				{
					visible_hold.push(neigh_Keys[i]);
				}
			}  
			setVisible(visible_hold);
		})
	});

} //getData()

