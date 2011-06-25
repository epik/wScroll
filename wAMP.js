/***********************************
 * wAMP() - Handler Object for the Plugin
 *
 * This object is designed to handle interfacing with the plugin.
 *	because of the way Luna handles hybrid apps, it cannot just
 *	be set it and forget it at this point.  But it is meant to be
 *	as close as possible to that.
 ************************************/
 
 var Mojo = new Object;
 
// Stupid javascript for not having constants stuff
var LIST_TYPE_FF		= true;
var LIST_TYPE_INDEX 	= false;

// these are the status of the index
var INDEX_FINISHED 		= 0;
var INDEX_FAILED_LOAD 	= 3;

var PLAY_MODE_NORMAL 	= 0;
var PLAY_MODE_REPEAT 	= 1;
var PLAY_MODE_SHUFFLE 	= 2;

var PLAYLIST_POS_END 	= -1;
var PLAYLIST_POS_NEXT 	= -2;

var CURRENT_PLAYLIST_PLNAME = "Now Playing"

// Fast implementation for array unique
//	modified to select for the particular song property
UniqueArray = function(array, strProp) 
{
	if (strProp)
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1)
		{
			try
			{
				o[array[i][strProp].toLowerCase()] = array[i];
			} catch(e) {console.log("Issue with unique: " + strProp);}
		}
        for(i in o)
		{	
			var obj = new Object();
			obj = o[i];
			r.push(obj);
		}
        return r;
	}
	else
	{
		r = new Array();
		var o = {}, i, l = array.length;
        for(i=0; i<l;i+=1)
		{
			try
			{
				o[array[i].toLowerCase()] = array[i];
			} catch (e) {}
		}
        for(i in o)
		{
			var obj = new Object();
			obj = o[i];
			r.push(obj);
		}
        return r;
	}
};

isArray = function(obj) 
{
	return obj.constructor == Array;
};

/*******************************
 * Sort the song list by the specified property
 *******************************/
SortArray = function(arraySongs)
{
	var newArray = arraySongs.slice(0);

	newArray.sort(function(a, b)
					{
						var strA;
						var strB;
						
						try
						{
							strA=a.toLowerCase();
						} catch(e) {return 1;};
						
						try
						{
							strB=b.toLowerCase();
						} catch(e) {return -1;};
						
						// Make sure the Unknown Tag is last
						if (strA == '[unknown]')
							return 1;
						if (strB == '[unknown]')
							return -1;
						
						if (strA < strB) //sort string ascending
							return -1;
						if (strA > strB)
							return 1;
						return 0; //default return value (no sorting)
					});
	
	return newArray;
};

SortArrayByParam = function(arraySongs, strParam, bCaseSensative)
{
	var newArray = arraySongs.slice(0);

	newArray.sort(function(a, b)
					{
						var strA;
						var strB;
						
						if (bCaseSensative)
						{
							strA=a[strParam]; 
							strB=b[strParam];						
						}
						else
						{
							try
							{
								strA=a[strParam].toLowerCase();
							} catch(e) {return 1;};
							
							try
							{
								strB=b[strParam].toLowerCase();
							} catch(e) {return -1;};
						}
						
						// Make sure the Unknown Tag is last
						if (strA == '[unknown]')
							return 1;
						if (strB == '[unknown]')
							return -1;
						
						if (strA < strB) //sort string ascending
							return -1;
						if (strA > strB)
							return 1;
						return 0; //default return value (no sorting)
					});
	
	return newArray;
};

/*******************************
 * This returns a filtered list based on the
 *	the property we are filtering, and the filter string
 *******************************/
filterSongs = function(arraySongs, strProp, strValue)
 {

	var funcFilter = function (x)
	{
		return (x[strProp] == strValue);
	};
	
	return arraySongs.filter(funcFilter);
 }

