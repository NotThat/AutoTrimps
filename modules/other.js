MODULES["other"] = {};
MODULES["other"].enableRoboTrimpSpam = true;  //set this to false to stop Spam of "Activated Robotrimp MagnetoShriek Ability"
var prestraid = false;
var failpraid = false;
var bwraided = false;
var failbwraid = false;
var perked = false;
var prestraidon = false;
var cost = (updateMapCost(true));
var mapbought = false;
var prestigeRaidMaxSoFar = 0;
var maxDesiredLevel;
var minDesiredLevel;
var scaleUp; //if true, when minDesiredLevel = xx1 and we want to buy higher we will first run xx1 then xx2 until our desired level.
//Activate Robo Trimp (will activate on the first zone after liquification)
function autoRoboTrimp() {
    //exit if the cooldown is active, or we havent unlocked robotrimp.
    if (game.global.roboTrimpCooldown > 0 || !game.global.roboTrimpLevel) return;
    var robotrimpzone = parseInt(getPageSetting('AutoRoboTrimp'));
    //exit if we have the setting set to 0
    if (robotrimpzone == 0) return;
    //activate the button when we are above the cutoff zone, and we are out of cooldown (and the button is inactive)
    if (game.global.world >= robotrimpzone && !game.global.useShriek){
        magnetoShriek();
        if (MODULES["other"].enableRoboTrimpSpam)
            debug("Activated Robotrimp MagnetoShriek Ability @ z" + game.global.world, "graphs", '*podcast');
    }
}

//Version 3.6 Golden Upgrades
    //setting param : get the numerical value of the selected index of the dropdown box
function autoGoldenUpgradesAT(setting) {
    var num = getAvailableGoldenUpgrades();
    if (num == 0) return;       //if we have nothing to buy, exit.
    //Challenge^2 cant Get/Buy Helium, so adapt - do Derskagg mod.
    var challSQ = game.global.runningChallengeSquared;
    //Default: True = Always get 60% void by skipping the 12% upgrade then buying 14%/16%
    var goldStrat = getPageSetting('goldStrat');
    //Try to achieve 60% Void    
    if (setting == "Void" && (goldStrat == "Max then Helium" || goldStrat == "Zone")) {
      var nextVoidAmt = game.goldenUpgrades.Void.nextAmt().toFixed(2);
      if (nextVoidAmt == 0.12)   //skip the 6th void upgrade
        setting = "Helium";
      if (challSQ)  //always buy battle during max then helium mode.
        setting = "Battle";
    }
    //buy one upgrade per loop.
    var success = buyGoldenUpgrade(setting);

    var doDerskaggChallSQ = false;
    if (setting == ("Helium" || "Void") && challSQ)
        {doDerskaggChallSQ = true; setting = (challSQ) ? "Battle" : "Helium"}
    // DZUGAVILI MOD - SMART VOID GUs
    // Assumption: buyGoldenUpgrades is not an asynchronous operation and resolves completely in function execution.
    // Assumption: "Locking" game option is not set or does not prevent buying Golden Void
    var noBat = getPageSetting('goldNoBattle');  //true = no battle = buy helium
  //In 'Alternating' mode : instead of alternating between buying Helium and Battle, with this on it will only buy Helium.
    if (!success && setting == "Void" || doDerskaggChallSQ) {
        num = getAvailableGoldenUpgrades(); //recheck availables.
        if (num == 0) return;
        // DerSkagg Mod - Instead of Voids, For every Helium upgrade buy X-1 battle upgrades to maintain speed runs
        if (goldStrat == "Alternating") {
            var goldAlternating = getPageSetting('goldAlternating');
            setting = (game.global.goldenUpgrades%goldAlternating == 0 || noBat) ? "Helium" : "Battle";
        } else if (goldStrat == "Zone") {
            var goldZone = getPageSetting('goldZone');
            setting = (game.global.world <= goldZone || noBat) ? "Helium" : "Battle";
        } else if (goldStrat == "Max then Helium") {
            setting = (challSQ) ? "Battle" : "Helium";
        } else
            setting = (challSQ) ? "Battle" : "Helium";
        buyGoldenUpgrade(setting);
    }
    // END OF DerSkagg & DZUGAVILI MOD
//} catch(err) { debug("Error in autoGoldenUpgrades: " + err.message, "general"); }
}

