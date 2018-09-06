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
    if (game.global.world >= robotrimpzone && !game.global.useShriek && (game.global.world - robotrimpzone) % 5 == 0){
        magnetoShriek();
        //if (MODULES["other"].enableRoboTrimpSpam)
        //    debug("Activated Robotrimp MagnetoShriek Ability @ z" + game.global.world, "graphs", '*podcast');
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
                //debug('Converted ' + nature + ' tokens to ' + targetNature, 'nature');
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
            //debug('Converted ' + nature + ' tokens to ' + targetNature, 'nature');
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

function findNextBionic() {
    var highestBionicMap = null;
    var maxLevel = game.global.world + getPageSetting('BWraidingmaxLevel');
    var cap = getPageSetting('BWraidingmax');
    if(maxLevel > cap)
        maxLevel = cap;

    for (var map of game.global.mapsOwnedArray){
        if (map.level > maxLevel || map.location !== "Bionic")
            continue;
        
        if(highestBionicMap == null){
            highestBionicMap = map;
            continue;
        }
        
        if (addSpecials(true, true, highestBionicMap) > 0){ //if we need prestiges from our map, only take a lower bionic if we need prestiges from it as well
            if(highestBionicMap.level > map.level && addSpecials(true, true, map) > 0)
                highestBionicMap = map;
        }
        else if(highestBionicMap.level < map.level)//we dont need anything from our bionic, so look for a higher one
            highestBionicMap = map;
    }
        
    if (highestBionicMap == null)
        return false;
    if (highestBionicMap.level > maxLevel || addSpecials(true, true, highestBionicMap) === 0) //if we already at max level and dont need gear, stop
    	return false;
    return highestBionicMap;
}

function lastPrestigeZone(){
    var max=1;
    var tmp;
    
    var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
    for (var i in prestigeList) {
        tmp = dropsAtZone(prestigeList[i], false);
        
        if (tmp>max)
            max=tmp;
    }
    
    prestigeState = 0;
    if(max % 1 > 0.35 && max % 1 < 0.45){
        //debug("only missing 1 armor prestige " + max);
        prestigeState = 1; //0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    }
    else if(max % 1 > 0.45){
        //debug("have everything from zone " + max);
        prestigeState = 2;
    }
    //if(prestigeState === 0)
        //debug("have 1-2 things from zone " + max);

    return Math.floor(max);
}

function dropsAtZone(itemName, nextLevel){
    var slotModifier=0;
    var calcNext;
    if(nextLevel === undefined)
        calcNext = false;
    else
        calcNext = nextLevel;
    switch(itemName){
        case "Dagadder":
                slotModifier=1.4;
                break;
            case "Bootboost": 
                slotModifier=1.5;
                break;
            case "Megamace":
                slotModifier=2.4;
                break;
            case "Hellishmet":
                slotModifier=2.5;
                break;
            case "Polierarm": 
                slotModifier=3.4;
                break;
            case "Pantastic": 
                slotModifier=3.5;
                break;
            case "Axeidic": 
                slotModifier=4.4;
                break;
            case "Smoldershoulder": 
                slotModifier=4.5;
                break;
            case "Greatersword": 
                slotModifier=5.2;
                break;
            case "Bestplate": 
                slotModifier=5.3;
                break;
            case "Harmbalest": 
                slotModifier=5.4; 
                break;
            case "GambesOP": 
                slotModifier=5.5;
                break;
            default:
                return 0;
    }
    
    return (game.upgrades[itemName].allowed+1)/2*10-(calcNext ? 0 : 10)+slotModifier;
}

function BWRaidNowLogic(){
    if (game.global.world < getPageSetting('BWraidingmin') || cycleZone() !== 4) return false;
    if (getPageSetting('BWraidDailyCOnly') && !(game.global.runningChallengeSquared || game.global.challengeActive)) return false;
    return true;
}

//returns true when done
function BWraiding() {
    if(!BWRaidNowLogic())
        return true;
    
    //find the lowest bionic map that still has items for us
    var nextBionicMap = findNextBionic();
    if(!nextBionicMap){
        //debug("could not find a bionic map to run. are you zone 125 yet?");
        return true;
    }
    
    if (!game.global.preMapsActive && !game.global.mapsActive)  //if we are in world, get to map screen
        mapsClicked(true);
    
    if(game.global.mapsActive){ //already in a map
        if(nextBionicMap == currMap){ //doing our BW map
            if (!game.global.repeatMap) {
                repeatClicked();
            } 
            while (game.options.menu.repeatUntil.enabled != 2) {
                toggleSetting('repeatUntil'); //repeat for all items
            }
            statusMsg = "BW Raiding " + nextBionicMap.level + ": "+ addSpecials(true, true, currMap);
        }
        else { //we're in another map
            if (game.global.repeatMap) {
                repeatClicked();
            } 
            statusMsg = "Finishing map";
        }
        return false;
    }

    selectMap(nextBionicMap.id);
    runMap();
    currMap = nextBionicMap;
    if (!game.global.repeatMap) {
        repeatClicked();
    } 
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
    statusMsg = "BW Raiding: "+ addSpecials(true, true, currMap);
    return false;
 }

//AutoAllocate Looting II
function lootdump() {
    if (game.global.world == 1 && !perked && getPageSetting('AutoAllocatePerks')==2) {
        viewPortalUpgrades();
        var currLevel = parseFloat(game.portal.Looting_II.level);
        var totalSpent = parseFloat(game.portal.Looting_II.heliumSpent);
        var totalUnspent = parseFloat(game.global.heliumLeftover); //this is for mid-run allocation
        //var totalUnspent = game.resources.helium.owned + game.global.heliumLeftover; //this is for portal allocation

        var amt = Math.floor(1/100*(Math.sqrt(2)*Math.sqrt(totalSpent+totalUnspent+451250)-950)) - currLevel;
        //debug("game.portal.Looting_II.level " + currLevel + " game.portal.Looting_II.heliumSpent " + totalSpent + " game.global.heliumLeftover " + totalUnspent);
        //debug("amt = " + amt);
        
        if(amt <= 0){
            perked = true;
            cancelPortal();
	    //debug("Done buying Looting II");
            return;
        }
        game.global.lastCustomAmt = amt;
        
        numTab(5, true);
        if (getPortalUpgradePrice("Looting_II")+game.resources.helium.totalSpentTemp <= game.resources.helium.respecMax) {
            buyPortalUpgrade('Looting_II');
            activateClicked();
            cancelPortal();
            debug('Bought ' + amt.toExponential(2) + ' Looting II');
        }
        else{
	    perked = true;
	    cancelPortal();
	    debug("Done buying Looting II");
        }
    }
}

function fightManualAT(){
    if(wantGoodShield != highDamageHeirloom){
        if(wantGoodShield == undefined)
            debug("error: wantGoodShield undefined!");
        if(highDamageHeirloom == undefined)
            debug("error: highDamageHeirloom undefined!");
        if(wantGoodShield)
            equipMainShield();
        else
            equipLowDmgShield();
    }
    fightManual();
}
