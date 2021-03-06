//MODULES["utils"] = {};
////////////////////////////////////////
//Utility Functions/////////////////////
////////////////////////////////////////

//polyfill for includes function
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

//Loads the automation settings from browser cache
function loadPageVariables() {
    var tmp = JSON.parse(localStorage.getItem('autoTrimpSettings'));
    if (tmp !== null) {
        debug('ATsettings: Checking version...');
        if (tmp['ATversion'] != undefined && !versionIsOlder(tmp['ATversion'], ATversion)) autoTrimpSettings = tmp;
        else { debug("ATsettings: Old version. There was a format change."); updateOldSettings(tmp);};
    }
}

//Safe Set a single generic item into localstorage (
function safeSetItems(name,data) {
    try {
        localStorage.setItem(name, data);
    } catch(e) {
      if (e.code == 22) {
        // Storage full, maybe notify user or do some clean-up
        debug("Error: LocalStorage is full, or error. Attempt to delete some portals from your graph or restart browser.");
      }
    }
}

//returns true if old is older than testcase
function versionIsOlder(old, testcase) {
    var oldVer = parseVersion(old);
    var testVer = parseVersion(testcase);

    if (oldVer.length == 0) return true;
    //compare major to minor numbers, if older it's older, if newer it's not
    for (var i=0; i < oldVer.length; i++) {
        if (oldVer[i] < testVer[i]) return true;
        else if ( oldVer[i] > testVer[i]) return false;
    }
    if (oldVer.length < testVer.length) return true; //assume added numbers mean a newer subversioning scheme
    return false;
}

//takes a version string, returns an array
function parseVersion(version) {
    if (version == null || version === undefined || typeof(version) != "string") return {}; //invalid = older or corrupt
    version = version.split("-", 1); //anything after the dash doesn't matter
    return version[0].split(".");
}

function updateOldSettings(oldSettings) {
    var oldVer = oldSettings['ATversion'];
    debug("ATsettings: Updating v" +  oldVer + " to  v" + ATversion);
    if (versionIsOlder(oldVer, '2.1.6.9')) {
        debug("ATsettings: Migrating AutoMaps + RunUniqueMaps to new AutoMaps.");
        //migrate AutoMaps + RunUniqueMaps to new AutoMaps
        oldSettings['AutoMaps'].value = oldSettings['AutoMaps'].enabled ? 1 : 0;
        if(oldSettings['RunUniqueMaps'] !== undefined){
            if (!oldSettings['RunUniqueMaps'].enabled)
                oldSettings['AutoMaps'].value++;
            delete oldSettings['RunUniqueMaps'];
        }
    }
    //These settingsneed to be migrated here:
/*

BuyBuildingsNew = BuyBuildings + BuyStorage
BuyJobsNew = BuyJobs + WorkerRatios
BuyWeaponsNew  = BuyWeaponUpgrades + BuyWeapons
BuyArmorNew = BuyArmorUpgrades + BuyArmor
ManualGather2 was 2 now 3 (4=way)  - needs to be converted.
BuyOneTimeOC = BuyOvclock + OneTimeOnly
PrestigeSkip1_2 = PrestigeSkipMode + PrestigeSkip2
ScryerDieToUseS += ScryerDieZ
(+more since 5 days ago)
*/
    /*if (versionIsOlder(oldVer, '2.1.7.0')) {
        //example:*untested*
        var X='BuyBuildings';
        var Y='BuyStorage';
        var Z='BuyBuildingsNew';
        //migrate X + Y to new Z
        var oldOne = oldSettings[X];
        var oldTwo = oldSettings[Y];
        var newOne = oldSettings[Z];        
        debug("ATsettings: Migrating " + X + " + " + Y + " to new " + Z);
        newOne.value = oldOne.enabled ? 1 : 0;
        newOne.value+= oldTwo.enabled ? 1 : 0;
        delete oldOne;
        delete oldTwo;      
    }*/
    autoTrimpSettings = oldSettings;
}

//The Overall Export function to output an autoTrimpSettings file.
//Serializes automation settings, remove long descriptions in autoTrimpSettings and only keep valid data.
function serializeSettings() {
    return JSON.stringify(Object.keys(autoTrimpSettings).reduce((v, k) => {
        const el = autoTrimpSettings[k];
        switch (el.type) {
        case 'boolean':
            //if(el.enabled === undefined)
            //    return v[k] = false, v;
            return v[k] = el.enabled, v;
        case 'value':
        case 'valueNegative':
        case 'multitoggle':
            //if(el.value === undefined)
            //    return v[k] = -1, v;
            return v[k] = el.value, v;
        case 'dropdown':
            return v[k] = el.selected, v;
        }
        return v[k] = el, v; // ATversion, anything else unhandled by SettingsGUI
    }, {}));
}