//auto spend nature tokens
function autoNatureTokens() {
    var changed = false;
    for (var nature in game.empowerments) {
        var empowerment = game.empowerments[nature];
        var setting = getPageSetting('Auto' + nature);
        if (!setting || setting == 'Off') continue;

        //buy/convert once per nature per loop
        if (setting == 'Empowerment') {
            var cost = getNextNatureCost(nature);
            if (empowerment.tokens < cost)
                continue;
            empowerment.tokens -= cost;
            empowerment.level++;
            changed = true;
            debug('Upgraded Empowerment of ' + nature, 'nature');
        }
        else if (setting == 'Transfer') {
            if (empowerment.retainLevel >= 80)
                continue;
            var cost = getNextNatureCost(nature, true);
            if (empowerment.tokens < cost) continue;
            empowerment.tokens -= cost;
            empowerment.retainLevel++;
            changed = true;
            debug('Upgraded ' + nature + ' transfer rate', 'nature');
        }
        else if (setting == 'Convert to Both') {
            if (empowerment.tokens < 20) continue;
            for (var targetNature in game.empowerments) {
                if (targetNature == nature) continue;
                empowerment.tokens -= 10;
                var convertRate = (game.talents.nature.purchased) ? ((game.talents.nature2.purchased) ? 8 : 6) : 5;
                game.empowerments[targetNature].tokens += convertRate;
                changed = true;
                debug('Converted ' + nature + ' tokens to ' + targetNature, 'nature');
            }
        }
        else {
            if (empowerment.tokens < 10)
                continue;
            var match = setting.match(/Convert to (\w+)/);
            var targetNature = match ? match[1] : null;
            //sanity check
            if (!targetNature || targetNature === nature || !game.empowerments[targetNature]) continue;
            empowerment.tokens -= 10;
            var convertRate = (game.talents.nature.purchased) ? ((game.talents.nature2.purchased) ? 8 : 6) : 5;
            game.empowerments[targetNature].tokens += convertRate;
            changed = true;
            debug('Converted ' + nature + ' tokens to ' + targetNature, 'nature');
        }
    }
    if (changed)
        updateNatureInfoSpans();
}

//Check if currently in a Spire past IgnoreSpiresUntil
function isActiveSpireAT() {
    return game.global.spireActive && game.global.world >= getPageSetting('IgnoreSpiresUntil');
}

//Exits the Spire after completing the specified cell.
function exitSpireCell() {
    if(isActiveSpireAT() && game.global.lastClearedCell >= getPageSetting('ExitSpireCell')-1)
        endSpire();
}

//sets map sliders for the map purchase
function plusPres() {
        document.getElementById("biomeAdvMapsSelect").value = "Random";
        document.getElementById('advExtraLevelSelect').value = plusMapToRun(game.global.world); //returns delta map for all prestige
        document.getElementById('advSpecialSelect').value = "p";
        document.getElementById("lootAdvMapsRange").value = 0;
        document.getElementById("difficultyAdvMapsRange").value = 9;
        document.getElementById("sizeAdvMapsRange").value = 9;
        document.getElementById('advPerfectCheckbox').checked = false;
        updateMapCost();
        }
    
function plusMapToRun(zone) {   
    if (zone % 10 == 9)
        return 6;
    else if (zone % 10 <5)
        return 5 - zone % 10;
    else
        return 11 - zone % 10;
    }

function findLastBionic() {
         for (var i = game.global.mapsOwnedArray.length -1; i>=0; i--) {
              if (game.global.mapsOwnedArray[i].location === "Bionic") {
                  return game.global.mapsOwnedArray[i];
                  }
              }
         }

//Praiding

