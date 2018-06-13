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
    if (StartZone == -1 || currZone < StartZone || prestigeRaidMaxSoFar == currZone || PRaidMax <= 0)
        return;
    
    //return this after debugging
    //prestigeRaidMaxSoFar = currZone; //first time we're prestige raiding in this zone, only run attempt to raid once per zone
    
    var empowerment = getEmpowerment();
    var lastDigitZone = currZone % 10;
    var wantPrestigeUpTo; //the zone the alg decided to raid up to
    //there are 7 cases: poison/wind/ice (each 2 cases depending on zones xx1-xx5 or xx6-x10), and 7th case for no empowerment before zone 236.
    if (empowerment == "Ice"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5
            wantPrestigeUpTo = currZone - lastDigitZone + 5; //here aggressive is same as light because poison zones are coming up
        }
        else if (lastDigitZone > 5){ //xx6-xx9
            if(PAggro == 0){
                wantPrestigeUpTo = currZone - lastDigitZone + 11
            }
            else{ //PAggro == 1
                wantPrestigeUpTo = currZone - lastDigitZone + 13
            }
        }
        else { //xx0
            if(PAggro == 0){
                wantPrestigeUpTo = currZone + 1;
            }
            else
                wantPrestigeUpTo = currZone + 3;
        }
    }
    else if (empowerment == "Poison"){
        if(PAggro == 0){ //low aggro poison is fairly straightforward; get to last poison zone and farm 5 or 6 zones higher
            if(lastDigitZone == 0)
                wantPrestigeUpTo = currZone + 5;
            else if(lastDigitZone == 5)
                wantPrestigeUpTo = currZone + 6;
            else
                wantPrestigeUpTo = currZone;
        }
        else {//PAggro == 1
            if(lastDigitZone == 0)
                wantPrestigeUpTo = currZone + 5; //most available
            else if(lastDigitZone == 5)
                wantPrestigeUpTo = currZone + 10; //most available
            else if(lastDigitZone < 5)
                wantPrestigeUpTo = currZone - lastDigitZone + 5;
            else //xx6-xx9
                wantPrestigeUpTo = currZone - lastDigitZone + 15;
        }
    }
    else if (empowerment == "Wind"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5, fairly conservative because ice is coming up
            wantPrestigeUpTo = currZone - lastDigitZone + 5;
        }
        else if (lastDigitZone == 0){
            if(PAggro == 0)
                wantPrestigeUpTo = currZone + 1;
            else
                wantPrestigeUpTo = currZone + 5;
        }
        else{ //xx6-xx9
            if(PAggro == 0){
                wantPrestigeUpTo = currZone;
            }
            else {
                wantPrestigeUpTo = currZone - lastDigitZone + 15;
            }
        }
    }
    else{ //no empowerment, pre 236
        if (lastDigitZone <= 5)
            wantPrestigeUpTo = currZone - lastDigitZone + 5;
        else
            wantPrestigeUpTo = currZone - lastDigitZone + 15;
    }
    
    if (wantPrestigeUpTo > currZone + PRaidMax)
        wantPrestigeUpTo = currZone + PRaidMax; //dont go above user defined max
    
    //get currently owned prestige level
    var havePrestigeUpTo = calcPrestige();
    
    debug("StartZone = " + StartZone, "general", "");
    debug("PAggro = " + PAggro, "general", "");
    debug("PRaidMax = " + PRaidMax, "general", "");
    debug("currZone = " + currZone, "general", "");
    debug("havePrestigeUpTo = " + havePrestigeUpTo, "general", "");
    debug("wantPrestigeUpTo = " + wantPrestigeUpTo, "general", "");
    debug("empowerment = " + empowerment, "general", "");
    
    if(havePrestigeUpTo >= wantPrestigeUpTo){
        debug("have all the prestige levels that we want. exiting.", "general", "");
        return;
    }
    
    /*if (getPageSetting('AutoMaps') == 1)
        autoTrimpSettings["AutoMaps"].value = 0;
    
    if (!game.global.preMapsActive && !game.global.mapsActive) { 
        mapsClicked();
        if (!game.global.preMapsActive) 
            mapsClicked();
	debug("Beginning Prestige Raiding...");
    }
    
    if (game.options.menu.repeatUntil.enabled != 2)
        game.options.menu.repeatUntil.enabled = 2;
                
    if (game.global.preMapsActive){ 
        plusPres(); //sets the map sliders before buying the map for prestige
        if ((updateMapCost(true) <= game.resources.fragments.owned)) {
            buyMap();
            mapbought = true;
        }
        else if ((updateMapCost(true) > game.resources.fragments.owned)) {
            if (getPageSetting('AutoMaps') == 0 && !prestraid) {
                autoTrimpSettings["AutoMaps"].value = 1;
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
    if (getPageSetting('AutoMaps') == 0 && game.global.preMapsActive && prestraid && !failpraid) {
        autoTrimpSettings["AutoMaps"].value = 1;
        debug("Turning AutoMaps back on");
    }
    if (prestraid == true && game.global.world !== getPageSetting('Praidingzone')) {
        prestraid = false;
        prestraidon = false;
        mapbought = false;
    }*/
    //attempt to buy the desired map and run it until all prestige is gotten
    //if can't afford, buy the highest map possible.
    

    

}

function calcPrestige() {
    var max=1;
    var tmp;
    var equipmentPrestigeLevel;
    
    equipmentPrestigeLevel = game.equipment["Shield"].prestige;
    tmp = equipmentPrestigeLevel/2*10-10+1;
    if (tmp>max)
        max=tmp;
    
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
    
    equipmentPrestigeLevel = game.equipment["Shoulderguards"].prestige;
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
        max=tmp;
    
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