//Saves autoTrimpSettings to browser cache
function saveSettings() {
    safeSetItems('autoTrimpSettings', serializeSettings());
}

//Grabs the automation settings from the page
function getPageSetting(setting) {
    if (autoTrimpSettings.hasOwnProperty(setting) == false) {
        return false;
    }
    if (autoTrimpSettings[setting].type == 'boolean') {
        // debug('found a boolean');
        return autoTrimpSettings[setting].enabled;
    } else if (autoTrimpSettings[setting].type == 'value' || autoTrimpSettings[setting].type == 'valueNegative') {
        // debug('found a value');
        return parseFloat(autoTrimpSettings[setting].value);
    } else if (autoTrimpSettings[setting].type == 'multitoggle') {
        // debug('found a multitoggle');
        return parseInt(autoTrimpSettings[setting].value);
    } else if (autoTrimpSettings[setting].type == 'dropdown') {
        // debug('found a dropdown')
        return autoTrimpSettings[setting].selected;
    }
}

//programmatically sets the underlying variable of the UI Setting and the appropriate Button CSS style&color
function setPageSetting(setting, value) {
    if (autoTrimpSettings.hasOwnProperty(setting) == false) {
        return false;
    }
    //check type match first, otherwise theres a conflict. in this case we make the setting from new
    //if(autoTrimpSettings[setting].type
    if (autoTrimpSettings[setting].type == 'boolean') {
        // debug('found a boolean');
        autoTrimpSettings[setting].enabled = value;
        document.getElementById(setting).setAttribute('class', 'noselect settingsBtn settingBtn' + autoTrimpSettings[setting].enabled);
    } else if (autoTrimpSettings[setting].type == 'value' || autoTrimpSettings[setting].type == 'valueNegative') {
        // debug('found a value');
        autoTrimpSettings[setting].value = value;
    } else if (autoTrimpSettings[setting].type == 'multitoggle') {
        // debug('found a value');
        autoTrimpSettings[setting].value = value;
        document.getElementById(setting).setAttribute('class', 'noselect settingsBtn settingBtn' + autoTrimpSettings[setting].value);
    } else if (autoTrimpSettings[setting].type == 'dropdown') {
        // debug('found a dropdown');
        autoTrimpSettings[setting].selected = value;
    }
}

//Global debug message
function debug(messageStr, type, lootIcon) {
    var output = true;
    //var noclock = false;
    var noclock = true;
    switch (type) {
        case null:
            break;
        case "spam":
            output = getPageSetting('SpamGeneral');
            noclock = true;
            break;
        case "general":
            output = getPageSetting('SpamGeneral');
            break;
        case "wind":
            output = getPageSetting('SpamWind');
            break;
        case "upgrades":
            output = getPageSetting('SpamUpgrades');
            break;
        case "equips":
            output = getPageSetting('SpamEquipment');
            break;
        case "maps":
            output = getPageSetting('SpamMaps');
            break;
        case "heirlooms":
            output = getPageSetting('SpamHeirlooms');
            break;
        case "trimpicide":
            output = getPageSetting('SpamTrimpicide');
            break;
        case "other":
            output = getPageSetting('SpamAmal');
            break;
        case "buildings":
            output = getPageSetting('SpamBuilding');
            break;
        case "jobs":
            output = getPageSetting('SpamJobs');
            break;
        case "magmite":
            output = getPageSetting('SpamMagmite');
            break;
        case "GU":
            output = getPageSetting('SpamGU')
            break;
        case "perks":
            output = getPageSetting('SpamPerks');
            break;      
    }
    if (output) {
        if (enableDebug){
            if(noclock)
                console.log(messageStr);
                //setTimeout (console.log.bind (console, messageStr));
            else
                console.log(timeStamp() + ' ' + messageStr);
                //setTimeout (console.log.bind (console, timeStamp() + ' ' + messageStr));
        }
        if(typeof pendingLogs !== 'undefined')
            message3(messageStr, "AutoTrimps", lootIcon, type);
        else
            message2(messageStr, "AutoTrimps", lootIcon, type);
    }
}

