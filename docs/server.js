// Built-in Node.js modules
var fs = require('fs');
var path = require('path');
var cors = require('cors');

// NPM modules
var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var js2xmlparser = require('js2xmlparser');

var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname,'db','stpaul_crime.sqlite3');
console.log(db_filename);

var app = express();
var port = 8000;

// open stpaul_crime.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


//GET /codes
app.get('/codes',(req,res) =>{
	//use the url to check the specific extra elements:
	var url =req.url;
	var codes = new Object();
	var database_Promise = new Promise ((resolve,reject)=>{
		db.all('SELECT * FROM Codes ORDER BY code',(err,rows)=>{
			rows.forEach(function (row){
				//add the code as a new key and the incident type as a new value 
				let add = "C";

				//specific codes: 
				if(url.length > 6 && req.query.hasOwnProperty("code")){
						
					var select_code =  req.query.code.split(',');
					for(let i =0; i < select_code.length; i ++)
					{
						if(row.code == select_code[i])
						{
							codes[add.concat("",select_code[i])] = row.incident_type;
						}
					}
				} 
				//generic pull, all codes included 
				else{
					codes[add.concat("",row.code)] = row.incident_type;
				}
			})

			resolve(codes);
		});
	}) //database promise

	database_Promise.then(data=>{
		//check if the query string specifices the format type here (to be added later)
		if(req.query.hasOwnProperty("format"))
		{
			//to be edited with the xml stuff
			let xml  = js2xmlparser.parse("codes",codes);
			res.type('xml').send(xml);
		}
		else{
			res.type('json').send(codes);
		} 
	})
}); //app.get(codes)

//GET /neighborhoods
app.get('/neighborhoods',(req,res)=>{
	//url to check for the extra elements:
	var url = req.url;
	var neighborhoods = new Object();
	var database_Promise = new Promise ((resolve,reject) =>{
		db.all('SELECT * FROM Neighborhoods ORDER BY neighborhood_number',(err,rows)=>{
			rows.forEach(function(row){
				//string N to concatenate onto the front of the neighborhood:
				let add = "N";

				//specific neighborhood ids 
				if(url.length > 14 && req.query.hasOwnProperty("id"))
				{
					var select_id =  req.query.id.split(',');
					for(let i =0; i < select_id.length; i ++)
					{
						if(row.neighborhood_number == select_id[i])
						{
							neighborhoods[add.concat("",select_id[i])] = row.neighborhood_name;
						}
					} 
				} 

				//generic pull, all neighborhood ids 
				else
				{
					neighborhoods[add.concat("",row.neighborhood_number)] = row.neighborhood_name;
				}	
			})//rows.forEach()

			resolve(neighborhoods);
		});
	}) //database promise 

	database_Promise.then(data => {
		//check if the query string specifies the format type here
		let formatter = "json";

		if(req.query.hasOwnProperty("format"))
		{
			let xml  = js2xmlparser.parse("neighborhoods",neighborhoods);
			res.type('xml').send(xml);
		}
		else{
			res.type('json').send(neighborhoods);
		} 

	})

}); //app.get(Neighborhoods)