String.prototype.capitalize = function() 
{
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.getFirstLetter = function()
{
	return this.charAt(0).toUpperCase();
}

String.prototype.getSecondLetter = function()
{
	return this.charAt(1).toUpperCase();
}


/***************************
 * Call a Palm Service
 ***************************/
function CallPalmService(strService, 
						 objParam, 
						 subscribe, 
						 funcCallback, 
						 funcError,
						 funcFakeIt)
{
	if (window.PalmSystem) 
	{
		//console.log("Calling System Service: " + strService);
	
		var reqObject = new PalmServiceBridge();
		
		if (subscribe)
			objParam.subscribe = true;
		else
		{
			if (objParam.subscribe)
			{
				objParam.subscribe = null;
				delete objParam.subscribe;
			}
		}
		
		objParam.$activity = {
			activityId: window.PalmSystem.activityId
		};

		objParam = JSON.stringify(objParam);
		reqObject.onservicecallback = function(status) 
		{
			try
			{
				status = JSON.parse(status);
				//console.log(JSON.stringify(status));
			}
			catch(e) 
			{
				if (funcError)
					funcError(e);
				else
					console.log(e);
				return;
			};
			
			if (funcError)
			{
				if (status.errorCode || status.returnValue == false)
				{
					funcError(status);
					return;
				}
			}
			
			if (funcCallback)
				funcCallback(status);
		};
		try
		{
			reqObject.call(strService, objParam);
		} catch(e) {console.log("Call Serv Err:" + e);}
	}
	else
	{
		if (funcFakeIt)
			setTimeout(funcFakeIt(), 500);
	}
}


/********************************
 * Options class
 ********************************/
// constants for options database
var OPT_ID_SKIN = 1;
var OPT_ID_BASS = 2;
var OPT_ID_TREB = 3;
var OPT_ID_TRANS = 4;
var OPT_ID_HEADPHONE_IN = 5;
var OPT_ID_HEADPHONE_OUT = 6;
var OPT_ID_MID = 7;

var ORIENTATION_UNLOCKED 	= 0;
var ORIENTATION_PORTRAIT 	= 1;
var ORIENTATION_LANDSCAPE	= 2;

var BACK_PICTURE = -1;

var iLastFMCheckCount = 0;

var objOptions = 
{

	optUseBreadC: true,
	dbOptions: 0,
	fBass: 0.5,
	fTreble: 0.5,
	fMid: 0.5,
	bOptVis: false,
	iOrientationMode: ORIENTATION_UNLOCKED,
	skinNum: 0,
	skinOldSkin: 0,
	fSongTransition: 0.0,
	iPauseOnHOut: 1,
	iPlayOnHIn: 0,
	iFinishedLoadingDB: 0,
	funcRestDefCB: 0,
	
	Init: function()
	{
	
		var btnClose = $('#btnCloseOptions');
		var btnSwitchTheme = $('#btnSwitchColor');
		var btnBGTheme = $('#btnUseBG');
		var btnRedoIndex = $('#btnReindex');
		var btnHdpnOutOp = $('#btnPauseOnHPOut');
		var btnHdpnInOp = $('#btnPlayOnHPIn');
		var btnRestoreDefaults = $('#btnRestoreDefaults');							
		
		btnClose.click(function() {$('body div.classOptions').hide(200);});
		btnSwitchTheme.click(function() 
		{
			objOptions.PickNextSkin();
		});
		btnRestoreDefaults.click(function() 
		{
			objOptions.ClearUserData();
		});
		
		btnRedoIndex.click(function() {objOptions.RerunIndex();});
		btnHdpnOutOp.click(function()
		{
			objOptions.iPauseOnHOut = !(objOptions.iPauseOnHOut);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_OUT,
									Number(objOptions.iPauseOnHOut).toString());
			btnHdpnOutOp.text('Pause On Headphone<br>Removal:' +
								((objOptions.iPauseOnHOut) ? "On" : "Off"));				
		});
		btnHdpnInOp.click(function()
		{
			objOptions.iPlayOnHIn = !(objOptions.iPlayOnHIn);
			objOptions.UpdateOption(OPT_ID_HEADPHONE_IN,
									Number(objOptions.iPlayOnHIn).toString());
			btnHdpnInOp.text('Resume On Headphone<br>In: ' +
								((objOptions.iPlayOnHIn) ? "On" : "Off"));				
		});
		btnBGTheme.click(function()
		{
			objOptions.SetBGImg();
		});
	},
	
	PickNextSkin: function()
	{

		$('#idPlayer').css('background-image', "");

		this.skinNum = ++this.skinNum % arraySkins.length;		
		
		this.UpdateOption(OPT_ID_SKIN, this.skinNum);
		this.SetSkin();
	},
	
	SetBGImg: function()
	{
		this.UpdateOption(OPT_ID_SKIN, "-1");
		
		var parameters = {
            "keys":["wallpaper"],
         	};
		
		CallPalmService("palm://com.palm.systemservice/getPreferences",
						parameters,
						false,
						function(responseData)
						{
							console.log(JSON.stringify(responseData));
			
							if (responseData.wallpaper)
							{
								$('#idPlayer').css('background-color', "");
								$('#idShowImgBG').css("background-image",
											  "url(file://" +
												responseData.wallpaper.wallpaperFile +
												")");
								$('#idShowImgBG').show(500);
							}
						},
						function(response)
						{
							console.log("Error setting BGimg:" + JSON.stringify(response));
						
							;
						},
						function()
						{
							$('#idPlayer').css('background-color', "");
							$('#idShowImgBG').css("background-image",
											  "url(file://../test.png)");
							$('#idShowImgBG').show();
						});

	},
	
	SetSkin: function()
	{
		$('#idPlayer').css('background-color', arraySkins[this.skinNum]);
	},
	
	GetDeviceInfo: function()
	{
		if (window.PalmSystem) 
		{
			var objDeviceInfo = JSON.parse(window.PalmSystem.deviceInfo);
		   
			if (objDeviceInfo.screenHeight < 470)
			{
				$('body').addClass("classVeer");
			}
			else if (objDeviceInfo.screenHeight < 490)
			{
				$('body').addClass("classPre");
			}
			else if (objDeviceInfo.screenWidth < 500)
			{
				$('body').addClass("classPreThree");
			}
			else
			{
				$('body').addClass("classTouchPad");
			}
		}
		
		//$('body').addClass("classVeer");
	},
		
	GetOrientation: function()
	{
		if (this.iOrientationMode == ORIENTATION_PORTRAIT)
			return "portrait";
		else if (this.iOrientationMode == ORIENTATION_LANDSCAPE)
			return "landscape";
		else
		{
			var strCurOrientation = "landscape";
			if (window.PalmSystem)
			{
				strCurOrientation = window.PalmSystem.screenOrientation;
			
				if (strCurOrientation == "up" || strCurOrientation == "down")
					return "landscape";
				else if (strCurOrientation == "left" || strCurOrientation == "right")
					return "portrait";
				else 	if (window.innerWidth > 840)
					return "landscape";
				else
					return "portrait";
			}
			else
			{
				if (window.innerWidth > 840)
					return "landscape";
				else
					return "portrait";
			}
		}
	},
	
	AddImageCallBack: function(objSong, strThm, strSmall, strLarge)
	{
		var me = this;
				
		if (!(strSmall) || (strSmall == ""))
		{
			this.strBackground = "";
		}
		
		var objParam = 
		{
			target: strThm,
			mime: "image/png",
			targetDir : "/media/internal/audiophile",
			targetFilename : objSong.hash + objSong.name + "_thm.png",
			keepFilenameOnRedirect: false,	
		};
		
		CallPalmService('palm://com.palm.downloadmanager/download', 
						objParam, 
						true, 
						function(response)
						{
							
							if (!response.completed)
								return;
							
							objSongIndex.SetImageThm(objSong, response.target);
							
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgThm = ? " +
											   "WHERE album = ? AND artist = ?", 
												[response.target, objSong.album, objSong.artist]);
							});						
						}, 
						function(error) 
						{
							console.log("Problem DLing Thumb from Last.fm");
							objSongIndex.NoImageError(objSong);
						},
						function()
						{
							console.log(strThm);
							
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgThm = ? " +
											   "WHERE album = ? AND artist = ?", 
												[strThm, objSong.album, objSong.artist]);
							});	
						});
						
		objParam = 
		{
			target: strSmall,
			mime: "image/png",
			targetDir : "/media/internal/audiophile",
			targetFilename : objSong.hash + objSong.name + "_sm.png",
			keepFilenameOnRedirect: false,	
		};
		
		CallPalmService('palm://com.palm.downloadmanager/download', 
						objParam, 
						true, 
						function(response)
						{
							
							if (!response.completed)
								return;
							
							objSongIndex.SetImageThm(objSong, response.target);
							
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgSmall = ? " +
											   "WHERE album = ? AND artist = ?", 
												[response.target, objSong.album, objSong.artist]);
							});						
						}, 
						function(error) 
						{
							console.log("Problem DLing Thumb from Last.fm");
							objSongIndex.NoImageError(objSong);
						},
						function()
						{
							console.log(strSmall);
						
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgSmall = ? " +
											   "WHERE album = ? AND artist = ?", 
												[strSmall, objSong.album, objSong.artist]);
							});	
						});
		
		objParam = 
		{
			target: strLarge,
			mime: "image/png",
			targetDir : "/media/internal/audiophile",
			targetFilename : objSong.hash + objSong.name + "_lg.png",
			keepFilenameOnRedirect: false,	
		};
		
		CallPalmService('palm://com.palm.downloadmanager/download', 
						objParam, 
						true, 
						function(response)
						{
							
							if (!response.completed)
								return;
							
							objSongIndex.SetImageThm(objSong, response.target);
							
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgLarge = ? " +
											   "WHERE album = ? AND artist = ?", 
												[response.target, objSong.album, objSong.artist]);
							});						
						}, 
						function(error) 
						{
							console.log("Problem DLing Thumb from Last.fm");
							objSongIndex.NoImageError(objSong);
						},
						function()
						{
							console.log(strSmall);
						
							objOptions.dbOptions.transaction(function (sql) 
							{  
								sql.executeSql("UPDATE 'audio_img_cache' SET imgLarge = ? " +
											   "WHERE album = ? AND artist = ?", 
												[strLarge, objSong.album, objSong.artist]);
							});	
						});
	
	},
	
	CheckDBForImg: function(objSong, bDontCheckLastFM)
	{
		this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("SELECT * FROM 'audio_img_cache' WHERE album = ? AND artist = ?", 
						   [objSong.album, objSong.artist],
						   function(transaction, results) 
						   {
								var iNumEntries = results.rows.length;
								
								if (!iNumEntries)
								{
									if (bDontCheckLastFM)
										return;
								
									objOptions.dbOptions.transaction(function(sql) 
									{
										sql.executeSql("INSERT OR REPLACE INTO " +
												"'audio_img_cache' (album, artist) VALUES (?, ?)", 
												[objSong.album, objSong.artist]);
									});
									
									var me = this;
	
									/* Create a cache object */
									var cache = new LastFMCache();

									/* Create a LastFM object */
									var lastfm = new LastFM({
										apiKey    : '03164f37686e29a8af8c368071204b8a',
										apiSecret : 'fd6eb5357b415ead8c67793edfb6dd1b',
										cache     : cache
									});

									console.log("Checking Last.fm: " + iLastFMCheckCount++);
									
									/* Load some artist info. */
									lastfm.album.getInfo({artist: objSong.artist, 
														  album: objSong.album}, 
											{success: 
												function(data){
													console.log("Callback returned");
													objOptions.AddImageCallBack(objSong,
																	data.album.image[0]["#text"],
																	data.album.image[1]["#text"],
																	data.album.image[2]["#text"]);
												}, 
											error: function(code, message){
													console.log("Last.fm Error, no image:" +
																 message);
													objSongIndex.NoImageError(objSong);
												}
											});
								}
								else
								{
									var row = results.rows.item(0);
								
									//console.log("Should get here the second time");
								
									objSongIndex.SetImageThm(objSong, row['imgThm']);
									objSongIndex.SetImageSmall(objSong, row['imgSmall']);
									objSongIndex.SetImageLarge(objSong, row['imgLarge']);
								}
							},
							function(trans, error) 
							{
								console.log("Error getting artwork from DB':" + error);
								objSongIndex.NoImageError(objSong);
							}
						);
		});
	},
	
	ClearUserData: function()
	{
		this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("DROP TABLE 'audio_img_cache'");
			sql.executeSql("DROP TABLE 'audio_opt'");
			sql.executeSql("CREATE TABLE 'audio_opt' " +
								"(optID INTEGER PRIMARY KEY, val TEXT)",
						   []);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TRANS, "0.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_OUT, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_IN, "0"],
							function()
							{
								objOptions.iFinishedLoadingDB = 1;
							});		
		});
		this.skinOldSkin = this.skinNum;
		objOptions.skinNum = 0;
		objOptions.SetSkin();
		objOptions.fBass = 0.5;
		objwAMP.SetBass(objOptions.fBass);
		objOptions.fTreble = 0.0;
		objwAMP.SetTreble(objOptions.fTreble);
		objOptions.fSongTransition = 0.0;
		objwAMP.SetSongTransition(objOptions.fSongTransition);
		objOptions.iPauseOnHOut = 1;
		objOptions.iPlayOnHIn = 0;
									
		if (objOptions.funcRestDefCB)
			objOptions.funcRestDefCB();
	},
	
	RegisterRestoreDefaultCB: function(funcRestDefCB)
	{
		objOptions.funcRestDefCB = funcRestDefCB;
	},
	
	LoadDatabase: function()
	{
		this.dbOptions = openDatabase('wAMPdb', 
								 '1.0' /*version*/, 
								 'database for storing user settings', 
								 65536 /*max size*/);

		//this.ClearImgDB();
								 
								 
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_opt' " +
								"(optID INTEGER PRIMARY KEY, val TEXT)",
						   [],
						   function() {console.log("Created/Checked 'audio_opt DB'");},
						   function(trans, error) 
						   {
								console.log("Error creating/checking 'audio_opt DB':" + 
											error);
						   }
						);
		});
		
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_img_cache' " +
							"(album TEXT, artist TEXT, imgThm TEXT, imgSmall TEXT, imgLarge TEXT)",
						   [],
						   function() {console.log("Created/Checked 'audio_img_cache DB'");},
						   function(trans, error) 
						   {
								console.log("Error creating/checking 'audio_img_cache DB':" + 
											error);
						   }
						);
		});

		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("CREATE TABLE IF NOT EXISTS 'audio_cur_song' " +
							"(name TEXT, desc TEXT, startIndex INTEGER, " +
							"curPos INTEGER, jsonPL BLOB)",
						   [],
						   function() 
						   {console.log("Created/Checked 'audio_img_cache DB'");},
						   function(trans, error) 
						   {
								console.log("Error creating/checking 'PL DB':" + error);
						   }
						);
						
			sql.executeSql("SELECT * FROM 'audio_cur_song' WHERE name = ?", 
					[CURRENT_PLAYLIST_PLNAME],
					function(transaction, results) 
					{
							
						var iNumEntries = results.rows.length;
											
						if (!iNumEntries)
						{
							sql.executeSql("INSERT OR REPLACE INTO " +
									"'audio_cur_song' (name, desc, startIndex, " +
									"curPos, jsonPL) VALUES (?, 'Current Playlist', " +
									"0, 0, '[]')", 
							[CURRENT_PLAYLIST_PLNAME],
							function(result) {/*console.log("Test" + result);*/},
							function(sql, error) {
								console.log("Error:" + error.message);
							});
						}
						else if (iNumEntries > 1)
						{
							console.log('TODO: fix');
						}
						else
						{
							try
							{
								var row = results.rows.item(0);
						
								var iIndex = row['startIndex'];
								var iPos = row['curPos'];
								var strPL = row['jsonPL'];
							
								var arrayPL = JSON.parse(strPL);
								objwAMP.BufferPL(iIndex, iPos, arrayPL);
							}
							catch (e) {console.log(e);}
								
						} 
					},
					function(sql, error) {
						console.log("Error:" + error.message);
					});
		});

		this.dbOptions.transaction(function(sql) 
		{
			sql.executeSql("SELECT * FROM 'audio_opt'", 
						   [],
						   function(transaction, results) 
						   {
								var iNumEntries = 
											results.rows.length;
											
								if (!iNumEntries)
									objOptions.SetDefaults();
								else
								{
								
									for (var i=0; i<iNumEntries; i++)
									{
										var row = results.rows.item(i);
										
										switch (row['optID'])
										{
										case OPT_ID_SKIN:
											objOptions.skinNum = Number(row['val']);
											if (objOptions.skinNum == -1)
												objOptions.SetBGImg();
											else
												objOptions.SetSkin();
											break;
										case OPT_ID_BASS:
											objOptions.fBass = Number(row['val']);
											objwAMP.SetBass(objOptions.fBass);
											break;
										case OPT_ID_TREB:
											objOptions.fTreble = Number(row['val']);
											objwAMP.SetTreble(objOptions.fTreble);
											break;
										case OPT_ID_MID:
											objOptions.fMid = Number(row['val']);
											objwAMP.SetMid(objOptions.fTreble);
											break;
										case OPT_ID_TRANS:
											objOptions.fSongTransition = Number(row['val']);
											objwAMP.SetSongTransition(objOptions.fSongTransition);
											break;
										case OPT_ID_HEADPHONE_OUT:
											objOptions.iPauseOnHOut = Number(row['val']);
											break;
										case OPT_ID_HEADPHONE_IN:
											objOptions.iPlayOnHIn = Number(row['val']);
											break;										
										}
									}

									objOptions.iFinishedLoadingDB = 1;
									
								}	
							},
							function(transaction, error) 
							{
								console.log("Could not read: " + error.message);
							});
		});

	},
	
	SetDefaults: function()
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_SKIN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_BASS, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TREB, "0.5"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_TRANS, "0.0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_OUT, "1"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_HEADPHONE_IN, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_CUR_TIME, "0"]);
			sql.executeSql("INSERT INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
							[OPT_ID_CUR_PL_INDEX, "0"],
							function()
							{
								objOptions.iFinishedLoadingDB = 1;
							});					
		});
	},

	UpdateOption: function(id, strVal)
	{
		this.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("INSERT OR REPLACE INTO 'audio_opt' (optID,val) VALUES (?, ?)", 
						   [id, strVal],
						   function(result) {/*console.log("Test" + result);*/},
						   function(sql, error) {
								console.log("Error:" + error.message);
						   });
		});
	},
		
	Draw: function()
	{			
		$('#idOptions').show(200);	
	},
	
	RerunIndex: function()
	{	
		this.Close();
		
		objwAMP.RedoIndexer();
		$('#idButtonGoesHere').unbind();
		$('#idButtonGoesHere').hide();		
		
		$('#idTellUser').html("Please wait while the indexer is rerun.<br> " +
								  "Once it has finished the app will go back" +
								  " to the indexer.");
	
		var strCurrentScene = '#' + $('.classShowPage').get(0).id;
	
		$('#idButtonGoesHere').removeClass();
		$('#idButtonGoesHere').addClass(objSkin.theme[objSkin.skinNum].dialog.btntheme);
		
		$('#idButtonGoesHere span').text("Re-Index Finished");
	
		$('#idButtonGoesHere').click(function () 
		{
			ChangePage($(strCurrentScene));
		});
	
		ChangePage($('#idDialog'));
	
	},
	
	Close: function()
	{
		this.bOptVis = false;
	
		$('#idModelBack').remove();
		$('#idMainBack').remove();
	}
};

function LiObject(strHash, strText)
{
	this.IdHash = strHash;
	this.DisplayText = strText;
}

var IN_INDEX_ONLY = 1;
var IN_INDEX_BOTH = 2;

