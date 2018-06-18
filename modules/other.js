MODULES["other"] = {};
MODULES["other"].enableRoboTrimpSpam = true;  //set this to false to stop Spam of "Activated Robotrimp MagnetoShriek Ability"
var bwraided = false;
var failbwraid = false;
var perked = false;
var cost = (updateMapCost(true));


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
    if(game.global.challengeActive == "Daily"){
        if(isActiveSpireAT() && game.global.lastClearedCell >= getPageSetting('ExitSpireCellDailyC2')-1 && getPageSetting('ExitSpireCellDailyC2') > 0)
            endSpire();
    }
    else if(isActiveSpireAT() && game.global.lastClearedCell >= getPageSetting('ExitSpireCell')-1 && getPageSetting('ExitSpireCell') > 0)
        endSpire();
}

function findLastBionic(maxLevel) {
    var highestBionicMap = -1;
    //for (var i = game.global.mapsOwnedArray.length-1; i>=0; i--) {
    for (var i = 0; i<game.global.mapsOwnedArray.length; i++) {
        if (game.global.mapsOwnedArray[i].location === "Bionic" && game.global.mapsOwnedArray[i].level <= maxLevel){
            if(highestBionicMap == -1 || game.global.mapsOwnedArray[i].level > highestBionicMap.level)
            highestBionicMap = game.global.mapsOwnedArray[i];
        }
    } 
    if (highestBionicMap == -1)
        return false;
    return highestBionicMap;
}

function calcPrestige() {
    var max=1;
    var tmp;
    var slotModifier=0;
    
    var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
    //var numUnbought = 0;
    for (var i in prestigeList) {
        var p = prestigeList[i];
        switch(prestigeList[i]){
            case "Dagadder":
                slotModifier=1;
                break;
            case "Bootboost": 
                slotModifier=1;
                break;
            case "Megamace":
                slotModifier=2;
                break;
            case "Hellishmet":
                slotModifier=2;
                break;
            case "Polierarm": 
                slotModifier=3;
                break;
            case "Pantastic": 
                slotModifier=3;
                break;
            case "Axeidic": 
                slotModifier=4;
                break;
            case "Smoldershoulder": 
                slotModifier=4;
                break;
            case "Greatersword": 
                slotModifier=1; //dont count as full prestige until we have gambes
                break;
            case "Bestplate": 
                slotModifier=1; //dont count as full prestige until we have gambes
                break;
            case "Harmbalest": 
                slotModifier=1; //dont count as full prestige until we have gambes
                break;
            case "GambesOP": 
                slotModifier=5;
                break;
            default:
                debug("calcPrestige default i " + i + " prestigeList[i] = " + prestigeList[i]);
        }
        tmp = (game.upgrades[p].allowed+1)/2*10-10+slotModifier;
        if (tmp>max)
            max=tmp;
    }

    return max;
}

//returns true when done
function BWraiding() {
    if (game.global.world == getPageSetting('BWraidingz') && getPageSetting('BWraid')) {
        
        if(game.global.mapsActive){ //already in a map
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            if (game.options.menu.repeatUntil.enabled != 2) {
                game.options.menu.repeatUntil.enabled = 2; //repeat for all items
            }
            if(getCurrentMapObject().location === "Bionic")
                updateAutoMapsStatus("", "BW Raiding");
            else
                updateAutoMapsStatus("", "Finishing map");
            return false;
        }
        
        if (!game.global.preMapsActive) { 
            mapsClicked();
 	    if (!game.global.switchToMaps) {
                mapsClicked();
            }
        }
        
        var lastBionicMap = findLastBionic(getPageSetting('BWraidingmax'));
        if(!lastBionicMap){
            debug("could not find a bionic map to run.");
            return true;
        }
        
        selectMap(lastBionicMap.id);
        runMap();
        if (game.options.menu.repeatUntil.enabled != 2) {
            game.options.menu.repeatUntil.enabled = 2; //repeat for all items
        }
        if (!game.global.repeatMap) {
            repeatClicked();
        }
        updateAutoMapsStatus("", "BW Raiding");
        return false;
	
	if (lastBionicMap.level > getPageSetting('BWraidingmax')) {
            debug("...Successfully BW raided!");
            return true;
        }
    }
    return true;
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