//GET /incidents
app.get('/incidents',(req,res)=>{
	//url to check for special formatters: 
	var url = req.url;
	var incidents = new Object();
	var neighborhoods = new Object();
	var neighborhood_Promise = new Promise((resolve, reject) =>{
		db.all('SELECT * FROM Neighborhoods ORDER BY neighborhood_number',(err,rows)=>{
			rows.forEach(function(row){
				neighborhoods[row.neighborhood_number] = row.neighborhood_name;
			})//rows.forEach()

			resolve(neighborhoods);
		});

	})

	neighborhood_Promise.then(data =>{
		var nested_neighborhood = data;
		const keys = Object.keys(nested_neighborhood);
		var database_Promise = new Promise ((resolve,reject) =>{
			db.all('SELECT * FROM Incidents ORDER BY case_number DESC LIMIT 10000',(err,rows)=>{
				
				//pulling everything from incidents, limiting it to 10000 values to output
				var count = 0;
				rows.forEach(function(row){
					let case_number = row.case_number;

					//date_time split by the T to have the date and time separately
					let date_time = row.date_time.split("T");	
					var name_hold; 

					for(let i =0; i < keys.length; i ++)
					{
						if(keys[i]== row.neighborhood_number)
						{
							name_hold = nested_neighborhood[keys[i]];
						}
					}

					incidents[case_number] = new Object();
					incidents[case_number]["date"] = date_time[0];
					incidents[case_number]["time"] = date_time[1];
					incidents[case_number]["code"] = row.code;
					incidents[case_number]["incident"] = row.incident;
					incidents[case_number]["police_grid"] = row.police_grid;
					incidents[case_number]["neighborhood_name"] = name_hold;
					incidents[case_number]["block"] = row.block;
				})

				resolve(incidents);
			});
		})//database Promise 
		database_Promise.then(data =>{

			//check if the query string specifies the format type 
			if(req.query.hasOwnProperty("format"))
			{
				let xml  = js2xmlparser.parse("incidents",incidents);
				res.type('xml').send(xml);
			}
			else
			{
				res.type('json').send(incidents);
			} 
		})
	})
		

}); //app.get(Incidents)

//PUT /new-incident
app.put('/new-incident',(req,res)=>{

	var new_incident = new Object();
	var new_casenum = parseInt(req.body.case_number,10);
	//var copy_casenum = new_casenum;
	var date = req.body.date
	var time = req.body.time;

	var new_code = parseInt(req.body.code,10);
	var new_incident_type = req.body.incident;
	var new_grid = parseInt(req.body.police_grid,10);
	var new_neighborhood = parseInt(req.body.neighborhood_number,10);
	var new_block = req.body.block;

	new_datetime = date.concat("T",time);

	var incident_pull = new Promise((resolve,reject) =>{
		var incidents = new Object ();
		db.all('SELECT * FROM Incidents ORDER BY case_number DESC',(err,rows)=>{
			rows.forEach(function(row){

				let add = "I"; 
				let case_number = add.concat("",row.case_number);
				//date_time split by the T to have the date and time separately
				let date_time = row.date_time.split("T");	

				//error checking for a pre-existing case number trying to be inserted: 
				if(new_casenum == row.case_number)
				{
					reject(new_casenum);
				}

				incidents[case_number] = new Object();
				incidents[case_number]["date"] = date_time[0];
				incidents[case_number]["time"] = date_time[1];
				incidents[case_number]["code"] = row.code;
				incidents[case_number]["incident"] = row.incident;
				incidents[case_number]["police_grid"] = row.police_grid;
				incidents[case_number]["neighborhood_number"] = row.neighborhood_number;
				incidents[case_number]["block"] = row.block;

			})

			resolve(incidents);
		})
	});
	//we've already checked the casenumber, now insert into the table:
	incident_pull.then(data =>{

		var pull_Promise = new Promise((resolve,reject) =>{
			db.run('INSERT INTO Incidents(case_number,date_time,code,incident,police_grid,neighborhood_number,block) VALUES(?,?,?,?,?,?,?)', [new_casenum,new_datetime,new_code,new_incident_type,new_grid,new_neighborhood,new_block],function(err){
			//check if there is already a case number that matches the one to be inserted in the db
				if(err)
				{
					res.writeHead(404, {'Content-Type': 'text/plain'});
    				res.write('Error: could not write to database\n');
    				res.end();
				}	

				else{
					res.writeHead(200,{'Content-Type': 'text/plain'});
    				res.write('Input successful!\n');
    				res.end();
				}
	
			});//db run

		})

	}).catch((err)=>{
		FoundMatchingCasenum(res,new_casenum);
	});


});//app.PUT

function FoundMatchingCasenum(res, number)
{
	res.writeHead(500, {'Content-Type': 'text/plain'});
	res.write('Error: case number already within database: ' + number + "\n");
	res.end();
}

var server = app.listen(port);