function PrestigeRaid() {
    var StartZone = getPageSetting('PRaidingZoneStart'); //from this zone we prestige raid. -1 to ignore
    var PAggro = getPageSetting('PAggression'); //0 - light 1 - aggressive. 
    var PRaidMax = getPageSetting('PRaidingMaxZones'); //max zones to plus map
    var currZone = game.global.world;
    
    if (PRaidMax > 10){
        PRaidMax = 10;
        setPageSetting('PRaidingMaxZones', 10);
    }
    if (PRaidMax < 0){
        PRaidMax = 0;
        setPageSetting('PRaidingMaxZones', 0);
    }
    
    //this stops sitting in map selection screen with auto maps disabled
    if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && startedMap) {
        autoTrimpSettings["AutoMaps"].value = 1;
        startedMap = false;
        debug("Turning AutoMaps back on. startedMap off.");
    }
    
    if (StartZone == -1 || currZone < StartZone || prestigeRaidMaxSoFar == currZone || PRaidMax <= 0 || getPageSetting('AutoMaps') == 0)
        return;
    
    //debug("addbreedTimerInsideText.innerHTML = " + addbreedTimerInsideText.innerHTML);
    var armyReady = (game.resources.trimps.realMax()-game.resources.trimps.owned>0 ? false : true);
    if(!armyReady){  //may as well stay in the world until army ready. may not be true for some dailies
        if (getEmpowerment() == "Poison"){
            if(currZone % 10 != 5 && currZone % 10 != 0) //in poison xx0 and xx5, we are willing to sit and wait in map screen to be sure not to miss our last poison zone
                return;
        }
        else //ice/wind/no empowerment: always stay in world if army isnt ready
            return;
    }
    
    prestigeRaidMaxSoFar = currZone; //first time we're prestige raiding in this zone, only attempt to raid once per zone
    
    var havePrestigeUpTo = calcPrestige(); //check currently owned prestige levels
    findDesiredMapLevel(currZone, PRaidMax, PAggro, havePrestigeUpTo); //the zone the alg decided to raid up to
    
    debug("currZone = " + currZone, "general", "");
    debug("empowerment = " + getEmpowerment(), "general", "");
    debug("maxDesiredLevel = " + maxDesiredLevel, "general", "");
    debug("minDesiredLevel = " + minDesiredLevel, "general", "");
    debug("havePrestigeUpTo = " + havePrestigeUpTo, "general", "");

    if(havePrestigeUpTo >= maxDesiredLevel){
        debug("have all the prestige levels that we want. exiting.", "general", "");
        return;
    }
    if(minDesiredLevel < havePrestigeUpTo + 1)
        minDesiredLevel = havePrestigeUpTo + 1;
    
    var fragments = game.resources.fragments.owned; //our available fragments
    
    //find highest map level we can afford
    var foundSuitableMap = false;
    var cost
    if (!scaleUp)
        for(i = maxDesiredLevel; i >= minDesiredLevel; i--){
            baseLevel = currZone;
            sizeSlider=9;
            diffSlider=9;
            lootSlider=0;
            specialMod="Prestigious";
            perfect=false;
            extraLevels = i-currZone;
            type="Random";
                 //calcMapCost(currZone,   0-9,       0-9,        0-9,        "Prestigious"/"FA"/"LMC"/"", boolean, 0-10, "Random"/other){ 
            cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);

            if (cost/fragments < 3 && cost/fragments > 1){ //can almost afford, lets get it
                debug("loosening map");
                diffSlider = 5;
                cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                if (cost/fragments > 1){ //can almost afford, lets get it
                    debug("loosening further");
                    specialMod = "";
                    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                }
            }
            else if (cost/fragments < 0.01){ //can easily affordd
                debug("maximizing map");
                lootSlider=9;
                perfect=true;
                type="Garden";
                cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                //just in case..
                if (cost/fragments > 1){
                    lootSlider = 0;
                    perfect = false;
                    type="Random";
                    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                }
            }
            if (cost/fragments > 1 && (i == minDesiredLevel || (currZone % 10 == 5 && getEmpowerment() == "Poison"))){//last attempt to buy a map. also do this on xx5 poison zones
                debug("last attempt to buy map");
                diffSlider=0;
                cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                if (cost/fragments > 1){
                    sizeSlider=0;
                    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                    if (cost/fragments > 1){
                        specialMod="";
                        cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                    }
                }
            }
            if(fragments >= cost){
                debug("found suitable map", "general", "");
                debug("cost " + cost.toPrecision(3) + " out of " + fragments.toPrecision(3) + " available fragments.", "general", "");
                debug("map level " + (currZone+extraLevels), "general", "");

                foundSuitableMap = true;
                i = -1;
            }
        }
    else {
        for(i = minDesiredLevel; i <= maxDesiredLevel; i++){
            baseLevel = currZone;
            sizeSlider=9;
            diffSlider=9;
            lootSlider=0;
            specialMod="Prestigious";
            perfect=false;
            extraLevels = i-currZone;
            type="Random";

            cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
            if (cost/fragments < 3 && cost/fragments > 1){ //can almost afford, lets get it
                debug("loosening map");
                diffSlider = 7;
                cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                if (cost/fragments > 1){ //can almost afford, lets get it
                    debug("loosening further");
                    specialMod = "";
                    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                }
            }
            else if (cost/fragments < 0.02){ //can easily afford
                debug("maximizing map");
                lootSlider=9;
                perfect=true;
                cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                //just in case..
                if (cost/fragments > 1){
                    lootSlider = 0;
                    perfect = false;
                    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
                }
            }
            if(fragments >= cost){
                debug("found suitable map", "general", "");
                debug("cost " + cost.toPrecision(3) + " out of " + fragments.toPrecision(3) + " available fragments.", "general", "");
                debug("map level " + (currZone+extraLevels), "general", "");

                foundSuitableMap = true;
                i = maxDesiredLevel+1;
            }
        }
    }
    
    if (!foundSuitableMap){
        debug("could not find suitable map.");
        debug("cheapest map level " + (currZone+extraLevels) + "  would cost " + cost + " fragments");
        debug("exiting.");
        scaleUp = false;
        return;
    }
    
    //attempt to buy the desired map and run it until all prestige is gotten
    if (getPageSetting('AutoMaps') == 1)
        autoTrimpSettings["AutoMaps"].value = 0;
    
    if (!game.global.preMapsActive && !game.global.mapsActive) { 
        mapsClicked();
        if (!game.global.preMapsActive) 
            mapsClicked();
	debug("Entered map screeen");
    }
    
    if (game.options.menu.repeatUntil.enabled != 2)
        game.options.menu.repeatUntil.enabled = 2;
                
    if (game.global.preMapsActive){ 
        //sets the map sliders before buying the map for prestige
        document.getElementById("biomeAdvMapsSelect").value = type;
        document.getElementById('advExtraLevelSelect').value = extraLevels; //returns delta map for all prestige
        if(specialMod == "Prestigious")
            document.getElementById('advSpecialSelect').value = "p"; 
        else if(specialMod == "FA")
            document.getElementById('advSpecialSelect').value = "fa"; 
        else if(specialMod == "LMC")
            document.getElementById('advSpecialSelect').value = "lmc"; 
        else
            document.getElementById('advSpecialSelect').value = "0";
        document.getElementById("lootAdvMapsRange").value = lootSlider;
        document.getElementById("difficultyAdvMapsRange").value = diffSlider;
        document.getElementById("sizeAdvMapsRange").value = sizeSlider;
        document.getElementById('advPerfectCheckbox').checked = perfect;
        updateMapCost();        
        
        if ((updateMapCost(true) <= game.resources.fragments.owned)) {
            buyMap();
            mapbought = true;
        }
        else if ((updateMapCost(true) > game.resources.fragments.owned)) {
            if (getPageSetting('AutoMaps') == 0) {
                autoTrimpSettings["AutoMaps"].value = 1;
                mapbought = false;
                debug("Failed to prestige raid. We can't afford the map.");
                debug("Expected map level " + (currZone+extraLevels) + " is " + cost + " and we have " + fragments + " frags.");
            }
            return;
        }
    }
    if (mapbought == true) {
        selectMap(game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id);
        runMap();
        startedMap = true;
        debug("startedMap on");
    }
    if (!game.global.repeatMap) {
        repeatClicked();
    }
    mapbought = false;
    if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && startedMap) {
        autoTrimpSettings["AutoMaps"].value = 1;
        startedMap = false;
        debug("Turning AutoMaps back on");
    }
    
    if(scaleUp)
    {
        prestigeRaidMaxSoFar = currZone -1;
    }
}