function ArtAlbVisit(strArtist, strAlbum)
{
	this.strArtist = strArtist;
	this.strAlbum = strAlbum;

	this.CheckEqual = function(objArtAlb)
	{
		return (this.strArtist.toLowerCase() == 
						objArtAlb.strArtist.toLowerCase()) && 
				(this.strAlbum.toLowerCase() == 
						objArtAlb.strAlbum.toLowerCase());
	}
}

var objSongIndex =
{
	// Var to store the original index
	arrayIndex: new Array(),
	
	// Need to define these for now until we fix the non-WebOS version
	arrayGenres: 0,
	arrayArtists: 0,
	arrayAlbums: 0,
	arrayTitles: 0,
	arrayPLs: 0,
	
	arrayVisitCheck: new Array(),
		
	bGotPermission: 0,
	iPermissionCheckCount: 0,
	bNoMediaIndexer: 0,
	
	
	Init: function(arrayRawPaths, funcGood, funcError)
	{
		objSongIndex.arrayRawPaths = arrayRawPaths;
		objSongIndex.funcGood = funcGood;
		objSongIndex.funcError = funcError;
		
		var parameters = {
            query: {
                from: 'com.epik.pathindex:1',
            }
        };
	
		CallPalmService('palm://com.palm.db/find', 
						parameters,
						false,
						function(response)
						{
							//console.log("GetPreSong Output: " + JSON.stringify(response)); 
							
							var arrayCurFiles = response.results;
							objSongIndex.GetPreSongs(arrayCurFiles);
						},
						0,
						function()
						{
							objSongIndex.GetPreSongs(new Array());
						});
	},
	
	NoImageError: function(objSong)
	{
		objSong.imgSmall = "res/player/noimgsm.png";
		objSong.imgThumb = "res/player/noimgthm.png";
		objSong.imgLarge = "res/player/spinimg.png";
	},
	
	SetImageThm: function(objSong, strThm)
	{
		if (!strThm)
			objSong.imgThumb = "res/player/noimgthm.png";
		else
			objSong.imgThumb = strThm;
	},
	
	SetImageSmall: function(objSong, strSmall)
	{
		if (!strSmall)
			objSong.imgSmall = "res/player/noimgsm.png"; 
		else
			objSong.imgSmall = strSmall;
	},
	
	SetImageLarge: function(objSong, strLarge)
	{
		if (!strLarge)
			objSong.imgLarge = "res/player/spinimg.png"; 
		else
			objSong.imgLarge = strLarge;
	},
	
	FinishSearchIndex: function()
	{	
		console.log("Starting Finish Index");
		
		var arraySearchIndex = new Array();
	
		console.log("About to deal with arrayGenres");
	
		objSongIndex.arrayGenres = SortArrayByParam(objSongIndex.arrayGenres,
													"genre",
													true);
		objSongIndex.arrayGenres = UniqueArray(objSongIndex.arrayGenres,
												 "genre");										  
		for (var i=0; i<objSongIndex.arrayGenres.length; i++)
		{
			objSongIndex.arrayGenres[i].keyword = 
									objSongIndex.arrayGenres[i].genre;
			objSongIndex.arrayGenres[i].desc = "";
			arraySearchIndex.push(objSongIndex.arrayGenres[i]);
			objSongIndex.arrayGenres[i] = 
									objSongIndex.arrayGenres[i].genre;
		}
		objSongIndex.arrayGenres = SortArray(objSongIndex.arrayGenres);

		console.log("About to deal with arrayArtists");
		objSongIndex.arrayArtists = SortArrayByParam(objSongIndex.arrayArtists,
												  "artist",
												  true);
		objSongIndex.arrayArtists = UniqueArray(objSongIndex.arrayArtists,
												 "artist");	
		for (var i=0; i<objSongIndex.arrayArtists.length; i++)
		{
			objSongIndex.arrayArtists[i].keyword = 
									objSongIndex.arrayArtists[i].artist;
			objSongIndex.arrayArtists[i].desc = "(Genre: " + 
									objSongIndex.arrayArtists[i].genre +
									')';
			arraySearchIndex.push(objSongIndex.arrayArtists[i]);
			objSongIndex.arrayArtists[i] = 
									objSongIndex.arrayArtists[i].artist;
		}
		objSongIndex.arrayArtists = SortArray(objSongIndex.arrayArtists);
		
		console.log("About to deal with arrayAlbums");
		
		objSongIndex.arrayAlbums = UniqueArray(objSongIndex.arrayAlbums,
												"strUseForUnique");
		objSongIndex.arrayAlbums = SortArrayByParam(objSongIndex.arrayAlbums, "album");
		for (var i=0; i<objSongIndex.arrayAlbums.length; i++)
		{
			objSongIndex.arrayAlbums[i].keyword = 
									objSongIndex.arrayAlbums[i].album;
			objSongIndex.arrayAlbums[i].desc = "(Artist: " +
									objSongIndex.arrayAlbums[i].artist +
									" Genre: " + 
									objSongIndex.arrayAlbums[i].genre +
									')';
			arraySearchIndex.push(objSongIndex.arrayAlbums[i]);
		}
		
		console.log("About to deal with arrayTitles");
		
		arraySearchIndex = arraySearchIndex.concat(objSongIndex.arrayTitles);
		
		var i = arraySearchIndex.length;
		while(i--)
			arraySearchIndex[i]._kind = "com.epik.searchindex:1";
		
		console.log("About to do Just Type stuff");
		
		var delFunction = function()
		{
		
		var parameters = {"id":"com.epik.searchindex:1"};
		
		CallPalmService("palm://com.palm.db/delKind",
				parameters,
				false,
				function()
				{
					CallPalmService('palm://com.palm.db/putKind',
							objSongIndex.SearchSchema,
							false,
							function()
							{
								var permObj = [
								{
									"type":"db.kind",
									"object":"com.epik.searchindex:1",
									"caller":"com.palm.launcher",
									"operations":{"read":"allow"}
								}];
								
								parameters = {"permissions":permObj};
								
								CallPalmService("palm://com.palm.db/putPermissions",
										parameters,
										false,
										function(response)
										{
											parameters = {
												"objects": arraySearchIndex
											};
										
											CallPalmService('palm://com.palm.db/put', 
													parameters,
													false,
													function(response)
													{
														console
															.log("After put searchindex:" + 
															JSON.stringify(response));
													});
										});
								
							});	
				});
		
		}
		
		var parameters = { "ids": [objwAMP.objParam]}
	
		CallPalmService('palm://com.palm.db/get', 
						parameters,
						false,
						function(response)
						{							
							var arg = response.results;
							try
							{
								console.log("Response from get of JustType:" +
											JSON.stringify(response));
								paneSongList.objBufferedObj = arg[0];
								paneSongList.HandleJustType(paneSongList.objBufferedObj);
								delFunction();
							}
							catch (e) {console.log("Issue with JT:" + e);}
						});
		
		
		

		
		objSongIndex.arrayRawPaths = 0;
		objSongIndex.funcGood();
	},
	
	
	FinishedAddingSongs: function(response)
	{
	
		for (var i=0; i<response.results.length; i++)
		{
			objSongIndex.arrayIndex[i].idUID = response.results[i].id;
		}
			
		objSongIndex.arrayIndex = 
					objSongIndex.arrayIndex.concat(objSongIndex.arrayFound);
		objSongIndex.arrayIndex = 
					objSongIndex.arrayIndex.concat(objSongIndex.arrayNeedUpdate);
		
		objSongIndex.arrayAlbums = new Array();
		objSongIndex.arrayArtists = new Array();
		objSongIndex.arrayGenres = new Array();
		objSongIndex.arrayTitles = new Array();
		
		for (var i=0; i<objSongIndex.arrayIndex.length; i++)
		{
			var objAlbumEntry = new Object();
			objAlbumEntry.category = "Album: ";
			var objArtistEntry = new Object();
			objArtistEntry.category = "Artist: ";
			var objGenreEntry = new Object();
			objGenreEntry.category = "Genre: ";
			var objTitleEntry = new Object();
			objTitleEntry.category = "Title: ";
			
			objTitleEntry.keyword = objSongIndex.arrayIndex[i].title;
			
			if (objSongIndex.arrayIndex[i].album == "")
			{
				objSongIndex.arrayIndex[i].album = "[Unknown]";
			}
			objAlbumEntry.album = objSongIndex.arrayIndex[i].album;
			objTitleEntry.desc = "(Album: " +
									objSongIndex.arrayIndex[i].album;

			
			if (objSongIndex.arrayIndex[i].artist == "")
			{

				objSongIndex.arrayIndex[i].artist = "[Unknown]";
			}
			objAlbumEntry.artist = objSongIndex.arrayIndex[i].artist;
			objArtistEntry.artist = objSongIndex.arrayIndex[i].artist;
			objTitleEntry.desc += " Artist: " +
									objSongIndex.arrayIndex[i].artist;
			
			if (objSongIndex.arrayIndex[i].genre == "")
			{
				objSongIndex.arrayIndex[i].genre = "[Unknown]";
			}
			objGenreEntry.genre = objSongIndex.arrayIndex[i].genre;
			objAlbumEntry.genre = objSongIndex.arrayIndex[i].genre;
			objArtistEntry.genre = objSongIndex.arrayIndex[i].genre;
			objTitleEntry.desc += " Genre: " + 
								  objSongIndex.arrayIndex[i].genre +
								  ")";
				
			objAlbumEntry.strUseForUnique = objAlbumEntry.album + 
											'-' +
											objAlbumEntry.artist;
			
			objSongIndex.arrayAlbums.push(objAlbumEntry);
			objSongIndex.arrayArtists.push(objArtistEntry);
			objSongIndex.arrayGenres.push(objGenreEntry);
			objSongIndex.arrayTitles.push(objTitleEntry);
		}
		
		objSongIndex.FinishSearchIndex();
	},
	
	ExtractPreIndexData: function(arrayPreSongs)
	{	
		if (!objSongIndex.arrayRawPaths.length)
		{
			console.log("We need to implement this");
		}
		
		console.log("Entering ExtractPreIndexData");
		
		var j = objSongIndex.arrayNeedUpdate.length;
		while(j--)
		{
			console.log("Something needs updating");
		
			var objSong = objSongIndex.arrayNeedUpdate[j];
			var bFound = false;

			var i = arrayPreSongs.length;
			while(i--)
			{
				var objUpdate = new Object();

				if (objSong.path == arrayPreSongs[i].path)
				{
					bFound = true;
				
					try
					{
						var strJSON = objwAMP.GetMetadata(objSong.path);
						console.log("wAMP Meta:" + strJSON);
						objUpdate = JSON.parse(strJSON);
						for (var prop in objUpdate)
						{
							var propLC = prop.toLowerCase();
							objUpdate[propLC] = objUpdate[prop];
						}
						
						if (!objUpdate["artist"])
							objSong.artist = arrayPreSongs[i].artist;
						else
							objSong.artist = objUpdate["artist"];
						
						if (!objUpdate["album"])
							objSong.album = arrayPreSongs[i].album;
						else
							objSong.album = objUpdate["album"];
							
						if (!objUpdate["genre"])
							objSong.genre = arrayPreSongs[i].genre;
						else
							objSong.genre = objUpdate["genre"];						
						
						if (!objUpdate["title"])
						{
							if (!arrayPreSongs[i].title)
								objSong.title = objSong.name;
							else
								objSong.title = arrayPreSongs[i].title;
						}
						else
							objSong.title = objUpdate["title"];
						
						if (objUpdate["tracknumber"])
							objSong.track = objUpdate["tracknumber"];
						else if (!objUpdate["track"])
							objSong.track = arrayPreSongs[i].track.position;
						else
							objSong.track = objUpdate["track"];
						
						objSong.disc = arrayPreSongs[i].disc.position;
					}
					catch(e) 
					{   
						objSong.artist = arrayPreSongs[i].artist;
						objSong.album = arrayPreSongs[i].album;
						objSong.genre = arrayPreSongs[i].genre;
						if (!arrayPreSongs[i].title)
							objSong.title = objSong.name;
						else
							objSong.title = arrayPreSongs[i].title;
						objSong.track = arrayPreSongs[i].track.position;
						objSong.disc = arrayPreSongs[i].disc.position;
					};
					
					if (arrayPreSongs[i].thumbnails.length)
					{
						objSong.imgSmall = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":64:64:3";
						objSong.imgThumb = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":32:32:3";
						objSong.imgLarge = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":100:100:3";
					}
					else
					{						
						objSong.imgSmall = "res/player/noimgsm.png";
						objSong.imgThumb = "res/player/noimgthm.png";
						objSong.imgLarge = "res/player/spinimg.png";
					}
					
					break;
				}
			}
		
			if (!bFound)
			{
				try
				{
					var strJSON = objwAMP.GetMetadata(objSong.path);
					objUpdate = JSON.parse(strJSON);
					for (var prop in objUpdate)
					{
						var propLC = prop.toLowerCase();
						objUpdate[propLC] = objUpdate[prop];
					}
					
					objSong.artist = objUpdate["artist"];				
					objSong.album = objUpdate["album"];
					objSong.genre = objUpdate["genre"];						
					
					if (!objUpdate["title"])
						objSong.title = objSong.name;
					else
						objSong.title = objUpdate["title"];
					
					if (objUpdate["tracknumber"])
						objSong.track = objUpdate["tracknumber"];
					else
						objSong.track = objUpdate["track"];
						
					objSong.imgSmall = "res/player/noimgsm.png";
					objSong.imgThumb = "res/player/noimgthm.png";
					objSong.imgLarge = "res/player/spinimg.png";
				}
				catch(e) {console.log("No index getmeta error" + e); }; 
			}
		}
		
		var parameters = {
			"objects": objSongIndex.arrayNeedUpdate
		};
		
		CallPalmService('palm://com.palm.db/merge', 
						parameters,
						false,
						function(response)
						{
							console.log("Result of merge: " + JSON.stringify(response));
						});
		
		while(objSongIndex.arrayRawPaths.length)
		{
			var objSong = objSongIndex.arrayRawPaths.pop();
			
			//console.log("Starting with: " + objSong.path);
			
			if (objSong.found)
				continue;
			
			//console.log("Not found");
			
			objSong._kind = "com.epik.pathindex:1";

			var bFound = false;
			var bReject = false;
			
			for (var i=0; i<arrayPreSongs.length; i++)
			{
				if (arrayPreSongs[i].isRingtone)
					continue;
				
				if (objSong.path == arrayPreSongs[i].path)
				{
					bFound = true;

					objSong.title = 
								(arrayPreSongs[i].title) ? 
										arrayPreSongs[i].title :
										objSong.name;
					objSong.artist = arrayPreSongs[i].artist;
					objSong.album = arrayPreSongs[i].album;
					objSong.genre = arrayPreSongs[i].genre;
					objSong.track = arrayPreSongs[i].track.position;
					if (arrayPreSongs[i].thumbnails.length)
					{
						objSong.imgSmall = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":64:64:3";
						objSong.imgThumb = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":32:32:3";
						objSong.imgLarge = "/var/luna/data/extractfs" + 
								encodeURIComponent(arrayPreSongs[i].thumbnails[0].data) + 
								":100:100:3";
					}
					else
					{
						objSong.imgSmall = "res/player/noimgsm.png";
						objSong.imgThumb = "res/player/noimgthm.png";
						objSong.imgLarge = "res/player/spinimg.png";
						var objArtAlb = new ArtAlbVisit(objSong.artist, objSong.album);
						
						var bAlreadySearching = false;
					
						for (var x=0; x<objSongIndex.arrayVisitCheck.length; x++)
						{
							if (objArtAlb.CheckEqual(objSongIndex.arrayVisitCheck[x]))
							{
								bAlreadySearching = true;
								break;
							}
						}
						
						if (!bAlreadySearching)
						{
							objOptions.CheckDBForImg(objSong);
							objSongIndex.arrayVisitCheck.push(objArtAlb);
						}
						else
						{
							objOptions.CheckDBForImg(objSong, true);
						}
					}
					
					break;
				}
			}
			
			if (!bFound)
			{
				console.log("Have to go to FFMpeg for:" + objSong.path);
			
				try
				{
					var strJSON = objwAMP.GetMetadata(objSong.path);
					console.log("wAMP Meta New:" + strJSON);
					var objUpdate = JSON.parse(strJSON);
					for (var prop in objUpdate)
					{
						var propLC = prop.toLowerCase();
						objUpdate[propLC] = objUpdate[prop];
					}
					
					objSong.artist = objUpdate["artist"];				
					objSong.album = objUpdate["album"];
					objSong.genre = objUpdate["genre"];						
					
					if (!objUpdate["title"])
						objSong.title = objSong.name;
					else
						objSong.title = objUpdate["title"];
					
					if (objUpdate["tracknumber"])
						objSong.track = objUpdate["tracknumber"];
					else
						objSong.track = objUpdate["track"];
				
					objSong.imgSmall = "res/player/noimgsm.png";
					objSong.imgThumb = "res/player/noimgthm.png";
					objSong.imgLarge = "res/player/spinimg.png";
				}
				catch(e) 
				{
					objSong.title = objSong.name;
					objSong.artist = "";
					console.log("No index getmeta error" + e); 
				}; 
			}
			
			objSongIndex.arrayIndex.push(objSong);
		}
		
		parameters = {
			"objects": objSongIndex.arrayIndex
		};
	
		CallPalmService('palm://com.palm.db/put', 
						parameters,
						false,
						function(response)
						{
							console.log("Put new songs result:" + JSON.stringify(response));
							
							objSongIndex.FinishedAddingSongs(response);
						});
	},
	
	RequestMediaPermission: function()
	{
		//(strService, objParam, subscribe, funcCallback)
		var parameters = {
            rights: {
                read: [
					'com.palm.media.audio.file:1'
				]
            }
        };
		
		CallPalmService('palm://com.palm.mediapermissions/request', 
						parameters,
						false,
						function(response)
						{
							if (response.returnValue && response.isAllowed)
							{
								objSongIndex.bGotPermission = true;
								console.log("Permission granted");
							}
							else
							{
								console.log("No permission");
							}
						},
						null,
						function()
						{
							objSongIndex.bGotPermission = true;
						});
	},
	
	// To delete the indexes:
	// luna-send -n 1 -a com.epik.audiophile luna://com.palm.db/delKind '{"id":"com.epik.pathindex:1"}'
	// luna-send -n 1 -a com.epik.audiophile luna://com.palm.db/delKind '{"id":"com.epik.searchindex:1"}'
	
	DB8SetUp: function()
	{
		CallPalmService('palm://com.palm.db/putKind',
						objSongIndex.SongSchema,
						false);

						
		parameters = {
            query: {
                from: 'com.palm.media.audio.file:1',
                limit: 1
            }
        };
		
		CallPalmService('palm://com.palm.db/find', 
						parameters,
						false,
						function(response)
						{
							//console.log("Initial find result: " + JSON.stringify(response));
							if (response.errorCode || response.returnValue === false) 
							{
								console.log("We don't have permission yet");
								objSongIndex.RequestMediaPermission();
							}
							else
							{
								objSongIndex.bGotPermission = true;
								console.log("We have permission");
							}

						},
						null,
						function()
						{
							objSongIndex.RequestMediaPermission();
						});
	},
	
	GetPreSongs: function(arrayCurFiles)
	{	
		console.log("Polling permission");
	
		if (!objSongIndex.bGotPermission)
		{
			objSongIndex.iPermissionCheckCount++;
			if (objSongIndex.iPermissionCheckCount < 120)
			{
				setTimeout(function() {objSongIndex.GetPreSongs(arrayCurFiles);}, 500);
				return;
			}
			
			console.log("No luck with Indexer, maybe next time");
			objSongIndex.bNoMediaIndexer = true;
		}
	
		objSongIndex.arrayFound = new Array();
		objSongIndex.arrayNeedUpdate = new Array();
		objSongIndex.arrayDelete = new Array();
	
		while(arrayCurFiles.length)
		{
			var objSong = arrayCurFiles.pop();
		
			var j = objSongIndex.arrayRawPaths.length;
			var bFound = false;
			while (j--)
			{
				if ((objSongIndex.arrayRawPaths[j].hash ==
							objSong.hash) &&
					(objSongIndex.arrayRawPaths[j].name ==
							objSong.name))
				{
					if (objSongIndex.arrayRawPaths[j].lastmod ==
							objSong.lastmod)
					{
						objSongIndex.arrayFound.push(objSong);
					}
					else
					{
						objSongIndex.arrayNeedUpdate.push(objSong);
					}
					objSongIndex.arrayRawPaths[j].found = true;
					bFound = true;
					break;
				}
			}
			if (!bFound)
				objSongIndex.arrayDelete.push(objSong);
			
		}
		
		var idsToDelete = new Array(objSongIndex.arrayDelete.length);
		var i = objSongIndex.arrayDelete.length;
		console.log("*****LOOK HERE*****:" + JSON.stringify(objSongIndex.arrayFound[0]));
		while (i--)
			idsToDelete[i] = objSongIndex.arrayDelete[i]._id;
		
		var  parameters = { "ids": idsToDelete };
		
		CallPalmService('palm://com.palm.db/del', 
						parameters,
						function(response)
						{
							console.log("Del Output:" + JSON.stringify(response));
						});
		
		if (objSongIndex.bGotPermission)
		{
			parameters = {
				query: {
					from: 'com.palm.media.audio.file:1',
				}
			};
		
			CallPalmService('palm://com.palm.db/find', 
							parameters,
							false,
							function(response)
							{
								//console.log("GetPreSong Output: " + JSON.stringify(response)); 
								
								audiofiles = response.results;
								var i = 0;
								objSongIndex.ExtractPreIndexData(audiofiles);
							},
							0,
							function()
							{
								var Prep = function(strTitle, 
													strArtist, 
													strAlbum, 
													strGenre, 
													iTrack)
								{
									var objSong = new Object();
									
									objSong.title = strTitle;
									
									if (strArtist)
										objSong.artist = strArtist;
									else
										objSong.artist = '[Unknown]';
										
									if (strAlbum)
										objSong.album = strAlbum;
									else
										objSong.album = '[Unknown]';
									
									if (strGenre)
										objSong.genre = strGenre;
									else
										objSong.genre = '[Unknown]';
									objSong.track = iTrack;								
									
									objSongIndex.arrayIndex.push(objSong);
								};
								
								Prep("Rolling In The Deep", 
								"Adele", 
								"21", 
								"Pop", 
								1);
								Prep("Rumour Has It", 
								"Adele", 
								"21", 
								"Pop", 
								2);
								Prep("Turning Tables",
								"Adele",
								"21",
								"Pop",
								3);
								Prep("Don't You Remember",
								"Adele",
								"21",
								"Pop",
								4);
								Prep("Give Me Everything",
								"Pitbull Featuring Ne-Yo, AfroJack & Nayer",
								"Give Me Everything",
								"Dance",
								1);
								Prep("Home Is A Fire",
								"Death Cab for Cutie",
								"Codes and Keys",
								"Alternative Rock",
								1);
								Prep("Codes And Keys",
								"Death Cab for Cutie",
								"Codes and Keys",
								"Alternative Rock",
								2);
								Prep("Some Boys",
								"Death Cab for Cutie",
								"Codes and Keys",
								"Alternative Rock",
								3);
								Prep("What's The Matter Here?",
								"10,000 Maniacs",
								"In My Trib",
								"Alternative rock",
								1);
								Prep("E.T. (feat. Kanye West)",
								"Katy Perry",
								"E.T. (featuring Kanye West)",
								"Pop",
								1);
								Prep("Born This Way",
								"Lady Gaga",
								"Born This Way",
								"Pop",
								2);
								Prep("Howl",
								"Florence + The Machine",
								"Lungs",
								"Alternative Rock",
								4);
								Prep("Rabbit Heart (Raise It Up)",
								"Florence + The Machine",
								"Lungs",
								"Alternative Rock",
								2);
								Prep("Break Your Heart",
								"Taio Cruz",
								"Rokstarr",
								"Pop");
								Prep("Ice Ice Baby",
								"Vanilla Ice",
								0,
								"rap");
								Prep("I Want To Break Free",
								"Queen",
								"Greatest Hits",
								"rock");	
								Prep("The Simpsons theme");	
								Prep("Intro",
								"Queen",
								"Queen Rock Montreal",
								"Pop",
								1);
								Prep("We Will Rock You (Fast)",
								"Queen",
								"Queen Rock Montreal",
								"Pop",
								2);
								Prep("Under Pressure",
								"Queen",
								"Queen Rock Montreal",
								"Pop",
								1);
								Prep("Dynamite",
								"Taio Cruz",
								"Rokstarr",
								"Pop",
								1);
								Prep("Take Me Away",
								"Avril Lavigne",
								"Under My Skin",
								"Pop",
								1);
								Prep("Rock Steady",
								"Bad Company",
								"Bad Co",
								"Rock",
								3);
								Prep("Rock Steady",
								"Bad Company",
								"Bad Co",
								"Rock",
								3);
								Prep("Bad Company",
								"Bad Company",
								"Bad Co",
								"Rock",
								7);
								Prep("Make Love Last",
								"Bad English",
								"Backlash",
								"Rock",
								9);
								Prep("Surfer Girl",
								"Beach Boys, The",
								"Endless Summer",
								"Rock",
								2);
								Prep("Surfin' USA",
								"Beach Boys, The",
								"Endless Summer",
								"Rock",
								1);
								Prep("He's a Mighty Good Leader",
								"Beck",
								"One Foot In The Grave",
								"Folk",
								1);
								Prep("AAAAAAAAAAAAAAA AAAAAAAAAAA AAAAAAAAAAAA Angle Park",
								"BBBBBB BBBBBBBBBBBBB BBBB BBBB BBBB BBB BBB Big Country",
								"Wonderland",
								"Alternative",
								2);
								Prep("Bring It On",
								"Black Lab",
								"Your Body Above Me",
								"Alternative",
								11);
								Prep("Black Sabbath",
								"Black Sabbath",
								"black sabbath",
								"Hard Rock",
								1);
								Prep("Wizard",
								"Black Sabbath",
								"black sabbath",
								"Hard Rock",
								2);
								Prep("Pathetic",
								"blink 182",
								"Dude Ranch",
								"Punk Rock",
								1);
								Prep("Pretty Persuasion",
								"REM",
								"Reckoning",
								"Alternative",
								4);
								Prep("Dragula",
								"Rob Zombie",
								"Hellbilly Deluxe",
								"Metal",
								3);
								Prep("Too Rude",
								"Rolling Stones",
								"Dirty Work",
								"Rock",
								5);
								Prep("Rock Box",
								"Run-D.M.C.",
								"Run-D.M.C.",
								"Hip Hop",
								2);
								Prep("2112",
								"Rush",
								"2112",
								"Rock",
								1);
								Prep("Overture",
								"Rush",
								"2112",
								"Rock",
								2);
								Prep("A Passage To Bangkok",
								"Rush",
								"2112",
								"Rock",
								9);
								Prep("The Temples Of Syrinx",
								"Rush",
								"2112",
								"Rock",
								3);
								Prep("2112",
								"Rush",
								"2112",
								"Rock",
								1);
								Prep("Fly By Night",
								"Rush",
								"Fly By Night",
								"Rock",
								4);
								Prep("Bad Magick",
								"Godsmack",
								"Awake",
								"Nu Metal",
								4);
								Prep("Faceless",
								"Godsmac",
								"Faceless",
								"Nu Metal",
								2);
								Prep("Punk Rock Rules The Airwaves",
								"Green Day",
								"Maximum Green Day",
								"Punk Rock",
								1);
								Prep("Welcome To The Jungle",
								"Guns N Roses",
								"Appetite For Destruction",
								"Hard Rock",
								1);
								Prep("Paradise City",
								"Guns N Roses",
								"Appetite For Destruction",
								"Hard Rock",
								6);
								Prep("Sweet Child O'Mine",
								"Guns N Roses",
								"Appetite For Destruction",
								"Hard Rock",
								9);
								Prep("Going Home",
								"Kenny G",
								"Duotones",
								"Jazz",
								1);
								Prep("Cowboy",
								"Kid Rock",
								"Devil Without A Cause",
								"Rock/Rap",
								2);
								Prep("Detroit Rock City",
								"Kiss",
								"Destroyer",
								"Rock",
								1);
								Prep("Beth",
								"Kiss",
								"Destroyer",
								"Rock",
								8);
								Prep("King of the Night Time World",
								"Kiss",
								"Destroyer",
								"Rock",
								2);
								Prep("God of Thunder",
								"Kiss",
								"Destroyer",
								"Rock",
								3);
								Prep("Great Expectations",
								"Kiss",
								"Destroyer",
								"Rock",
								4);
								Prep("Flaming Youth",
								"Kiss",
								"Destroyer",
								"Rock",
								5);
								Prep("Sweet Pain",
								"Kiss",
								"Destroyer",
								"Rock",
								6);
								Prep("Shout it Out Loud",
								"Kiss",
								"Destroyer",
								"Rock",
								7);
								Prep("Do You Love Me",
								"Kiss",
								"Destroyer",
								"Rock",
								9);
								Prep("Fanfare (hidden track)",
								"Kiss",
								"Destroyer",
								"Rock",
								10);
								Prep("Did My Time",
								"Korn",
								"Take A Look In The Mirror",
								"Metal",
								6);
								Prep("Emotions",
								"Carey, Mariah",
								"Emotions",
								"Pop",
								1);
								Prep("Good Times Roll",
								"Cars, The",
								"Cars, The",
								"Rock",
								1);
								Prep("My Best Friend's Girl",
								"Cars, The",
								"Cars, The",
								"Rock",
								2);
								Prep("Dream Police",
								"Cheap Trick",
								"The Greatest Hits",
								"Rock",
								2);
								Prep("Surrender",
								"Cheap Trick",
								"The Greatest Hits",
								"Rock",
								9);
								Prep("speed of the sound",
								"Coldplay",
								"X&Y",
								"Rock",
								6);
								Prep("Simple",
								"Collective Soul",
								"Collective Soul",
								"Rock",
								1);
								Prep("Heavy",
								"Collective Soul",
								"Dosage",
								"Rock",
								2);
								Prep("TORN",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								1);
								Prep("MY OWN PRISON",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								2);
								Prep("WHATS THIS LIFE FOR",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								3);
								Prep("ONE",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								4);
								Prep("ARE YOU READY",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								5);
								Prep("HIGHER",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								6);
								Prep("WITH ARMS WIDE OPEN",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								7);
								Prep("WHAT IF",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								8);
								Prep("ONE LAST BREATH",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								9);
								Prep("ONE LAST BREATH",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								9);
								Prep("DON'T STOP DANCING",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								10);
								Prep("BULLETS",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								11);
								Prep("BULLETS",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								11);
								Prep("MY SACRIFICE",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								12);
								Prep("WEATHERED",
								"CREED",
								"GREATEST HITS",
								"ROCK",
								13);
								Prep("Born on the Bayou",
								"Creedence Clearwater Revival",
								"Bayou Country",
								"Classic Rock",
								1);
								Prep("Proud Mary",
								"Creedence Clearwater Revival",
								"Creedence Gold",
								"Classic Rock",
								1);
								Prep("Suzie Q",
								"Creedence Clearwater Revival",
								"Creedence Gold",
								"Classic Rock",
								8);
								Prep("Open Invitation",
								"Santana",
								"Inner Secrets",
								"Rock",
								2);
								Prep("Rock You Like A Hurricane",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								1);
								Prep("Can't Explain",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								2);
								Prep("Rhythm Of Love",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								3);
								Prep("Lovedrive",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								4);
								Prep("Is There Anybody There?",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								5);
								Prep("Holiday",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								6);
								Prep("Still Loving You",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								7);
								Prep("No One Like You",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								8);
								Prep("Another Piece of Meat",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								9);
								Prep("You Give Me All I Need",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								10);
								Prep("Hey You",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								11);
								Prep("The Zoo",
								"Scorpions",
								"Best Of Scorpions - Rockers 'n' Ballads",
								"Rock",
								12);
								Prep("Prison Song",
								"System Of A Down",
								"Toxicity",
								"Metal",
								1);
								Prep("Needles",
								"System Of A Down",
								"Toxicity",
								"Metal",
								2);
								Prep("Deer Dance",
								"System Of A Down",
								"Toxicity",
								"Metal",
								3);
								Prep("Jet Pilot",
								"System Of A Down",
								"Toxicity",
								"Metal",
								4);
								Prep("X",
								"System Of A Down",
								"Toxicity",
								"Metal",
								5);
								Prep("Chop Suey!",
								"System Of A Down",
								"Toxicity",
								"Metal",
								6);
								Prep("Bounce",
								"System Of A Down",
								"Toxicity",
								"Metal",
								7);
								Prep("Forest",
								"System Of A Down",
								"Toxicity",
								"Metal",
								8);
								Prep("ATWA",
								"System Of A Down",
								"Toxicity",
								"Metal",
								9);
								Prep("Science",
								"System Of A Down",
								"Toxicity",
								"Metal",
								10);
								Prep("Shimmy",
								"System Of A Down",
								"Toxicity",
								"Metal",
								11);
								Prep("Toxicity",
								"System Of A Down",
								"Toxicity",
								"Metal",
								12);
								Prep("Psycho",
								"System Of A Down",
								"Toxicity",
								"Metal",
								13);
								Prep("Aerials",
								"System Of A Down",
								"Toxicity",
								"Metal",
								14);
								Prep("Animals",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								1);
								Prep("Fight for All The Wrong Reasons",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								2);
								Prep("Photograph",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								3);
								Prep("Next Contestant",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								4);
								Prep("Savin' Me",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								5);
								Prep("Far Away",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								6);
								Prep("Someone That You're With",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								7);
								Prep("Follow You Home",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								8);
								Prep("Side Of A Bullet",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								9);
								Prep("If Everyone Cared",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								10);
								Prep("Rock Star",
								"Nickelback",
								"All The Right Reasons",
								"Alternative Metal",
								11);
								
								for (var k=0; k<objSongIndex.arrayIndex.length; k++)
								{
									var objSong = objSongIndex.arrayIndex[k];
								
									objSong.imgSmall = "res/player/noimgsm.png";
									objSong.imgThumb = "res/player/noimgthm.png";
									objSong.imgLarge = "res/player/spinimg.png";
									var objArtAlb = new ArtAlbVisit(objSong.artist, objSong.album);
									
									var bAlreadySearching = false;
								
									for (var x=0; x<objSongIndex.arrayVisitCheck.length; x++)
									{
										if (objArtAlb.CheckEqual(objSongIndex.arrayVisitCheck[x]))
										{
											bAlreadySearching = true;
											break;
										}
									}
									
									if (!bAlreadySearching)
									{
										objOptions.CheckDBForImg(objSong);
										objSongIndex.arrayVisitCheck.push(objArtAlb);
									}
									else
									{
										objOptions.CheckDBForImg(objSong, true);
									}
								}
								
								var response = new Object();
								response.results = objSongIndex.arrayIndex;
								
								objSongIndex.FinishedAddingSongs(response);
							});
		}
		else
			objSongIndex.ExtractPreIndexData();
	},

	PlayAll: function()
	{
		objwAMP.SetPlaylist(this.arrayIndex);
	},
	
	SaveCurPlaylist: function()
	{
		var strPL = JSON.stringify(objwAMP.GetPlaylist());
	
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET jsonPL = ? " +
							"WHERE name = ?", 
							[strPL, CURRENT_PLAYLIST_PLNAME]);
		});
	},
	
	SaveCurPos: function(iCurPos)
	{
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET curPos = ? " +
							"WHERE name = ?", 
							[iCurPos, CURRENT_PLAYLIST_PLNAME]);
		});	
	},
	
	SaveCurIndex: function(iIndex)
	{
		objOptions.dbOptions.transaction(function (sql) 
		{  
			sql.executeSql("UPDATE 'audio_cur_song' SET startIndex = ? " +
							"WHERE name = ?", 
							[iIndex, CURRENT_PLAYLIST_PLNAME]);
		});	
	
	},


	SongSchema: {
    "id": "com.epik.pathindex:1",
    "owner": "com.epik.audiophile",
	"indexes": [
		{
            "name": "hash",
            "props": [
                {
                    "name": "hash" 
                } 
            ] 
        },
		{
            "name": "path",
            "props": [
                {
                    "name": "path" 
                } 
            ] 
        }
	]},
	
	SearchSchema: {
    "id": "com.epik.searchindex:1",
    "owner": "com.epik.audiophile",
	"indexes": [
		{
            "name": "keyword",
            "props": [
                {
                    "name": "keyword" 
                } 
            ] 
        }
	]}
	
}