function message3(messageString, type, lootIcon, extraClass, extraTag, htmlPrefix) {
    /*if (messageLock && type !== "Notices"){
            return;
    }
    if (extraTag && typeof game.global.messages[type][extraTag] !== 'undefined' && !game.global.messages[type][extraTag]){
            return;
    }*/
    //var log = document.getElementById("log");
    //var displayType = (game.global.messages[type].enabled) ? "block" : "none";
    var displayType = (ATmessageLogTabVisible) ? "block" : "none";
    //var prefix = "";
    var addId = "";
    /*if (messageString == "Game Saved!" || extraClass == 'save') {
        addId = " id='saveGame'";
        if (document.getElementById('saveGame') !== null){
            var needsScroll = ((log.scrollTop + 10) > (log.scrollHeight - log.clientHeight));
            var oldElem = document.getElementById('saveGame');
            log.removeChild(oldElem);
            log.appendChild(oldElem);
            if (messageString != "Game Saved!") messageString = "<span class='glyphicon glyphicon-off'></span>" + messageString;
            oldElem.innerHTML = messageString;
            if (needsScroll) log.scrollTop = log.scrollHeight;
            return;
        }
    }*/
    //messageString = ((game.options.menu && game.options.menu.timestamps.enabled && game.options.menu.timestamps.enabled == 1) ? getCurrentTime() : updatePortalTimer(true)) + " " + messageString;
    //messageString = messageString;
    
    if (!htmlPrefix){
        if (lootIcon && lootIcon.charAt(0) == "*") {
            lootIcon = lootIcon.replace("*", "");
            prefix =  "icomoon icon-";
        }
        else prefix = "glyphicon glyphicon-";
        //if (type == "Story") messageString = "<span class='glyphicon glyphicon-star'></span> " + messageString;
        //if (type == "Combat") messageString = "<span class='glyphicon glyphicon-flag'></span> " + messageString;
        //if (type == "Loot" && lootIcon) messageString = "<span class='" + prefix + lootIcon + "'></span> " + messageString;
        //if (type == "Notices"){
        //    if (lootIcon !== null) messageString = "<span class='" + prefix + lootIcon + "'></span> " + messageString;
        //    else messageString = "<span class='glyphicon glyphicon-off'></span> " + messageString;
        //}
        messageString = "<span class=\"glyphicon glyphicon-superscript\"></span> " + messageString;
        messageString = "<span class=\"icomoon icon-text-color\"></span>" + messageString;
    }
    else 
        messageString = htmlPrefix + " " + messageString;
    
    var messageHTML = "<span" + addId + " class='" + type + "Message message" +  " " + extraClass + "' style='display: " + displayType + "'>" + messageString + "</span>";
    pendingLogs.all.push(messageHTML);
    if (type != "Story"){
        var pendingArray = pendingLogs[type];
        pendingArray.push(pendingLogs.all.length - 1);
        if (pendingArray.length > 10){
            var index = pendingArray[0];
            pendingLogs.all.splice(index, 1)
            pendingArray.splice(0, 1);
            adjustMessageIndexes(index);
        }
    }
}



//we copied message function because this was not able to be called from function debug() without getting a weird scope? related "cannot find function" error.
var lastmessagecount = 1;
function message2(messageString, type, lootIcon, extraClass) {
    var log = document.getElementById("log");
    var needsScroll = ((log.scrollTop + 10) > (log.scrollHeight - log.clientHeight));
    var displayType = (ATmessageLogTabVisible) ? "block" : "none";
    var prefix = "";
    if (lootIcon && lootIcon.charAt(0) == "*") {
        lootIcon = lootIcon.replace("*", "");
        prefix =  "icomoon icon-";
    }
    else prefix = "glyphicon glyphicon-";
    //add timestamp
    if (game.options.menu.timestamps.enabled){
        messageString = ((game.options.menu.timestamps.enabled == 1) ? getCurrentTime() : updatePortalTimer(true)) + " " + messageString;
    }
    //add a suitable icon for "AutoTrimps"
    if (lootIcon)
        messageString = "<span class=\"" + prefix + lootIcon + "\"></span> " + messageString;
    messageString = "<span class=\"glyphicon glyphicon-superscript\"></span> " + messageString;
    messageString = "<span class=\"icomoon icon-text-color\"></span>" + messageString;

    var add = "<span class='" + type + "Message message " + extraClass + "' style='display: " + displayType + "'>" + messageString + "</span>";
    var toChange = document.getElementsByClassName(type + "Message");
    if (toChange.length > 1 && toChange[toChange.length-1].innerHTML.indexOf(messageString) > -1){
        var msgToChange = toChange[toChange.length-1].innerHTML;
        lastmessagecount++;
        //search string backwards for the occurrence of " x" (meaning x21 etc)
        var foundXat = msgToChange.lastIndexOf(" x");
        if (foundXat != -1){
            toChange[toChange.length-1].innerHTML = msgToChange.slice(0, foundXat);  //and slice it out.
        }
        //so we can add a new number in.
        toChange[toChange.length-1].innerHTML += " x" + lastmessagecount;
    }
    else {
        lastmessagecount =1;
        log.innerHTML += add;
    }
    if (needsScroll) log.scrollTop = log.scrollHeight;
    trimMessages(type);
}