function findDesiredMapLevel(currZone, PRaidMax, PAggro, havePrestigeUpTo){
    var ret;
    var empowerment = getEmpowerment();
    var lastDigitZone = currZone % 10;
    
    scaleUp = false; //by default, we want to buy the highest level map and just run that one map for prestige
    
    //are we in an active spire? if so we always want +5 map levels
    if(currZone % 100 == 0 && currZone >= getPageSetting('IgnoreSpiresUntil')){
        debug("active spire mode");
        maxDesiredLevel = currZone + 5;
        minDesiredLevel = currZone + 1;
    }
    //there are 7 cases: poison/wind/ice (each 2 cases depending on zones xx1-xx5 or xx6-x10), and 7th case for no empowerment before zone 236.
    else if (empowerment == "Ice"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5 here aggressive is same as light because poison zones are coming up
            maxDesiredLevel = currZone - lastDigitZone + 5; 
            minDesiredLevel = currZone - lastDigitZone + 1; 
        }
        else if (lastDigitZone > 5){ //xx6-xx9
            if(PAggro == 0){
                maxDesiredLevel = currZone - lastDigitZone + 11;
                minDesiredLevel = currZone - lastDigitZone + 11;
            }
            else{ //PAggro == 1
                scaleUp = true; //special case, we want to run xx1 then xx2 then xx3 for faster clear
                maxDesiredLevel = currZone - lastDigitZone + 13;
                minDesiredLevel = currZone - lastDigitZone + 11;
            }
        }
        else { //xx0
            if(PAggro == 0){
                maxDesiredLevel = currZone + 1;
                minDesiredLevel = currZone + 1;
            }
            else{
                maxDesiredLevel = currZone + 3;
                minDesiredLevel = currZone + 1;
            }
        }
    }
    else if (empowerment == "Poison"){
        if(PAggro == 0){ //low aggro poison is fairly straightforward; get to last poison zone and farm 5 or 6 zones higher
            if(lastDigitZone == 0){
                maxDesiredLevel = currZone + 5;
                minDesiredLevel = currZone + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = currZone + 6;
                minDesiredLevel = currZone + 6;
            }
            else{
                maxDesiredLevel = currZone - lastDigitZone + 5;
                minDesiredLevel = currZone - lastDigitZone + 5;
            }
        }
        else {//PAggro == 1
            if(lastDigitZone == 0){
                maxDesiredLevel = currZone + 5; //most available
                minDesiredLevel = currZone + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = currZone + 10; //most available
                minDesiredLevel = currZone + 6;
            }
            else if(lastDigitZone < 5){
                maxDesiredLevel = currZone - lastDigitZone + 5;
                minDesiredLevel = currZone + 1; //+1 level is still fine, just dont get xx6
            }
            else{ //xx6-xx9
                maxDesiredLevel = currZone - lastDigitZone + 15;
                if(maxDesiredLevel > currZone + 7)
                    maxDesiredLevel = currZone+7;
                minDesiredLevel = currZone - lastDigitZone + 11;
            }
        }
    }
    else if (empowerment == "Wind"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5, fairly conservative because ice is coming up
            maxDesiredLevel = currZone - lastDigitZone + 5;
            minDesiredLevel = currZone - lastDigitZone + 1;
        }
        else if (lastDigitZone == 0){
            if(PAggro == 0){
                maxDesiredLevel = currZone + 1;
                minDesiredLevel = currZone + 1;
            }
            else{
                maxDesiredLevel = currZone + 1;
                minDesiredLevel = currZone + 1;
            }
        }
        else{ //xx6-xx9
            if(PAggro == 0){ 
                maxDesiredLevel = currZone - lastDigitZone + 11;
                minDesiredLevel = currZone - lastDigitZone + 11;
            }
            else {
                maxDesiredLevel = currZone - lastDigitZone + 11;
                minDesiredLevel = currZone - lastDigitZone + 11;
            }
        }
    }
    else{ //no empowerment, pre 236
        if (lastDigitZone <= 5){
            maxDesiredLevel = currZone - lastDigitZone + 5;
            minDesiredLevel = currZone + 1;
        }
        else{
            maxDesiredLevel = currZone - lastDigitZone + 15;
            minDesiredLevel = currZone - lastDigitZone + 11;
        }
    }
    
    if (maxDesiredLevel > currZone + PRaidMax)
        maxDesiredLevel = currZone + PRaidMax; //dont go above user defined max
    if(lastDigitZone <= 5 && minDesiredLevel < currZone) //always want to keep prestige at least upto current zone
        minDesiredLevel = currZone;
    if (minDesiredLevel > maxDesiredLevel)
        minDesiredLevel = maxDesiredLevel;
}

function calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type){
    var baseCost = sizeSlider + diffSlider + lootSlider;
    baseCost = baseCost * (baseLevel >= 60 ? 0.74 : 1);
    if(specialMod == "Prestigious")
        baseCost += 10;
    if(specialMod == "FA")
        baseCost += 7;
    if(specialMod == "LMC")
        baseCost += 18;
    baseCost += (perfect ? 6 : 0);
    baseCost += 10 * extraLevels;
    baseCost += baseLevel;
    baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost  - 1))) * baseLevel  * 2) * Math.pow((1.03 + (baseLevel / 50000)), baseLevel))* (type == "Random" ? 1 : 2);
    return baseCost;
}

function plusPrestige(delta) {
        document.getElementById("biomeAdvMapsSelect").value = "Random";
        document.getElementById('advExtraLevelSelect').value = delta; //returns delta map for all prestige
        document.getElementById('advSpecialSelect').value = "p";
        document.getElementById("lootAdvMapsRange").value = 0;
        document.getElementById("difficultyAdvMapsRange").value = 9;
        document.getElementById("sizeAdvMapsRange").value = 9;
        document.getElementById('advPerfectCheckbox').checked = false;
        updateMapCost();
}

/*function updateMapCost(getValue){
	var mapLevel =  parseInt(document.getElementById("mapLevelInput").value, 10);
	var baseCost = 0;
	if (mapLevel > game.global.world || mapLevel < 6 || isNaN(mapLevel)) return;
	//Sliders: 27 total * 0.74 = ~20
	baseCost += getMapSliderValue("size");
	baseCost += getMapSliderValue("loot");
	baseCost += getMapSliderValue("difficulty");
	baseCost *= (game.global.world >= 60) ? 0.74 : 1;
	//Special Modifier
	var specialModifier = getSpecialModifierSetting();
	if (specialModifier != "0"){
		baseCost += mapSpecialModifierConfig[specialModifier].costIncrease;
	}
	//Perfect Checkbox
	if (checkPerfectChecked()){
		baseCost += 6;
	}
	//Extra Levels
	var extraLevels = getExtraMapLevels();
	if (extraLevels > 0){
		baseCost += (10 * extraLevels);
	}
	baseCost += mapLevel;
	baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost - 1))) * mapLevel * 2) * Math.pow((1.03 + (mapLevel / 50000)), mapLevel));
	if (document.getElementById("biomeAdvMapsSelect").value != "Random") baseCost *= 2;
	if (getValue) return baseCost;
	document.getElementById("mapCostFragmentCost").innerHTML = prettify(baseCost);
}
 var mapSpecialModifierConfig = {
	fa: {
		name: "Fast Attacks",
		unlocksAt: 60,
		get description(){
			var text = "All attacks in this map happen 100ms faster.";
			if (game.talents.hyperspeed2.purchased) text += " <span style='color: red'>Does not stack with Hyperspeed II</span>";
			return text;
		},
		costIncrease: 7,
		abv: "FA"
	},
	lc: {
		name: "Large Cache",
		unlocksAt: 60,
		description: "Earn 20 seconds of production for either food, wood, or metal at random each time you complete this map.",
		costIncrease: 7,
		cache: true,
		onCompletion: function (){
			cacheReward("random", 20, this.name);
		},
		abv: "LC"
	},
	ssc: {
		name: "Small Savory Cache",
		unlocksAt: 85,
		description: "Earn 10 seconds of food production each time you complete this map.",
		costIncrease: 10,
		cache: true,
		onCompletion: function () {
			cacheReward("food", 10, this.name);
		},
		abv: "SSC"
	},
	swc: {
		name: "Small Wooden Cache",
		unlocksAt: 85,
		description: "Earn 10 seconds of wood production each time you complete this map.",
		costIncrease: 10,
		cache: true,
		onCompletion: function () {
			cacheReward("wood", 10, this.name);
		},
		abv: "SWC"
	},
	smc: {
		name: "Small Metal Cache",
		unlocksAt: 85,
		description: "Earn 10 seconds of metal production each time you complete this map.",
		costIncrease: 10,
		cache: true,
		onCompletion: function () {
			cacheReward("metal", 10, this.name);
		},
		abv: "SMC"
	},
	p: {
		name: "Prestigious",
		unlocksAt: 135,
		description: "This map can hold two different equipment prestige upgrades, if two are available.",
		costIncrease: 10,
		abv: "P"
	},
	hc: {
		name: "Huge Cache",
		unlocksAt: 160,
		description: "Earn 40 seconds of production for either food, wood, or metal at random each time you complete this map.",
		costIncrease: 14,
		cache: true,
		onCompletion: function () {
			cacheReward("random", 40, this.name);
		},
		abv: "HC"
	},
	lsc: {
		name: "Large Savory Cache",
		unlocksAt: 185,
		description: "Earn 20 seconds of food production each time you complete this map.",
		costIncrease: 18,
		cache: true,
		onCompletion: function () {
			cacheReward("food", 20, this.name);
		},
		abv: "LSC"
	},
	lwc: {
		name: "Large Wooden Cache",
		unlocksAt: 185,
		description: "Earn 20 seconds of wood production each time you complete this map.",
		costIncrease: 18,
		cache: true,
		onCompletion: function () {
			cacheReward("wood", 20, this.name);
		},
		abv: "LWC"
	},
	lmc: {
		name: "Large Metal Cache",
		unlocksAt: 185,
		description: "Earn 20 seconds of metal production each time you complete this map.",
		costIncrease: 18,
		cache: true,
		onCompletion: function () {
			cacheReward("metal", 20, this.name);
		},
		abv: "LMC"
	}
};
 **/