var objwAMP = 
{
// Private:
	
	arrayExtList: 
			new Array(".mp3",".wma",".m4a",".aac",".flac",".ogg",".ra",".ram",".wav",".mp2",".mp1",".mpg",".als",".ors",".mp4",".3gp",".wmv"),
	
	// this is the current path we are on, set to root dir
	strCurrentPath: "/media/internal", 
	
	// this is an enum to tell whether we are using FileFolder type io or
	//	full indexing type io
	indexType: 0,
	
	mutexLikeCheck: 0,
	
	bShuffle: false,
	bRepeat: false,
	
	funcTextBanner: 0,
	
	// This will hold the song list for viewing
	arrayPlaylist: new Array(),
		
	objectLsCache: new Object(),

	// this will be true if indexer failed to load
	bFolderOnly: false,
	
	isWebOS: ((/webOS/gi).test(navigator.appVersion) ||
			  (/hpwOS/gi).test(navigator.appVersion)),
	
	iSongIndex: 0,
	iOpenIndex: -1,
	
	fTransition: 0.0,
	
	funcIndexStart: 0,
	iIndexStatus: 0,
	
	bReinitInProgress: false,
	
	funcImgGenCB: 0,
	
	funcUpdatePLCallback: 0,
	
	funcPauseCallback: 0,
	
	funcNowPlaying: 0,
	
	tmoutSonTransDB: 0,
	tmoutTrebSet: 0,
	tmoutBassSet: 0,
	tmoutMidSet: 0,
	
	objParam: 0,
	
	objBufPL: new Object(),
	
// Public:

	StatusString: "Attempting To Start Player Plug-In",
	
	BufferPL: function(iIndex, iPos, iArray)
	{
		objwAMP.arrayPlaylist = iArray;
		objwAMP.bBuffer = 1;
		objwAMP.iIndex = iIndex;
		objwAMP.iPos = iPos;
		
		if (objwAMP.funcUpdatePLCallback)
		{
			objwAMP.OpenSong(objwAMP.iIndex);
			objwAMP.Seek(objwAMP.iPos);
			objwAMP.funcUpdatePLCallback(iArray);
		}
		else
			objwAMP.funcUpdatePLCallback = -1;
	},
	
	CheckOS: function()
	{
		if (this.isWebOS)
		{
			this.plugIn = document.getElementById('wAMPPlugin');
			console.log(this.plugIn.id);
			this.plugIn.StartSong = function(str) {objwAMP.StartSong(str);};
			this.plugIn.FinishIndex = function(str) {objwAMP.FinishIndex(str);};
			this.plugIn.FinishSeek = function(str) {objwAMP.FinishSeek(str);};
		}
		else
		{
			this.plugIn = new Object();
			this.plugIn.StartSong = function() {objwAMP.StartSong();};
			this.plugIn.FinishIndex = function(str) {objwAMP.FinishIndex(str);};
			this.plugIn.FinishSeek = function(str) {objwAMP.FinishSeek(str);};
			this.plugIn.bNextSet = false;
			
			this.plugIn.strSongState = "101";
			
			this.plugIn.Ping = function () {return 'Pong';};
								
			setTimeout(function () 
			{
				objwAMP.plugIn.FinishIndex();
			}, 1000);
			
			this.plugIn.GetCurrentDirLS = function ()
			{
				return '{"finishedIndexing":true, ' +
					   '"arrayFileList": [' +
							'{"name":"ice_ice_baby.mp3", "path":"/media/internal/ice_ice_baby.mp3", "artist":"Vanilla Ice", "album":"Ice Ice Baby", "genre":"rap", "title":"Ice Ice Baby", "isdir":false},' +
							'{"name":"every_rose.ogg", "path":"/media/internal/every_rose.ogg", "artist":"Poison", "album":"alllllvin", "genre":"rock", "title":"Every Rose Has It\'s Thorn", "isdir": false},' +
							'{"name":"wallpaper", "path":"/media/internal/wallpaper", "artist":"Mumford and Sons", "album":"alllllvin", "genre":"alternative", "title":"The Cave", "isdir": true},' +
							'{"name":"the_cave.flac", "path":"/media/internal/path4", "artist":"Leonard Skinner", "album":"alllllvin", "genre":"classic rock", "title":"Freebird", "isdir": false},' +
							'{"name":"f_o_g.wma", "path":"/media/internal", "artist":"Sting", "album":"Sting", "genre":"contemporary", "title":"Fields of Gold", "isdir": false},' +
							'{"name":"queen(I want to break free).mp3", "path":"/media/internal/path5", "artist":"Queen", "album":"Greatest Hits", "genre":"rock", "title":"I Want To Break Free", "isdir": false},' +
							'{"name":"stairway.mp3", "path":"/media/internal/path6", "artist":"Led Zepplin", "album":"", "genre":"classic rock", "title":"Stairway To Heaven", "isdir": false},' +
							'{"name":"dustinThewind.mp3", "path":"/media/internal/path7", "artist":"Kanasas", "album":"alllllvin", "genre":"classic rock", "title":"Dust in the wind", "isdir": false},' +
							'{"name":"ringtones", "path":"/media/internal/ringtones", "artist":"Queen", "album":"", "genre":"", "title":"Highlander Theme Song", "isdir": true},' +
							'{"name":"simpson_homer.mp3", "path":"/media/internal/path9", "artist":"", "album":"", "genre":"", "title":"The Simpsons theme", "isdir": false},' +
							'{"name":"hitmeonemoretime.bad", "path":"/media/internal/path10", "artist":"Britney", "album":"alllllvin", "genre":"pop", "title":"Hit Me Baby One More Time", "isdir": false},' +
							'{"name":"mrbright.ogg", "path":"/media/internal/path11", "artist":"The Killers", "album":"alllllvin", "genre":"pop", "title":"Mr. Brightside", "isdir": false},' +
							'{"name":"pokerface.mp3", "path":"/media/internal/path12", "artist":"Lady Gaga", "album":"poker face", "genre":"pop", "title":"Poker Face", "isdir": false},' +
							'{"name":"southpart.mp3", "path":"/media/internal/path13", "artist":"Cartman", "album":"", "genre":"", "title":"Cartman doing poker face", "isdir": false},' +
							'{"name":"born_usa.txt", "path":"/media/internal/path14", "artist":"Bruce", "album":"", "genre":"rock", "title":"Born in the U.S.A.", "isdir": false},' +
							'{"name":"winter.doc", "path":"/media/internal/path15", "artist":"", "album":"alllllvin", "genre":"classical", "title":"Winter", "isdir": false},' +
							'{"name":"crucify.mp3", "path":"/media/internal/path16", "artist":"Tori Amos", "album":"alllllvin", "genre":"pop", "title":"Crucify", "isdir": false},' +
							'{"name":"curcity(remix).flac", "path":"/media/internal/path17", "artist":"", "album":"alllllvin", "genre":"techno", "title":"Crucify (remix)", "isdir": false},' + 
							'{"name":"music", "path":"/media/internal/music", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"Poison", "isdir": true},' +
							'{"name":"groovecov.mp3", "path":"/media/internal/path19", "artist":"Groove Coverage", "album":"alllllvin", "genre":"techno", "title":"20th Century Digital Girl", "isdir": false}' +
						']}';
			};
			
			this.plugIn.iTestVar = 0;
			
			this.plugIn.Open = function()	
			{
				objwAMP.plugIn.iTestVar = 0;
				objwAMP.plugIn.bNextSet = false;
			
				setTimeout(function() 
						  {
							objwAMP.plugIn.StartSong();
						  }, 100);
			};
			
			
			this.plugIn.SetNext = function() 
			{
				objwAMP.plugIn.bNextSet = true;
			};
			this.plugIn.playonce = 0;
			
			this.plugIn.Play = function() 
			{
				if (!objwAMP.plugIn.playonce)
				{
					console.log("Play Once Play: " + ++objwAMP.plugIn.playonce);
					objwAMP.plugIn.intervalTest = setInterval(function () {							
								objwAMP.plugIn.iTestVar++;
								
								if (objwAMP.plugIn.iTestVar > 280)
								{
									if (objwAMP.plugIn.bNextSet == true)
									{
										objwAMP.plugIn.StartSong();
										objwAMP.plugIn.iTestVar = 0;
										objwAMP.plugIn.strSongState = "101";
										objwAMP.plugIn.bNextSet = false;
									}
									else
									{
										objwAMP.plugIn.strSongState = "103";
									}
								}
								
								//objScrub.setCurTime(objwAMP.plugIn.iTestVar);
							}, 1000);
				}
			};
			this.plugIn.Pause = function() 
			{
				clearInterval(objwAMP.plugIn.intervalTest);
				objwAMP.plugIn.playonce = 0;
			};
			this.plugIn.GetCurTime = function() 
			{
				return Number(objwAMP.plugIn.iTestVar).toString();
			};
			this.plugIn.GetEndTime = function() 
			{
				return "280";
			};
			this.plugIn.SetSpeed = function() {};
			this.plugIn.SetVol = function() {};
			this.plugIn.SetTreble = function() {};
			this.plugIn.SetBass = function() {};
			this.plugIn.SetMid = function() {};
			this.plugIn.Seek = function(iTime) 
			{
				objwAMP.plugIn.iTestVar = iTime;
				setTimeout(function()
				{
					objwAMP.FinishSeek(iTime);
				}, 100); ;
			};
		}
	},

	
	/*****************************
	 * Rerun the indexer
	 *****************************/
	RedoIndexer: function()
	{
		this.plugIn.RedoIndex();
	},
	
	
	
	/******************************
	 * This function is checks whether the plugin has been
	 *	loaded yet or not
	 *
	 * Returns true - if loaded / false - if not loaded yet
	 ******************************/
	checkIfPluginInit: function()
	{
		try
		{
			//console.log("Start Here");
			if (this.plugIn.Ping)
			{
				//console.log("Better if we get here");
				if (this.plugIn.Ping() == "Pong")
				{
					//console.log("At least we are getting here");
					return true;
				}
				else
				{
					//console.log("No response to Ping");
					return false;
				}
			}
			else
			{
				//console.log("Ping hook not available");
				return false;
			}
		}
		catch (err) 
		{
			console.log(err);
			return false;
		}
	},
	
	RedowAMP: function()
	{	
		/*objwAMP.bReinitInProgress = true;
		console.log("Starting Reinit");
		$('#wAMPPlugin').remove();
		objwAMP.RecreatePluginHook();
		$('body').append(objwAMP.df);
		
		this.plugIn = document.getElementById('wAMPPlugin');
		this.plugIn.StartSong = function(str) {objwAMP.StartSong(str);};
		this.plugIn.FinishIndex = function(str) {objwAMP.FinishIndex(str);};
		this.plugIn.FinishSeek = function(str) {objwAMP.FinishSeek(str);};*/
	},
	

	CheckIndex: function(funcIndexStart)
	{
		if (objwAMP.funcIndexStart)
			funcIndexStart(objwAMP.iIndexStatus);
		else
			objwAMP.funcIndexStart = funcIndexStart;
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishIndex: function(strPaths)
	{		
		console.log("Finish Index w:" + strPaths);
		
		objwAMP.strPathString = strPaths;
		
		setTimeout(function()
		{
			objwAMP.IndexerCallbackFinish()
		}, 1);
	},
	
	/******************************
	 * Check if the index was previously run
	 ******************************/
	IndexerCallbackFinish: function()
	{			
		var arrayPaths = new Array();
		
		if (this.isWebOS)
		{
		
			var arrayParseIndex = objwAMP.strPathString.split('\\\\');
		
			console.log("About to start parsing with: " + 
										JSON.stringify(arrayParseIndex));
		
			console.log("Parse Num: " + arrayParseIndex.length);
		
			var i=0;
			while (i<arrayParseIndex.length-1)
			{
				var objSongItm = new Object();
			
				objSongItm.path = arrayParseIndex[i];
				objSongItm.found = false;
				
				var arrayDetail = arrayParseIndex[i+1].split('-');
				
				if (isNaN(arrayDetail[0]) || isNaN(arrayDetail[0]))
				{
					i++;
					continue;
				}
				
				objSongItm.lastmod = arrayDetail[0];
				objSongItm.hash = arrayDetail[1];
				objSongItm.name = arrayDetail[2];
								
				i+=2;
				
				arrayPaths.push(objSongItm);
			}
		}
		
		console.log("About to Init Index with: " + 
										JSON.stringify(arrayPaths));
		
		objwAMP.iIndexStatus = objSongIndex.Init(arrayPaths, function()
		{
			console.log("Indexer Called Back");
			
			objwAMP.iIndexStatus = INDEX_FINISHED;
		
			if (objwAMP.funcIndexStart)
				objwAMP.funcIndexStart(INDEX_FINISHED);
			else
			{
				objwAMP.funcIndexStart = 1;
			}
		},
		function()
		{
			objwAMP.iIndexStatus = INDEX_FAILED_LOAD;
		
			if (objwAMP.funcIndexStart)
				objwAMP.funcIndexStart(INDEX_FAILED_LOAD);
			else
			{
				objwAMP.funcIndexStart = 1;
			}			
		});

	

	},
	
	/******************************
	 * This function gets the ls of whatever the current dir is set to
	 *
	 * Returns: An array of objects which is made up of
	 *			the songs and dirs in a particular file
	 ******************************/
	GetDirFileList: function()
	{
		
		try
		{
			// Check if we have already visited this dir previously
			if (this.objectLsCache[this.strCurrentPath])
			{
				// If we have, just return what we found before
				return this.objectLsCache[this.strCurrentPath];
			}
			else
			{	
				// this is the first time we have visited this dir
				//	so build the ls of it
			
				var objCache = new Object;
				
				// Seperate everything into three arrays, dirs/playbel/unknown
				objCache.Dir = new Array();
				objCache.Playable = new Array();
				objCache.Unknown = new Array();
				
			
				// Have the plugin get the info for the available files
				//	and pass it to the js app via JSON formatted string
				var strJSON = this.plugIn.GetCurrentDirLS(this.strCurrentPath);
			
				//this.Log(strJSON);
			
				// If our return string is NULL, it means that no sub dirs exist
				//	and no songs exist in that folder, so create an item to go up
				//	one dir
				if (!strJSON)
				{
					var objAppendItem = {
						isdir : true,
						name : "No Song Files Found\nClick to return to previous dir",
						path : this.strCurrentPath.substr(0,this.strCurrentPath.lastIndexOf("/"))
					};
					
					objCache.Dir.push(objAppendItem);
					
					this.objectLsCache[this.strCurrentPath] = objCache;
					return this.objectLsCache[this.strCurrentPath];
				}
			
				// We get here if there was something in the JSON string, so parse it
				var jsonFileList = JSON.parse(strJSON);
				
				// If the current directory is not the root dir, then provide
				//	a method for going up one dir
				if (this.strCurrentPath !== "/media/internal")
				{
					var objAppendItem = {
						artist : "",
						album : "",
						genre : "",
						title : "",
						isdir : true,
						name : "..",
						path : this.strCurrentPath.substr(0,this.strCurrentPath.lastIndexOf("/"))
					};
					
					objCache.Dir.push(objAppendItem);
				}
				
				for (var i=0; i < jsonFileList.arrayFileList.length; i++)
				{
					if (jsonFileList.arrayFileList[i].isdir)
					{
						objCache.Dir.push(jsonFileList.arrayFileList[i]);
						continue;
					}
					
					var iIndex = jsonFileList.arrayFileList[i].name.lastIndexOf(".")
					
					if (iIndex == -1)
					{
						objCache.Unknown.push(jsonFileList.arrayFileList[i]);
						continue;
					}
					
					var strExt = jsonFileList.arrayFileList[i].name.slice(iIndex).toLowerCase();
					var bIsPlayable = false;
					
					for (var j = 0; j < this.arrayExtList.length; j++) 
					{
					
						if (this.arrayExtList[j] == strExt) 
						{
							bIsPlayable = true;
							break; 
						}
					}
				
					if (bIsPlayable)
						objCache.Playable.push(jsonFileList.arrayFileList[i]);
					else
						objCache.Unknown.push(jsonFileList.arrayFileList[i]);
				
				}
				
				this.objectLsCache[this.strCurrentPath] = objCache;
				return this.objectLsCache[this.strCurrentPath];
			}
		}
		catch (err) {console.log(err);}
		
	},
	
	/******************************
	 * Show spectrum data
	 *****************************/
	
	
	/******************************
	 * This function gets the current path for folder ls
	 *
	 * Returns: A string with the current path
	 ******************************/
	getCurrentPath: function()
	{
		return this.strCurrentPath;
	},
	/******************************
	 * This function sets the current path for folder ls
	 *
	 * Returns: None
	 ******************************/
	SetCurrentPath: function(strDir)
	{
		this.strCurrentPath = strDir;
	},
	
	 /******************************
	  * Deal with playback mode
	  * var PLAY_MODE_NORMAL = 0;
	  * var PLAY_MODE_REPEAT = 0;
	  * var PLAY_MODE_SHUFFLE = 0;
	  ******************************/
	SetMode: function(iMode)
	{
		switch(iMode)
		{
			case PLAY_MODE_SHUFFLE:
				this.bShuffle = true;
				this.bRepeat = false;
				break;
			case PLAY_MODE_REPEAT:
				this.bShuffle = false;
				this.bRepeat = true;
				break;
			case PLAY_MODE_NORMAL:
				this.bShuffle = false;
				this.bRepeat = false;	
		}
		
		this.SetNextSong();
	},
	GetMode: function()
	{
		if (this.bShuffle == true)
			return PLAY_MODE_SHUFFLE;
		else if (this.bRepeat == true)
			return PLAY_MODE_REPEAT;
		else
			return PLAY_MODE_NORMAL;
	},
	
	
	 /*******************************
	 * Tell the plugin to pause
	 *******************************/
	pause: function()
	{
		this.plugIn.Pause();
	},
	 
	 /*******************************
	 * Tell the plugin to play
	 *******************************/
	play: function()
	{
		this.plugIn.Play();
	},
	  

	/*******************************
	 * This function gets the current state
	 *******************************/
	GetState: function()
	{
		var objState = new Object;
	
		objState.CurTime = Number(this.plugIn.GetCurTime());
		objState.EndTime = Number(this.plugIn.GetEndTime());
		
		if (isNaN(objState.EndTime))
		{
			objState.EndTime = 0;
			objState.CurTime = 0;
		}
		else if (isNaN(objState.CurTime))
			objState.CurTime = 0;
			
		objSongIndex.SaveCurPos(objState.CurTime);
	
		return objState;
	},
	 
	/*******************************
	 * Set the speed control
	 *******************************/
	SetSpeed: function(fSpeed)
	{
		console.log(fSpeed);
	
		this.plugIn.SetSpeed(fSpeed);
	},
	 
	 /*******************************
	 * Set the vol control
	 *******************************/
	SetVol: function(fVol)
	{
		this.plugIn.SetVol(fVol);
	},
	 
	/*******************************
	 * Set the treble control
	 *******************************/
	SetTreble: function(fTreb)
	{
		clearTimeout(objwAMP.tmoutTrebSet);
		
		objwAMP.tmoutTrebSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_TREB, 
									Number(fTreb).toString());
		
		}, 300);
		
		this.plugIn.SetTreble(fTreb * 2);
	},
	 
	 /*******************************
	 * Set the bass control
	 *******************************/
	SetBass: function(fBass)
	{	
		clearTimeout(objwAMP.tmoutBassSet);
		
		objwAMP.tmoutBassSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_BASS, 
									Number(fBass).toString());
		
		}, 300);
	
		this.plugIn.SetBass(fBass * 2);
	},

	 /*******************************
	 * Set the midrange control
	 *******************************/
	SetMid: function(fMid)
	{
		clearTimeout(objwAMP.tmoutMidSet);
		
		objwAMP.tmoutMidSet = setTimeout(function()
		{
			objOptions.UpdateOption(OPT_ID_MID, 
									Number(fMid).toString());
		
		}, 300);
	
		this.plugIn.SetMid(fMid * 2);
	},
	
	 /*******************************
	 * Seek a part of the song
	 *******************************/
	Seek: function(iNewTime, funcFinishFunc)
	{
		this.funcSeekFinishFunc = funcFinishFunc;
		this.plugIn.Seek(iNewTime);
	}, 

	RegisterPauseFunc: function(funcPauseFunc)
	{
		objwAMP.funcPauseCallback = funcPauseFunc;
	
	},
	
	/*********************************
	 * Callback function called by the plugin to
	 *	let the javascript know when a song has started.
	 *********************************/
	StartSong: function(strJSON)
	{	
		objwAMP.strJSON = strJSON;
		
		setTimeout(function()
		{
			objwAMP.AvoidPluginCall()
		}, 10);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidPluginCall: function()
	{	

		console.log('In Open next song info callback result');
	
		if (objwAMP.strJSON == "0000")
		{
			console.log("Handling 0000");
			
			var iCheckIndex = this.GetNextIndex();
			
			if ((objwAMP.iNextIndex == -1) ||
				(iCheckIndex = -1))
			{
				if (objwAMP.funcPauseCallback)
					objwAMP.funcPauseCallback();
					
				return;
			}
			
			this.SetIndex(this.iNextIndex);
			this.SetIndex(this.GetNextIndex());
			this.OpenNextSong();
			return;
		}

		var bJSONParseGood = false
		
		if (objwAMP.strJSON)
		{
			try
			{
				this.objSongInfo = JSON.parse(objwAMP.strJSON);
				bJSONParseGood = true;
			}
			catch(e) {console.log("No luck with JSON: " + objwAMP.strJSON);}
		}
		
		try
		{
			if ((bJSONParseGood) && this.objSongInfo["error"])
			{
				console.log("Handling Error");
				this.SetIndex(this.iNextIndex);
				this.SetIndex(this.GetNextIndex());
				this.OpenNextSong();
				return;
			}
			
			if (this.iOpenIndex == -1)
				this.SetIndex(this.iNextIndex);
			else
			{
				this.SetIndex(this.iOpenIndex);
				this.iOpenIndex = -1;
			}
			
			this.SetNextSong();
			var strName;
			var strArtist;
			
			// Given the choice, use the most recent song metadata info
			if (bJSONParseGood == true)
			{
				if (this.objSongInfo.Metadata.title) 
					strName = this.objSongInfo.Metadata.title;
				else
					strName = this.objSongInfo.name;
				
				if (this.objSongInfo.Metadata.artist)
					strArtist = this.objSongInfo.Metadata.artist;
				else
					strArtist = this.objSongInfo.path;
			
			}
			else
			{
			
				if (this.arrayPlaylist[this.GetIndex()].title)
					strName = this.arrayPlaylist[this.GetIndex()].title;
				else
					strName = this.arrayPlaylist[this.GetIndex()].name;
				
				if (this.arrayPlaylist[this.iSongIndex].artist)
					strArtist = this.arrayPlaylist[this.iSongIndex].artist;
				else
					strArtist = this.arrayPlaylist[this.iSongIndex].path;
			}

			objwAMP.funcTextBanner(strName, strArtist);
			
			
			if ((this.objSongInfo.path == 
								this.arrayPlaylist[this.GetIndex()].path) &&
				(this.arrayPlaylist[this.GetIndex()].imgLarge))
			{
				objwAMP.funcImgGenCB(this.arrayPlaylist[this.GetIndex()].imgLarge);
			}
			else
			{
				objwAMP.funcImgGenCB("res/player/spinimg.png");
			}
			
			$('.songlistener').trigger('songtrans');
		}
		catch(e) 
		{
			console.log(e);
			
			objwAMP.funcTextBanner(this.arrayPlaylist[this.GetIndex()].name, 
								   this.arrayPlaylist[this.iSongIndex].path);
			
			objwAMP.funcImgGenCB("res/player/spinimg.png");
		}
		
		objSongIndex.SaveCurIndex(this.iSongIndex);
		
		if (objwAMP.funcNowPlaying)
			objwAMP.funcNowPlaying(this.iSongIndex);
	},
	
	RegisterTextBanner: function(funcTextBanner)
	{
		objwAMP.funcTextBanner = funcTextBanner;
	},
	
	// Function to register call back for show album art
	RegisterImgGen: function(funcImgGenCB)
	{
		objwAMP.funcImgGenCB = funcImgGenCB;
	},
	
	RegisterSongTrans: function(funcSongTransition)
	{
		objwAMP.funcSongTransition = funcSongTransition;
	},
	
	RegisterNowPlaying: function(funcNowPlaying)
	{
		objwAMP.funcNowPlaying = funcNowPlaying;
	},
	
	/******************************
	 * Callback for reindex
	 ******************************/
	FinishReindex: function(strJSON)
	{	
		objwAMP.strIndexJSON = strJSON;
		
		setTimeout(function()
		{
			objwAMP.AvoidReindexPluginCall()
		}, 10);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidReindexPluginCall: function()
	{
		this.jsonIndex = JSON.parse(this.strIndexJSON);
		objSongIndex.addArray(this.jsonIndex.arrayFileList);
		$('#idButtonGoesHere').show();
	},
	
	
	/*******************************
	 * Called after plugin finishes seeking
	 *******************************/
	FinishSeek: function(strNewTime)
	{
		objwAMP.strNewSeekTime = strNewTime;
		setTimeout(function()
		{
			objwAMP.AvoidSeekPluginCall()
		}, 5);
	},
	/*********************************
	 * Need this to avoid calling the plugin
	 *  from the plugin callback
	 *********************************/
	AvoidSeekPluginCall: function()
	{
		var iRet = parseFloat(objwAMP.strNewSeekTime);
		if (isNaN(iRet))
		{
			console.log(objwAMP.strNewSeekTime);
			iRet = 0;
		}
		
		if (this.funcSeekFinishFunc)
			this.funcSeekFinishFunc(iRet);
	},
	
	/******************************
	 * Gets the file list based on which option we are using
	 ******************************/
	GetPlaylist: function()
	{
		if (!(this.arrayPlaylist))
			this.arrayPlaylist = new Array();
	
		return this.arrayPlaylist
	},
	
	PLSize: function()
	{
		if (!(this.arrayPlaylist))
			return 0;
		else
			return this.arrayPlaylist.length;
	},
	/*************************************
	 * Empty the playlist
	 *************************************/
	RegisterPLCallback: function(funcUpdatePLCallback)
	{
		if (this.funcUpdatePLCallback == -1)
		{
			objwAMP.OpenSong(objwAMP.iIndex);
			objwAMP.Seek(objwAMP.iPos);	
			funcUpdatePLCallback(this.arrayPlaylist);
		}
		
		this.funcUpdatePLCallback = funcUpdatePLCallback;
	},
	
	EmptyPlaylist: function()
	{
		this.arrayPlaylist = new Array();
		this.SetIndex(0);
		
		objSongIndex.SaveCurPlaylist();
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist);
	},
	
	SetPlaylist: function(arraySongs, bSkipDB8Update)
	{
		this.arrayPlaylist = arraySongs;
		
		if (!bSkipDB8Update)
			objSongIndex.SaveCurPlaylist();
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist);
		this.SetNextSong();
	},

	AppendPlaylist: function(arrayNewPL)
	{
		this.arrayPlaylist = objwAMP.GetPlaylist().concat(arrayNewPL);
		
		objSongIndex.SaveCurPlaylist();
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist);
		this.SetNextSong();
	},

	RemoveSong: function(iIndex)
	{
		this.arrayPlaylist.splice(iIndex, 1);
		
		objSongIndex.SaveCurPlaylist();
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist);
	},
	
	AddSong: function(objSong, iPosition)
	{
		if ((iPosition) && (this.arrayPlaylist))
		{
			switch (iPosition)
			{
			case PLAYLIST_POS_END:
				this.AddSongToPlaylist(objSong);
				break;
			case PLAYLIST_POS_NEXT:
				this.AddSongNext(objSong);
				break
			default:
				this.arrayPlaylist.splice(iPosition,
										  0,
										  objSong);
				this.SetNextSong();
			}
		}
		else
			this.AddSongToPlaylist(objSong);
		
		objSongIndex.SaveCurPlaylist();
		
		if (this.funcUpdatePLCallback)
			this.funcUpdatePLCallback(this.arrayPlaylist);
			
		this.SetNextSong();
	},
	
	AddSongToPlaylist: function(objSong)
	{
		if (!this.arrayPlaylist)
		{
			this.arrayPlaylist = new Array();
			this.arrayPlaylist.push(objSong);
			this.OpenSong(0);
		}
		else
			this.arrayPlaylist.push(objSong);
		
		this.SetNextSong();
	},
	
	AddSongNext: function(objSong)
	{
		if (!this.arrayPlaylist)
		{
			this.AddSongToPlayList(objSong);
		}
		else
		{
			var iCurIndex = this.GetIndex();
		
			this.arrayPlaylist.splice(iCurIndex + 1,
									0,
									objSong);
			this.SetNextSong(iCurIndex + 1);
		}
		
	},
	
	AddSongNow: function(objSong)
	{
		this.AddSong(objSong, this.GetIndex());
	},
	
	SetSongTransition: function (fTransition)
	{
		clearTimeout(objwAMP.tmoutSonTransDB);
		
		objwAMP.tmoutSonTransDB = setTimeout(function()
		{
			console.log("Set transition to:" + fTransition);
			objOptions.UpdateOption(OPT_ID_TRANS, 
									Number(fTransition).toString());
			objwAMP.SetNextSong();
		}, 400);
		this.fTransition = Number(fTransition).toFixed(1);
	},
	
	GetSongTransition: function ()
	{
		return this.fTransition;
	},
	
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	SetIndex: function(iIndex)
	{
		this.iSongIndex = iIndex;
	},
	GetIndex: function()
	{
		return this.iSongIndex;
	},
	
	 
	/******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/	
	GetNextIndex: function()
	{
	
		if (!(this.arrayPlaylist))
			return -1;
	
		var iRet = this.GetIndex();
	
		if (this.bShuffle == true)
			iRet = Math.floor(Math.random()*this.arrayPlaylist.length);
		else
		{
			iRet++;
			if (this.bRepeat == true)
				iRet = iRet % this.arrayPlaylist.length;
			else
			{
				if (iRet >= this.arrayPlaylist.length)
					return -1;
			}
		}
		
		return iRet;
	},
	 
	 /******************************
	 * Tell the plugin handler which song to start playing
	 ******************************/
	 getPreviousIndex: function()
	 {
		if (!(this.arrayPlaylist))
			return -1;	 
	 
		var iRet = this.GetIndex();

		if (this.bShuffle == true)
			iRet = Math.floor(Math.random()*this.arrayPlaylist.length);
		else
		{
			iRet--;
			if (iRet < 0)
			{
				if (this.bRepeat)
					iRet = this.arrayPlaylist.length - 1;
				else
					iRet = 0;
			}
		}	

		return iRet;
	 },
	 
	 
	/*******************************
	 * Tell the plugin to load the song at the current index
	 * 	or you can pass it an index variable
	 *******************************/
	 OpenSong: function(iIndex)
	 {	 
		if (!(this.arrayPlaylist) || !(this.arrayPlaylist.length))
			return;
		
		if (typeof(iIndex) != "undefined")
		{
			if (iIndex >= this.arrayPlaylist.length)
				iIndex = this.arrayPlaylist.length - 1;
			else if (iIndex < 0)
				iIndex = 0;
			this.SetIndex(iIndex);
		}
			
		this.plugIn.Open(this.arrayPlaylist[this.GetIndex()].path);
		this.iOpenIndex = this.GetIndex();
	 },
	
	
	/*******************************
	 * Tell the plugin to use a new next song
	 *******************************/
	SetNextSong: function(iIndex)
	{	
		if (!this.arrayPlaylist || !this.arrayPlaylist.length)
			return;
	
		if ((this.arrayPlaylist.length == 1) &&
			 (this.bRepeat != true))
			return;
		
		
		console.log("Transition:" + this.fTransition);
	
		if (iIndex)
		{
			if (iIndex == -1)
			{
				this.iNextIndex = -1;
				return;
			}
			
			try
			{
				this.plugIn.SetNext(this.arrayPlaylist[iIndex].path,
									this.fTransition);
			}
			catch (e)
			{
				console.log(e);
				if (!objwAMP.bReinitInProgress)
					objwAMP.RedowAMP();
				return 0;
			}
			
			this.iNextIndex = iIndex;
			return;
		}
	
		var iNextIndex = this.GetNextIndex();
		
		if (iNextIndex == -1)
			return;
		
		
		if (!this.arrayPlaylist[iNextIndex])
		{
			this.plugIn.SetNext(this.arrayPlaylist[0].path, 
								this.fTransition);
		}
		
		//console.log("Transition in ***Setnext: " + this.fTransition);
		
		try
		{
			this.plugIn.SetNext(this.arrayPlaylist[iNextIndex].path, 
								this.fTransition);
		}
		catch (e)
		{
			console.log(e);
			if (!objwAMP.bReinitInProgress)
				objwAMP.RedowAMP();
			return 0;
		}					
							
		this.iNextIndex = iNextIndex;
	},

	
	 /*******************************
	 * Tell the plugin to Play the next song
	 *******************************/
	 OpenNextSong: function()
	 {
		var iNextIndex = this.GetNextIndex();
		
		if (iNextIndex == -1)
		{
			scenePlay.ForcePause();
		}
		else
		{
			this.SetIndex(iNextIndex);
			this.plugIn.Open(this.arrayPlaylist[this.GetIndex()].path);
			this.iOpenIndex = this.GetIndex();
		}

	},
		
	 
	 /*******************************
	 * Tell the plugin to play the previous song
	 *******************************/
	OpenPrevSong: function()
	{
		var iPrevIndex = this.getPreviousIndex();
	 
	 	if (iPrevIndex == -1)
		{
			scenePlay.ForcePause();
		}
		else
		{
			this.SetIndex(iPrevIndex);
			this.plugIn.Open(this.arrayPlaylist[iPrevIndex].path);
			this.iOpenIndex = this.GetIndex();
		}
	},
	
	
	/**********************
	 * Get metadata for a son
	 **********************/
	GetMetadata: function(strPath)
	{
		return this.plugIn.GetMetadata(strPath);
	}
}