//Simply returns a formatted text timestamp
function timeStamp() {
    var now = new Date();

    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }
    return time.join(":");
}

//Called before buying things that can be purchased in bulk
function preBuy() {
    preBuyAmt = game.global.buyAmt;
    preBuyFiring = game.global.firing;
    preBuyTooltip = game.global.lockTooltip;
    preBuymaxSplit = game.global.maxSplit;
}

//Called after buying things that can be purchased in bulk
function postBuy() {
    game.global.buyAmt = preBuyAmt;
    game.global.firing = preBuyFiring;
    game.global.lockTooltip = preBuyTooltip;
    game.global.maxSplit = preBuymaxSplit;
}
//#2 Called before buying things that can be purchased in bulk
function preBuy2() {
    return [game.global.buyAmt,game.global.firing,game.global.lockTooltip,game.global.maxSplit];
}

//#2 Called after buying things that can be purchased in bulk
function postBuy2(old) {
    game.global.buyAmt = old[0];
    game.global.firing = old[1];
    game.global.lockTooltip = old[2];
    game.global.maxSplit = old[3];
}

function setTitle() {
    if (aWholeNewWorld)
        document.title = game.global.world + ' Trimps';// + document.getElementById('versionNumber').innerHTML;
}

//Toggle settings button & filter messages accordingly.
function filterMessage2(what){
    var log = document.getElementById("log");

    displayed = (ATmessageLogTabVisible) ? false : true;
    ATmessageLogTabVisible = displayed;

    var toChange = document.getElementsByClassName(what + "Message");
    var btnText = (displayed) ? what : what + " off";
    var btnElem = document.getElementById(what + "Filter");
    btnElem.innerHTML = btnText;
    btnElem.className = "";
    btnElem.className = getTabClass(displayed);
    displayed = (displayed) ? "block" : "none";
    for (var x = 0; x < toChange.length; x++){
        toChange[x].style.display = displayed;
    }
    log.scrollTop = log.scrollHeight;
}

 //Replacement function for "World Info" tooltip to show current amount in seconds (Just adds the seconds)
 //Overwrites game function.
function formatMinutesForDescriptions(number){
    var text;
    var seconds = Math.floor((number*60) % 60);
    var minutes = Math.floor(number % 60);
    var hours = Math.floor(number / 60);
    if (hours == 0)
        text = minutes + " minutes " + seconds + " seconds";
    else if (minutes > 0) {
        if (minutes < 10) minutes = "0" + minutes;
        if (seconds < 10) seconds = "0" + seconds;
        text = hours + ":" + minutes + ":" + seconds;
    }
    else {
        var hs = (hours > 1) ? "s" : "";
        var ms = (minutes > 1) ? "s" : "";
        var ss = (seconds > 1) ? "s" : "";
        text = hours + " hour" + hs + " " + minutes + " minute" + ms + " " + seconds + " second" + ss;
    }
    //text += '<br><b>AutoTrimps</b>: Click anywhere in this World Info box to <u>Go AFK!</u>';
    return text;
}

//Log all javascript errors and catch them.
window.onerror = function catchErrors(msg, url, lineNo, columnNo, error) {
    var message = [
        'Message: ' + msg,
        'URL: ' + url,
        'Line: ' + lineNo,
        'Column: ' + columnNo,
        'Error object: ' + JSON.stringify(error)
    ].join(' - ');
    if (lineNo !=0)
        console.log("AT logged error: " + message);
    //ATServer.Upload(message);
};

function throwErrorfromModule() {
    throw new Error("We have successfully read the thrown error message out of a module");
}

function log1point25(val) {
  return Math.log(val) / Math.log(1.25);
}