function calcPrestige() {
    var max=1;
    var tmp;
    var equipmentPrestigeLevel;
    
    /*equipmentPrestigeLevel = game.equipment["Shield"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+1;
    if (tmp>max)
        max=tmp;*/
    
    equipmentPrestigeLevel = game.equipment["Dagger"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+1;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Boots"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+1;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Mace"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+2;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Helmet"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+2;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Polearm"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+3;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Pants"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+3;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Battleaxe"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+4;
    if (tmp>max)
        max=tmp;
    
    /*equipmentPrestigeLevel = game.equipment["Shoulderguards"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+4;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Greatsword"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+5;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Breastplate"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+5;
    if (tmp>max)
        max=tmp;*/
    
    equipmentPrestigeLevel = game.equipment["Arbalest"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+5;
    if (tmp>max)
        max=tmp;
    
    equipmentPrestigeLevel = game.equipment["Gambeson"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+5;
    if (tmp>max)
        max=tmp;
    
    return max;
}

function Praiding() {
   	        if (game.global.world == getPageSetting('Praidingzone') && !prestraid && !failpraid) {
	        prestraidon = true; 
                
                if (getPageSetting('AutoMaps') == 1 && !prestraid && !failpraid) {
                autoTrimpSettings["AutoMaps"].value = 0;
                }
                if (!game.global.preMapsActive && !game.global.mapsActive && !prestraid && !failpraid) { 
                    mapsClicked();
		    if (!game.global.preMapsActive) {
                        mapsClicked();
                    }
		    debug("Beginning Prestige Raiding...");
                }
                if (game.options.menu.repeatUntil.enabled!=2 && !prestraid && !failpraid) {
                    game.options.menu.repeatUntil.enabled = 2;
                }
                if (game.global.preMapsActive && !prestraid && !failpraid) { 
                plusPres(); //sets the map sliders before buying the map for prestige
                if ((updateMapCost(true) <= game.resources.fragments.owned)) {
                    buyMap();
                    failpraid = false;
		    mapbought = true;
                }
                    else if ((updateMapCost(true) > game.resources.fragments.owned)) {
                        if (getPageSetting('AutoMaps') == 0 && !prestraid) {
                            autoTrimpSettings["AutoMaps"].value = 1;
                            failpraid = true;
			    prestraidon = false;
			    mapbought = false;
                            debug("Failed to prestige raid. Looks like you can't afford to..");
                    }
                    return;

                }
	}
		if (mapbought == true) {
                selectMap(game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id);
		runMap();
                }
                if (!prestraid && !failpraid && !game.global.repeatMap) {
                    repeatClicked();
		    debug("...Successfully prestiged!");
                }
	        prestraid = true;
		prestraidon = false;
		mapbought = false;
	}
    if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && prestraid && !failpraid) {
             autoTrimpSettings["AutoMaps"].value = 1;
	     debug("Turning AutoMaps back on");
    	     }
    if (prestraid == true && game.global.world !== getPageSetting('Praidingzone')) {
             prestraid = false;
	     prestraidon = false;
             mapbought = false;
             }
			 
}
 


//BWraiding
//BWrmn
//BWrmx
function BWraiding() {
    if (!prestraidon && game.global.world == getPageSetting('BWraidingz') && !bwraided && !failbwraid && getPageSetting('BWraid')) {
        if (getPageSetting('AutoMaps') == 1 && game.global.world >= getPageSetting('BWraidingz') && !bwraided && !failbwraid) {
            autoTrimpSettings["AutoMaps"].value = 0;
        }
        if (!game.global.preMapsActive && !game.global.mapsActive && game.global.world >= getPageSetting('BWraidingz') && !bwraided && !failbwraid) { 
            mapsClicked();
 	    if (!game.global.switchToMaps) {
                mapsClicked();
            }
        }
        if (game.options.menu.repeatUntil.enabled != 2 && game.global.world >= getPageSetting('BWraidingz') && !bwraided && !failbwraid) {
            game.options.menu.repeatUntil.enabled = 2;
        }
        if (game.global.world >= getPageSetting('BWraidingz') && game.global.preMapsActive && !bwraided && !failbwraid) {
        selectMap(findLastBionic().id);
        failbwraid = false;
	debug("Beginning BW Raiding...");
        }
        else if (game.global.world >= getPageSetting('BWraidingz') && game.global.preMapsActive && !bwraided && !failbwraid) {
                 if (getPageSetting('AutoMaps') == 0 && game.global.world >= getPageSetting('BWraidingz') && !bwraided) {
                     autoTrimpSettings["AutoMaps"].value = 1;
                     failbwraid = true;
                     debug("Failed to BW raid. Looks like you don't have a BW to raid...");
                     }
                     return;
        
        }
	if (findLastBionic().level <= getPageSetting('BWraidingmax') && !bwraided && !failbwraid) {
        runMap();
	}
        if (!game.global.repeatMap && game.global.world >= getPageSetting('BWraidingz') && !bwraided && !failbwraid && getCurrentMapObject().level > getPageSetting('BWraidingz') && game.global.mapsActive) {
            repeatClicked();
	}
	else if (game.global.repeatMap && game.global.world >= getPageSetting('BWraidingz') && !bwraided && !failbwraid && getCurrentMapObject().level <= getPageSetting('BWraidingz') && game.global.mapsActive) {
                 repeatClicked();
        }
	if (findLastBionic().level > getPageSetting('BWraidingmax') && !bwraided && !failbwraid) {
            bwraided = true;
            failbwraid = false;
            debug("...Successfully BW raided!");
        if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && game.global.world >= getPageSetting('BWraidingz') && bwraided && !failbwraid) {
            autoTrimpSettings["AutoMaps"].value = 1;
        }
    }
    }
	else if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && bwraided && !failbwraid) {
             autoTrimpSettings["AutoMaps"].value = 1;
	     debug("Turning AutoMaps back on");
	}
	     if (bwraided == true && game.global.world !== getPageSetting('BWraidingz')) {
             bwraided = false;
             }
    
 }
//AutoAllocate Looting II
function lootdump() {
if (game.global.world==getPageSetting('lootdumpz') && !perked && getPageSetting('AutoAllocatePerks')==2 && getPageSetting('lootdumpa') > 0 && getPageSetting('lootdumpz') > 0) {
	    viewPortalUpgrades();
	    game.global.lastCustomAmt = getPageSetting('lootdumpa');
	    numTab(5, true);
	    if (getPortalUpgradePrice("Looting_II")+game.resources.helium.totalSpentTemp <= game.resources.helium.respecMax) {
		buyPortalUpgrade('Looting_II');
		activateClicked();
		cancelPortal();
		debug('Bought ' + getPageSetting('lootdumpa') + ' Looting II');
	     }
	else {
	     perked = true;
	     cancelPortal();
	     debug("Done buying Looting II");
	     }
	}
else if (perked == true && game.global.world !== getPageSetting('lootdumpz')) {
         perked = false;
             }
}
