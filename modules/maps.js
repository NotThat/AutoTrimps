MODULES["maps"] = {};
//These can be changed (in the console) if you know what you're doing:
MODULES["maps"].enoughDamageCutoff = 6; //above this the game will do maps for map bonus stacks
MODULES["maps"].poisonMult = 30; //how much bonus damage to treat poison zones as giving us
MODULES["maps"].farmingCutoff = 16; //above this the game will farm.
MODULES["maps"].numHitsSurvived = 8; //survive X hits in D stance or not enough Health.
MODULES["maps"].LeadfarmingCutoff = 10; //lead has its own farmingCutoff
MODULES["maps"].NomfarmingCutoff = 10; //nom has its own farmingCutoff
MODULES["maps"].NurseryMapLevel = 50; //with blacksmithery, run map for nursery on this level
//if FarmWhenNomStacks7 setting is on   = [x, y, z];
MODULES["maps"].NomFarmStacksCutoff = [7, 30, 100];
//[x] get maxMapBonus (10) if we go above (7) stacks on Improbability (boss)
//[y] go into maps on (30) stacks on Improbability (boss), farm until we fall under the 'NomfarmingCutoff' (10)
//[z] restarts your voidmap if you hit (100) stacks
MODULES["maps"].MapTierZone = [72, 47, 16]; //descending order for these.
//                 .MapTier?Sliders = [size,difficulty,loot,biome];
MODULES["maps"].MapTier0Sliders = [9, 9, 9, 'Mountain']; //Zone 72+ (old: 9/9/9 Metal)
MODULES["maps"].MapTier1Sliders = [9, 9, 9, 'Depths']; //Zone 47-72 (old: 9/9/4 Metal)
MODULES["maps"].MapTier2Sliders = [9, 9, 9, 'Random']; //Zone 16-47 (old: 9/9/0 Random)
MODULES["maps"].MapTier3Sliders = [9, 9, 9, 'Random']; //Zone 6-16 (old: 9/0/0 Random)
MODULES["maps"].preferGardens = !getPageSetting('PreferMetal'); //prefer run Garden maps instead of ^^ if we have Decay done
MODULES["maps"].maxMapBonus = 10; //cap how many maps are run during Want More Damage mode
MODULES["maps"].wantHealthMapBonus = 10; //cap how many maps are run during Want More Health mode
MODULES["maps"].SpireFarm199Maps = true; //this will farm spire on 199 maps instead of 200 maps when Map Reducer is bought
MODULES["maps"].watchChallengeMaps = [15, 25, 35, 50]; //during 'watch' challenge, run maps on these levels:
MODULES["maps"].shouldFarmCell = 59;
MODULES["maps"].SkipNumUnboughtPrestiges = 2; //exceeding this number of unbought prestiges will trigger a skip of prestige mode.
MODULES["maps"].UnearnedPrestigesRequired = 2;
MODULES["maps"].maxMapBonusAfterZ = MODULES["maps"].maxMapBonus; //Max Map Bonus After Zone uses this many stacks
//- init as default value (10). user can set if they want.

//Initialize Global Vars (dont mess with these ones, nothing good can come from it).
var customVars = MODULES["maps"];
var stackingTox = false;
var doVoids = false;
var presRaiding = false;
var BWRaidingStatus = false;
var needToVoid = false;
var plusMapVoid = false;
var needPrestige = false;
var skippedPrestige = false;
var voidCheckPercent = 0;
var HDratio = 0;
var ourBaseDamage = 0;
var ourBaseDamage2 = 0;
var scryerStuck = false;
var shouldDoMaps = false;
var mapTimeEstimate = 0;
var lastMapWeWereIn = null;
var preSpireFarming = false;
var spireMapBonusFarming = false;
var spireTime = 0;
var doMaxMapBonus = false;
var vanillaMapatZone = false;

var baseLevel;
var sizeSlider;
var diffSlider;
var lootSlider;
var specialMod;
var perfect;
var extraLevels;
var type;
var cost;

var maxDesiredLevel;
var minDesiredLevel;
var mapbought = false;
//var debugging = true;
var debugging = false;
var currWorldZone = 1;
var scaleUp = false; //if true, when minDesiredLevel = xx1 and we want to buy higher we will first run xx1 then xx2 until our desired level.
//Activate Robo Trimp (will activate on the first zone after liquification)

function calcDmg(){
        //START CALCULATING DAMAGES:
    var AutoStance = getPageSetting('AutoStance');
    
    //calculate crits (baseDamage was calced in function autoStance)    this is a weighted average of nonCrit + Crit. (somewhere in the middle)
    var critChance = getPlayerCritChance();
    var normalCritChance = (critChance > 1 ? critChance - 1 : critChance);
    var orangeCritChance = (critChance > 2 ? critChance - 2 : 0);
    ourBaseDamage = baseDamage * (1 + (normalCritChance + 5 * orangeCritChance) * getPlayerCritDamageMult());
    
    //add damage multiplier for poison zones
    ourBaseDamage = ourBaseDamage * (getEmpowerment() == "Poison" ? customVars.poisonMult : 1); //30 by default
    
    //calculate with map bonus
    var mapbonusmulti = 1 + (0.20 * game.global.mapBonus);
    //(autostance2 has mapbonusmulti built in)
    ourBaseDamage2 = ourBaseDamage; //keep a version without mapbonus
    ourBaseDamage *= mapbonusmulti;

    //get average enemyhealth and damage for the next zone, cell 50, snimp type and multiply it by a max range fluctuation of 1.2
    var enemyDamage;
    var enemyHealth;
    if (AutoStance <= 1) {
        enemyDamage = getEnemyMaxAttack(currWorldZone, 50, 'Snimp', 1.2);
        enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
    } else {
        enemyDamage = calcBadGuyDmg(null, getEnemyMaxAttack(currWorldZone, 50, 'Snimp', 1.0), true, true); //(enemy,attack,daily,maxormin,[disableFlucts])
    }
    enemyHealth = getEnemyMaxHealth(currWorldZone, 50);
    if (game.global.challengeActive == "Toxicity") {
        enemyHealth *= 2;
    }
    //Corruption Zone Proportionality Farming Calculator:
    var corrupt = currWorldZone >= mutations.Corruption.start(true);
    if (getPageSetting('CorruptionCalc') && corrupt) {
        var cptnum = getCorruptedCellsNum(); //count corrupted cells
        var cpthlth = getCorruptScale("health"); //get corrupted health mod
        var cptpct = cptnum / 100; //percentage of zone which is corrupted.
        var hlthprop = cptpct * cpthlth; //Proportion of cells corrupted * health of a corrupted cell
        if (hlthprop >= 1) //dont allow sub-1 numbers to make the number less
            enemyHealth *= hlthprop;
        var cptatk = getCorruptScale("attack"); //get corrupted attack mod
        var atkprop = cptpct * cptatk; //Proportion of cells corrupted * attack of a corrupted cell
        if (atkprop >= 1)
            enemyDamage *= atkprop;
        //console.log("enemy dmg:" + enemyDamage + " enemy hp:" + enemyHealth + " base dmg: " + ourBaseDamage);
    }
    // enter farming if it takes over 4 hits in D stance (16) (and exit if under.)
    if (!getPageSetting('DisableFarm')) {
        shouldFarm = enemyHealth > (ourBaseDamage * customVars.farmingCutoff);
        if (game.options.menu.repeatUntil.enabled == 1) toggleSetting('repeatUntil'); //turn repeat forever on if farming is on.
    }

    //Lead specific farming calcuation section:
    if ((game.global.challengeActive == 'Lead' && !challSQ)) {
        ourBaseDamage /= mapbonusmulti;
        if (AutoStance <= 1)
            enemyDamage *= (1 + (game.challenges.Lead.stacks * 0.04));
        enemyHealth *= (1 + (game.challenges.Lead.stacks * 0.04));
        //if the zone is odd:   (skip the +2 calc for the last level.
        if (currWorldZone % 2 == 1 && currWorldZone != 179) {
            //calculate for the next level in advance (since we only farm on odd, and evens are very tough)
            if (AutoStance <= 1) {
                enemyDamage = getEnemyMaxAttack(currWorldZone + 1, 99, 'Snimp', 1.2);
                enemyDamage = calcDailyAttackMod(enemyDamage); //daily mods: badStrength,badMapStrength,bloodthirst
            } else {
                enemyDamage = calcBadGuyDmg(null, getEnemyMaxAttack(currWorldZone + 1, 99, 'Snimp', 1.0), true, true); //(enemy,attack,daily,maxormin,[disableFlucts])
            }
            enemyDamage *= (1 + (100 * 0.04));
            ourBaseDamage /= 1.5; //subtract the odd-zone bonus.
        }
        if (currWorldZone == 179) {
            ourBaseDamage *= mapbonusmulti;
        }
        //let people disable this if they want.
        if (!getPageSetting('DisableFarm')) {
            shouldFarm = enemyHealth > (ourBaseDamage * customVars.LeadfarmingCutoff);
        }
    }
    //does not take corrupted void maps into consideration?
    //Enough Health and Damage calculations:
    var pierceMod = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    const FORMATION_MOD_1 = game.upgrades.Dominance.done ? 2 : 1;
    //asks if we can survive x number of hits in either D stance or X stance.
    enoughHealth = (baseHealth / FORMATION_MOD_1 > customVars.numHitsSurvived * (enemyDamage - baseBlock / FORMATION_MOD_1 > 0 ? enemyDamage - baseBlock / FORMATION_MOD_1 : enemyDamage * pierceMod));
    if(game.global.soldierHealth < 0.65*enemyDamage && game.global.soldierHealth > 1000){ //lets try buying more health if current health < 35% enemy attack, but not if 0 because we're dead)
        enoughHealth=false;
        //buyArmor()
        /*numTab(3);
        buyEquipment('Boots');
        buyEquipment('Helmet');
        buyEquipment('Pants');
        buyEquipment('Shoulderguards');
        buyEquipment('Breastplate')
        buyEquipment('Gambeson')*/
    }
    
    var windstackzone = getPageSetting('WindStackingMin');
    var mult = 1;
    if (getEmpowerment() == "Wind" && currWorldZone >= windstackzone)
        mult = 4; //in windstacking zones, wait much longer before doing maps for damage
    enoughDamage = (ourBaseDamage * customVars.enoughDamageCutoff * mult > enemyHealth);

    //Health:Damage ratio: (status)
    HDratio = enemyHealth / ourBaseDamage;
    updateAutoMapsStatus(); //refresh the UI status (10x per second)
}

//AutoMap - function originally created by Belaith (in 1971)
//anything/everything to do with maps.
function autoMap() {
    if(!game.global.mapsActive)
        currWorldZone = game.global.world; //game.global.world will point to our map level when we're inside map. keep a record of the actual world zone.
    
    //allow script to handle abandoning
    // if(game.options.menu.alwaysAbandon.enabled == 1) toggleSetting('alwaysAbandon');
    //if we are prestige mapping, force equip first mode
    var prestige = autoTrimpSettings.Prestige.selected;
    if (prestige != "Off" && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    //Control in-map right-side-buttons for people who can't control themselves. If you wish to use these buttons manually, turn off autoMaps temporarily.
    if (game.options.menu.repeatUntil.enabled == 2) toggleSetting('repeatUntil');
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if (game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    //exit and do nothing if we are prior to zone 6 (maps haven't been unlocked):
    if (!game.global.mapsUnlocked || !(baseDamage > 0)) { //if we have no damage, why bother running anything? (this fixes weird bugs)
        enoughDamage = true;
        enoughHealth = true;
        shouldFarm = false;
        updateAutoMapsStatus(); //refresh the UI status (10x per second)
        return;
    }
    
    //if we are in mapology and we have no credits, exit
    if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) {
        updateAutoMapsStatus();
        return;
    }
    
    var challSQ = game.global.runningChallengeSquared;
    //advanced "Extra Zones" dropdown
    var extraMapLevels = getPageSetting('AdvMapSpecialModifier') ? getExtraMapLevels() : 0;
    //FIND VOID MAPS LEVEL:
    var voidMapLevelSetting = getPageSetting('VoidMaps');
    //Add your daily zone mod onto the void maps level
    var dailyVoidMod = getPageSetting('AutoFinishDailyNew');
    if ((game.global.challengeActive == "Daily") && (getPageSetting('AutoFinishDailyNew') != 999) && (getPageSetting('DailyVoidMod'))) {
        (voidMapLevelSetting += dailyVoidMod);
    }
    //decimal void maps are possible, using string function to avoid false float precision (0.29999999992). javascript can compare ints to strings anyway.
    var voidMapLevelSettingZone = (voidMapLevelSetting + "").split(".")[0];
    var voidMapLevelSettingMap = (voidMapLevelSetting + "").split(".")[1];
    if (voidMapLevelSettingMap === undefined || (game.global.challengeActive == 'Lead' && !challSQ))
        voidMapLevelSettingMap = 90;
    if (voidMapLevelSettingMap.length == 1) voidMapLevelSettingMap += "0"; //entering 187.70 becomes 187.7, this will bring it back to 187.70
    var voidsuntil = getPageSetting('RunNewVoidsUntilNew');
    needToVoid = voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingMap &&
        (game.global.world == voidMapLevelSettingZone ||
            (game.global.world >= voidMapLevelSettingZone && getPageSetting('RunNewVoidsUntilNew') != 0 && (voidsuntil == -1 || game.global.world <= (voidsuntil + voidMapLevelSettingZone))));
    if (game.global.totalVoidMaps == 0 || !needToVoid)
        doVoids = false;
    
    calcDmg();
    
    //if dont have army ready, dont enter map screen unless its last poison zone, and/or we need to do void maps
    if(!needToVoid){
        var armyReady = (game.resources.trimps.realMax()-game.resources.trimps.owned>0 ? false : true);
        if(!armyReady){  //may as well stay in the world until army ready. may not be true for some dailies
            if (getEmpowerment() == "Poison"){
                if(currWorldZone % 10 != 5 && currWorldZone % 10 != 0) //in poison xx0 and xx5, we are willing to sit and wait in map screen to be sure not to miss our last poison zone
                    return;
            }
            else //ice/wind/no empowerment: always stay in world if army isnt ready
                return;
        }
    }
    
    if (getPageSetting('PRaidingZoneStart') >0) {//Prestige Raiding NT. need to buy upgrades before running this, so adding 1000ms delay
        setTimeout({},1000);
        var tmp=PrestigeRaid();
        if (tmp != 2) //prestigeraid is not done yet so we'll return to it in the next visit to autoMaps() function. until then go back to main AT so we can purchase prestiges and stuff
            return; 
    }
    if (getPageSetting('Praidingzone') >0) Praiding(); //Prestige Raiding
    if (getPageSetting('BWraid')==true){setTimeout(BWraiding(), 3000);} //BW Raiding

    //NEW KFrowde + Sliverz This has several issues: 1 - Buys fuckloads of maps, 2 - enters a BW map instead of the one that you want
    //Set up vars
    var plusMapVoidLastZone;
    var plusMapVoid = (voidMapLevelSetting > 0) && (game.global.totalVoidMaps > 0) && (game.global.world == voidMapLevelSettingZone); //Sanity check
    var plusMapVoidInput = getPageSetting('PlusMapVoidToggle')
    //Check that you should do this, check you've enabled it between the correct values, check that it hasn't already run this zone
    if ((plusMapVoid) && (plusMapVoidInput > 0 && plusMapVoidInput <= 10) && (plusMapVoidLastZone === null || plusMapVoidLastZone !== game.global.world)) {
        document.getElementById("biomeAdvMapsSelect").value = "Random";
        document.getElementById('advExtraLevelSelect').value = plusMapVoidInput;
        document.getElementById('advSpecialSelect').value = "p";
        document.getElementById("lootAdvMapsRange").value = 0;
        document.getElementById("difficultyAdvMapsRange").value = 9;
        document.getElementById("sizeAdvMapsRange").value = 9;
        document.getElementById('advPerfectCheckbox').checked = false;
        updateMapCost();
        buyMap();
        selectMap(game.global.mapsOwnedArray[game.global.mapsOwnedArray.length - 1].id);
        runMap();
        plusMapVoidLastZone = game.global.world; //This should have stopped it from looping
    }

    // if force prestige, check if we are behind any first
    if ((getPageSetting('ForcePresZ') >= 0) && ((game.global.world + extraMapLevels) >= getPageSetting('ForcePresZ'))) {
        const prestigeList = ['Supershield', 'Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
        needPrestige = prestigeList.some(pres => game.mapUnlocks[pres].last <= (game.global.world + extraMapLevels) - 5);
    } else
        //calculate if we are behind on unlocking prestiges
        needPrestige = prestige != "Off" && game.mapUnlocks[prestige] && game.mapUnlocks[prestige].last <= (game.global.world + extraMapLevels) - 5 && game.global.challengeActive != "Frugal";
    //dont need prestige if we are caught up, and have (2) unbought prestiges:
    skippedPrestige = false;
    if (needPrestige && (getPageSetting('PrestigeSkip1_2') == 1 || getPageSetting('PrestigeSkip1_2') == 2)) {
        var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest', 'Bootboost', 'Hellishmet', 'Pantastic', 'Smoldershoulder', 'Bestplate', 'GambesOP'];
        var numUnbought = 0;
        for (var i in prestigeList) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        if (numUnbought >= customVars.SkipNumUnboughtPrestiges) {
            needPrestige = false;
            skippedPrestige = true;
        }
    }
    // Don't need prestige if there aren't many weapon prestiges left
    if ((needPrestige || skippedPrestige) && (getPageSetting('PrestigeSkip1_2') == 1 || getPageSetting('PrestigeSkip1_2') == 3)) {
        const prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
        const numLeft = prestigeList.filter(pres => game.mapUnlocks[pres].last <= (game.global.world + extraMapLevels) - 5);
        const shouldSkip = numLeft <= customVars.UnearnedPrestigesRequired;
        if (shouldSkip != skippedPrestige) { // not both conditions are met / is met but not already skipped: unskip it / do skip it
            needPrestige = !needPrestige;
            skippedPrestige = !skippedPrestige;
        }
    }

    //
    //BEGIN AUTOMAPS DECISIONS:
    //variables for doing maps
    var selectedMap = "world";
    var shouldFarmLowerZone = false;
    shouldDoMaps = false;
    //prevents map-screen from flickering on and off during startup when base damage is 0.
    if (ourBaseDamage > 0) {
        shouldDoMaps = !enoughDamage || shouldFarm || scryerStuck;
    }
    //Check our graph history and - Estimate = The zone should take around this long in milliseconds.
    mapTimeEstimate = mapTimeEstimater();

    var shouldDoHealthMaps = false;
    //if we are at max map bonus (10), and we don't need to farm, don't do maps
    if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
        shouldDoMaps = false;
    else if (game.global.mapBonus >= customVars.maxMapBonus && shouldFarm)
        shouldFarmLowerZone = getPageSetting('LowerFarmingZone');
    //do (1) map if we dont have enough health
    else if (game.global.mapBonus < customVars.wantHealthMapBonus && !enoughHealth && !shouldDoMaps && !needPrestige) {
        shouldDoMaps = true;
        shouldDoHealthMaps = true;
    }

    //FarmWhenNomStacks7
    var restartVoidMap = false;
    if (game.global.challengeActive == 'Nom' && getPageSetting('FarmWhenNomStacks7')) {
        //Get maxMapBonus (10) if we go above (7) stacks on Improbability (boss)
        if (game.global.gridArray[99].nomStacks > customVars.NomFarmStacksCutoff[0]) {
            if (game.global.mapBonus != customVars.maxMapBonus)
                shouldDoMaps = true;
        }
        //Go into maps on (30) stacks on Improbability (boss), farm until we fall under (10) H:D ratio
        if (game.global.gridArray[99].nomStacks == customVars.NomFarmStacksCutoff[1]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        //If we ever hit (100) nomstacks in the world, farm.
        if (!game.global.mapsActive && game.global.gridArray[game.global.lastClearedCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
        }
        //If we ever hit (100) nomstacks in a map (likely a voidmap), farm, (exit the voidmap and prevent void from running, until situation is clear)
        if (game.global.mapsActive && game.global.mapGridArray[game.global.lastClearedMapCell + 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
            shouldFarm = (HDratio > customVars.NomfarmingCutoff);
            shouldDoMaps = true;
            restartVoidMap = true;
        }
    }

    //Disable Farm mode if we have nothing left to farm for (prevent infinite farming)
    if (shouldFarm && !needPrestige) {
        //check if we have cap to 10 equip on, and we are capped for all attack weapons
        var capped = areWeAttackLevelCapped();
        //check if we have any additional prestiges available to unlock:
        var prestigeitemsleft;
        if (game.global.mapsActive) {
            prestigeitemsleft = addSpecials(true, true, getCurrentMapObject());
        } else if (lastMapWeWereIn) {
            prestigeitemsleft = addSpecials(true, true, lastMapWeWereIn);
        }
        //check if we have unbought+available prestiges
        var prestigeList = ['Dagadder', 'Megamace', 'Polierarm', 'Axeidic', 'Greatersword', 'Harmbalest'];
        var numUnbought = 0;
        for (var i = 0, len = prestigeList.length; i < len; i++) {
            var p = prestigeList[i];
            if (game.upgrades[p].allowed - game.upgrades[p].done > 0)
                numUnbought++;
        }
        //Disable farm mode, only do up to mapbonus.
        if (capped && prestigeitemsleft == 0 && numUnbought == 0) {
            shouldFarm = false;
            if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
                shouldDoMaps = false;
        }
    }

    //stack tox stacks if we are doing max tox, or if we need to clear our void maps
    if (game.global.challengeActive == 'Toxicity' && game.global.lastClearedCell > 93 && game.challenges.Toxicity.stacks < 1500 && ((getPageSetting('MaxTox') && game.global.world > 59) || needToVoid)) {
        shouldDoMaps = true;
        //we will get at least 85 toxstacks from the 1st voidmap (unless we have overkill)
        //            if (!game.portal.Overkill.locked && game.stats.cellsOverkilled.value)

        stackingTox = !(needToVoid && game.challenges.Toxicity.stacks > 1415);
        //force abandon army
        if (!game.global.mapsActive && !game.global.preMapsActive) {
            mapsClicked();
            mapsClicked();
        }
    } else stackingTox = false;

    //during 'watch' challenge, run maps on these levels:
    var watchmaps = customVars.watchChallengeMaps;
    var shouldDoWatchMaps = false;
    if (game.global.challengeActive == 'Watch' && watchmaps.indexOf(game.global.world) > -1 && game.global.mapBonus < 1) {
        shouldDoMaps = true;
        shouldDoWatchMaps = true;
    }
    
    
    //Farm X Minutes Before Spire:
    var shouldDoSpireMaps = false;
    preSpireFarming = (isActiveSpireAT()) && (spireTime = (new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire');
    spireMapBonusFarming = getPageSetting('MaxStacksForSpire') && isActiveSpireAT() && game.global.mapBonus < customVars.maxMapBonus;
    if (preSpireFarming || spireMapBonusFarming) {
        shouldDoMaps = true;
        shouldDoSpireMaps = true;
    }
    
    //Run a single map to get nurseries when 1. it's still locked,
    // 2. blacksmithery is purchased,
    // but not when 3A. home detector is purchased, or 3B. we don't need nurseries
    if (game.buildings.Nursery.locked && game.talents.blacksmith.purchased && !(game.talents.housing.purchased ||
            (getPageSetting('PreSpireNurseries') < 0 ?
                !(getPageSetting('MaxNursery') && game.global.world >= getPageSetting('NoNurseriesUntil')) :
                !getPageSetting('PreSpireNurseries'))) && game.global.world >= customVars.NurseryMapLevel) {
        shouldDoMaps = true;
        shouldDoWatchMaps = true; //TODO coding: this is overloaded - not ideal.
    }
    
    //MaxMapBonusAfterZone (idea from awnv)
    var maxMapBonusZ = getPageSetting('MaxMapBonusAfterZone');
    doMaxMapBonus = (maxMapBonusZ >= 0 && game.global.mapBonus < customVars.maxMapBonusAfterZ && game.global.world >= maxMapBonusZ);
    if (doMaxMapBonus)
        shouldDoMaps = true;
    //Allow automaps to work with in-game Map at Zone option:
    vanillaMapatZone = (game.options.menu.mapAtZone.enabled && game.global.canMapAtZone && !isActiveSpireAT());
    if (vanillaMapatZone)
        for (var x = 0; x < game.options.menu.mapAtZone.setZone.length; x++){
			 if (game.global.world == game.options.menu.mapAtZone.setZone[x])
                 shouldDoMaps = true;
        }

    //Dynamic Siphonology section (when necessary)
    //Lower Farming Zone = Lowers the zone used during Farming mode. Starts 10 zones below current and Finds the minimum map level you can successfully one-shot
    var siphlvl = shouldFarmLowerZone ? game.global.world - 10 : game.global.world - game.portal.Siphonology.level;
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    maxlvl += extraMapLevels; // extraMapLevels : advanced slider
    if (getPageSetting('DynamicSiphonology') || shouldFarmLowerZone) {
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //experimental
            //break;
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = ourBaseDamage2 * (game.unlocks.imps.Titimp ? 2 : 1); // *2 for titimp. (ourBaseDamage2 has no mapbonus in it)
            if (game.upgrades.Dominance.done && !getPageSetting('ScryerUseinMaps2'))
                mapdmg *= 4; //dominance stance and not-scryer stance in maps.
            if (mapdmg < maphp) {
                break;
            }
        }
    }
    var obj = {};
    var siphonMap = -1;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) { //not a unique map
            obj[map] = game.global.mapsOwnedArray[map].level; //find map with correct level
            //Get matching map for our siphonology level
            if (game.global.mapsOwnedArray[map].level == siphlvl)
                siphonMap = map;
        }
        debug("map is " + map + "game.global.mapsOwnedArray[map] " + game.global.mapsOwnedArray[map] + "game.global.mapsOwnedArray[map].level " +game.global.mapsOwnedArray[map].level + " game.global.mapsOwnedArray[map].noRecycle" + game.global.mapsOwnedArray[map].noRecycle);
    }
    
    //Organize a list of the sorted map's levels and their index in the mapOwnedarray
    var keysSorted = Object.keys(obj).sort(function(a, b) {
        return obj[b] - obj[a];
    });
    
    //if there are no non-unique maps, there will be nothing in keysSorted, so set to create a map
    var highestMap;
    if (keysSorted[0])
        highestMap = keysSorted[0];
    else
        selectedMap = "create";

    //Look through all the maps we have and figure out, find and Run Uniques if we need to
    var runUniques = (getPageSetting('AutoMaps') == 1);
    if (runUniques) {
        for (var map in game.global.mapsOwnedArray) {
            var theMap = game.global.mapsOwnedArray[map];
            if (theMap.noRecycle) {
                if (theMap.name == 'The Wall' && game.upgrades.Bounty.allowed == 0 && !game.talents.bounty.purchased) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 15 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                if (theMap.name == 'Dimension of Anger' && document.getElementById("portalBtn").style.display == "none" && !game.talents.portal.purchased) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 20 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                var dont = game.global.runningChallengeSquared;
                if (theMap.name == 'The Block' && !game.upgrades.Shieldblock.allowed && ((game.global.challengeActive == "Scientist" || game.global.challengeActive == "Trimp") && !dont || getPageSetting('BuyShieldblock'))) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 11 + theMapDifficulty) continue;
                    selectedMap = theMap.id;
                    break;
                }
                var treasure = getPageSetting('TrimpleZ');
                if (theMap.name == 'Trimple Of Doom' && (!dont && (game.global.challengeActive == "Meditate" || game.global.challengeActive == "Trapper") && game.mapUnlocks.AncientTreasure.canRunOnce && game.global.world >= treasure)) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if ((game.global.world < 33 + theMapDifficulty) || treasure > -33 && treasure < 33) continue;
                    selectedMap = theMap.id;
                    if (treasure < 0) // need to reset
                        setPageSetting('TrimpleZ', 0);
                    break;
                }
                if (!dont) {
                    //run the prison only if we are 'cleared' to run level 80 + 1 level per 200% difficulty. Could do more accurate calc if needed
                    if (theMap.name == 'The Prison' && (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse")) {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 80 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                    if (theMap.name == 'Bionic Wonderland' && game.global.challengeActive == "Crushed") {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 125 + theMapDifficulty) continue;
                        selectedMap = theMap.id;
                        break;
                    }
                }
                //Bionic Before Spire - mandates preReq of UniqueMaps. run Bionics before spire to farm.
                /*if (getPageSetting('RunBionicBeforeSpire') && (game.global.world == 200) && theMap.name.includes('Bionic Wonderland')) {
                    //this is how to check if a bionic is green or not.
                    var bionicnumber = 1 + ((theMap.level - 125) / 15);
                    //if numbers match, map is green, so run it. (do the pre-requisite bionics one at a time in order)
                    if (bionicnumber == game.global.bionicOwned && bionicnumber < 6) {
                        selectedMap = theMap.id;
                        break;
                    }
                    if (shouldDoSpireMaps && theMap.name == 'Bionic Wonderland VI') {
                        selectedMap = theMap.id;
                        break;
                    }
                }*/ //TODO Spire II+??
                //other unique maps here
            }
        }
    }

    //VOIDMAPS:
    //Only proceed if we needToVoid right now.
    if (needToVoid) {
        //voidArray: make an array with all our voidmaps, so we can sort them by real-world difficulty level
        var voidArray = [];
        //values are easiest to hardest. (hardest has the highest value)
        var prefixlist = {
            'Deadly': 10,
            'Heinous': 11,
            'Poisonous': 20,
            'Destructive': 30
        };
        var prefixkeys = Object.keys(prefixlist);
        var suffixlist = {
            'Descent': 7.077,
            'Void': 8.822,
            'Nightmare': 9.436,
            'Pit': 10.6
        };
        var suffixkeys = Object.keys(suffixlist);
        for (var map in game.global.mapsOwnedArray) {
            var theMap = game.global.mapsOwnedArray[map];
            if (theMap.location == 'Void') {
                for (var pre in prefixkeys) {
                    if (theMap.name.includes(prefixkeys[pre]))
                        theMap.sortByDiff = 1 * prefixlist[prefixkeys[pre]];
                }
                for (var suf in suffixkeys) {
                    if (theMap.name.includes(suffixkeys[suf]))
                        theMap.sortByDiff += 1 * suffixlist[suffixkeys[suf]];
                }
                voidArray.push(theMap);
            }
        }
        //sort the array (harder/highvalue last):
        var voidArraySorted = voidArray.sort(function(a, b) {
            return b.sortByDiff - a.sortByDiff; //i want destructives first for health purchase
            //return a.sortByDiff - b.sortByDiff;
        });
        for (var map in voidArraySorted) {
            var theMap = voidArraySorted[map];
            //if we are on toxicity, don't clear until we will have max stacks at the last cell.
            if (game.global.challengeActive == 'Toxicity' && game.challenges.Toxicity.stacks < (1500 - theMap.size)) break;
            doVoids = true;
            //check to make sure we won't get 1-shot in nostance by boss
            var eAttack = getEnemyMaxAttack(game.global.world, theMap.size, 'Voidsnimp', theMap.difficulty);
            if (game.global.world >= 181 || (game.global.challengeActive == "Corrupted" && game.global.world >= 60))
                eAttack *= (getCorruptScale("attack") / 2).toFixed(1);
            //TODO: Account for magmated voidmaps. (not /2)
            //TODO: Account for daily.
            var ourHealth = baseHealth;
            if (game.global.challengeActive == 'Balance') {
                var stacks = game.challenges.Balance.balanceStacks ? (game.challenges.Balance.balanceStacks > theMap.size) ? theMap.size : game.challenges.Balance.balanceStacks : false;
                eAttack *= 2;
                if (stacks) {
                    for (i = 0; i < stacks; i++) {
                        ourHealth *= 1.01;
                    }
                }
            }
            if (game.global.challengeActive == 'Toxicity') eAttack *= 5;
            //break to prevent finishing map to finish a challenge?
            //continue to check for doable map?
            var diff = parseInt(getPageSetting('VoidCheck')) > 0 ? parseInt(getPageSetting('VoidCheck')) : 2;
            var ourBlock = getBattleStats("block", true); //use block tooltip (after death block) instead of current army block.
            if (ourHealth / diff < eAttack - ourBlock) {
                shouldFarm = true;
                voidCheckPercent = Math.round((ourHealth / diff) / (eAttack - ourBlock) * 100);
                abandonVoidMap(); //exit/restart if below <95% health, we have ForceAbandon on, and its not due to randomly losing anti stacks
                break;
            } else {
                voidCheckPercent = 0;
                if (getPageSetting('DisableFarm'))
                    shouldFarm = shouldFarm || false;
            }
            //only go into the voidmap if we need to.
            if (!restartVoidMap)
                selectedMap = theMap.id;
            //Restart the voidmap if we hit (100) nomstacks on the final boss
            if (game.global.mapsActive && getCurrentMapObject().location == "Void" && game.global.challengeActive == "Nom" && getPageSetting('FarmWhenNomStacks7')) {
                if (game.global.mapGridArray[theMap.size - 1].nomStacks >= customVars.NomFarmStacksCutoff[2]) {
                    mapsClicked(true);
                }
            }
            break;
        }
    }
    
    //MAPS CREATION pt1:
    //map if we don't have health/dmg or we need to clear void maps or if we are prestige mapping, and our set item has a new prestige available
    if (shouldDoMaps || doVoids || needPrestige) {
        //selectedMap = world here if we haven't set it to create yet, meaning we found appropriate high level map, or siphon map
        if (selectedMap == "world") {
            //if preSpireFarming x minutes is true, switch over from wood maps to metal maps.
            if (preSpireFarming) {
                var spiremaplvl = (game.talents.mapLoot.purchased && MODULES["maps"].SpireFarm199Maps) ? game.global.world - 1 : game.global.world;
                if (game.global.mapsOwnedArray[highestMap].level >= spiremaplvl && game.global.mapsOwnedArray[highestMap].location == ((customVars.preferGardens && game.global.decayDone) ? 'Plentiful' : 'Mountain'))
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
                //if needPrestige, TRY to find current level map as the highest level map we own.
            } else if (needPrestige || (extraMapLevels > 0)) {
                if ((game.global.world + extraMapLevels) == game.global.mapsOwnedArray[highestMap].level)
                    selectedMap = game.global.mapsOwnedArray[highestMap].id;
                else
                    selectedMap = "create";
                //if shouldFarm is true, use a siphonology adjusted map, as long as we aren't trying to prestige
            } else if (siphonMap != -1)
                selectedMap = game.global.mapsOwnedArray[siphonMap].id;
            //if we dont' have an appropriate max level map, or a siphon map, we need to make one
            else
                selectedMap = "create";
        }
        //if selectedMap != world, it already has a map ID and will be run below
    }
    //LEAD EVEN ZONE EXIT
    //don't map on even worlds if on Lead Challenge, except if person is dumb and wants to void on even
    if ((game.global.challengeActive == 'Lead' && !challSQ) && !doVoids && (game.global.world % 2 == 0 || game.global.lastClearedCell < customVars.shouldFarmCell)) {
        if (game.global.preMapsActive)
            mapsClicked();
        return; //exit
    }
    
    //REPEAT BUTTON:
    //Repeat Button Management (inside a map):
    if (!game.global.preMapsActive && game.global.mapsActive) {
        //Set the repeatBionics flag (farm bionics before spire), for the repeat button management code.
        var repeatBionics = getPageSetting('RunBionicBeforeSpire') && game.global.bionicOwned >= 6;
        //if we are doing the right map, and it's not a norecycle (unique) map, and we aren't going to hit max map bonus
        //or repeatbionics is true and there are still prestige items available to get
        var doDefaultMapBonus = game.global.mapBonus < customVars.maxMapBonus - 1;
        if (selectedMap == game.global.currentMapId && (!getCurrentMapObject().noRecycle && (doDefaultMapBonus || vanillaMapatZone || doMaxMapBonus || shouldFarm || stackingTox || needPrestige || shouldDoSpireMaps) || repeatBionics)) {
            var targetPrestige = autoTrimpSettings.Prestige.selected;
            //make sure repeat map is on
            if (!game.global.repeatMap) {
                repeatClicked();
            }
            //if we aren't here for dmg/hp, and we see the prestige we are after on the last cell of this map, and it's the last one available, turn off repeat to avoid an extra map cycle
            if (!shouldDoMaps && (game.global.mapGridArray[game.global.mapGridArray.length - 1].special == targetPrestige && game.mapUnlocks[targetPrestige].last >= (game.global.world + extraMapLevels - 9))) {
                repeatClicked();
            }
            //avoid another map cycle due to having the amount of tox stacks we need.
            if (stackingTox && (game.challenges.Toxicity.stacks + game.global.mapGridArray.length - (game.global.lastClearedMapCell + 1) >= 1500)) {
                repeatClicked();
            }
            //turn off repeat maps if we doing Watch maps.
            if (shouldDoWatchMaps)
                repeatClicked();
            //turn repeat off on the last WantHealth map.
            if (shouldDoHealthMaps && game.global.mapBonus >= customVars.wantHealthMapBonus - 1) {
                repeatClicked();
                shouldDoHealthMaps = false;
            }
            //turn repeat off on the last maxMapBonusAfterZ map.
            if (doMaxMapBonus && game.global.mapBonus >= customVars.maxMapBonusAfterZ - 1) {
                repeatClicked();
                doMaxMapBonus = false;
            }
        } else {
            //otherwise, make sure repeat map is off
            if (game.global.repeatMap) {
                repeatClicked();
            }
            if (restartVoidMap) {
                mapsClicked(true);
            }
        }
        
        //FORCE EXIT WORLD->MAPS
        //clicks the maps button, once or twice (inside the world):
    } else if (!game.global.preMapsActive && !game.global.mapsActive) {
        if (selectedMap != "world") {
            //if we should not be in the world, and the button is not already clicked, click map button once (and wait patiently until death)
            if (!game.global.switchToMaps) {
                mapsClicked();
            }
            //Get Impatient/Abandon if: (need prestige / _NEED_ to do void maps / on lead in odd world.) AND (a new army is ready, OR _need_ to void map OR lead farming and we're almost done with the zone) (handle shouldDoWatchMaps elsewhere below)
            if ((!getPageSetting('PowerSaving') || (getPageSetting('PowerSaving') == 2) && doVoids) && game.global.switchToMaps && !shouldDoWatchMaps &&
                (needPrestige || doVoids ||
                    ((game.global.challengeActive == 'Lead' && !challSQ) && game.global.world % 2 == 1) ||
                    (!enoughDamage && enoughHealth && game.global.lastClearedCell < 9) ||
                    (shouldFarm && game.global.lastClearedCell >= customVars.shouldFarmCell) ||
                    (scryerStuck)) &&
                (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) ||
                    ((game.global.challengeActive == 'Lead' && !challSQ) && game.global.lastClearedCell > 93) ||
                    (doVoids && game.global.lastClearedCell > 93)
                )
            ) {
                //output stuck message
                if (scryerStuck) {
                    debug("Got perma-stuck on cell " + (game.global.lastClearedCell + 2) + " during scryer stance. Are your scryer settings correct? Entering map to farm to fix it.");
                }
                mapsClicked();
            }
        }
        //forcibly run watch maps (or click to restart voidmap?)
        if (shouldDoWatchMaps) {
            mapsClicked();
        }
        //MAPS CREATION pt2:
    } else if (game.global.preMapsActive) {
        if (selectedMap == "world") {
            mapsClicked(); //go back
        } else if (selectedMap == "create") {
            var $mapLevelInput = document.getElementById("mapLevelInput");
            $mapLevelInput.value = needPrestige ? game.global.world : siphlvl;
            //choose spire level 199 or 200
            if (preSpireFarming && MODULES["maps"].SpireFarm199Maps)
                $mapLevelInput.value = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
            var decrement; //['size','diff','loot']
            var tier; //taken from MODULES vars at the top of this file.
            //instead of normal map locations, use Plentiful (Gardens) if the Decay challenge has been completed. (for +25% better loot)
            var useGardens = (customVars.preferGardens && game.global.decayDone);
            if (game.global.world >= customVars.MapTierZone[0]) {
                //Zone 72+ (old: 9/9/9 Metal):
                tier = customVars.MapTier0Sliders;
                decrement = [];
            } else if (game.global.world >= customVars.MapTierZone[1]) {
                //Zone 47-72 (old: 9/9/4 Metal):
                tier = customVars.MapTier1Sliders;
                decrement = ['loot'];
            } else if (game.global.world >= customVars.MapTierZone[2]) {
                //Zone 16-47 (old: 9/9/0 Random):
                tier = customVars.MapTier2Sliders;
                decrement = ['loot'];
            } else {
                //Zone 6-16 (old: 9/0/0 Random):
                tier = customVars.MapTier3Sliders;
                decrement = ['diff', 'loot'];
            }
            //NEW: start all maps off on 9/9/9 sliders and decrement from there.
            sizeAdvMapsRange.value = tier[0];
            adjustMap('size', tier[0]);
            difficultyAdvMapsRange.value = tier[1];
            adjustMap('difficulty', tier[1]);
            lootAdvMapsRange.value = tier[2];
            adjustMap('loot', tier[2]);
            biomeAdvMapsSelect.value = useGardens ? "Plentiful" : tier[3];
            //recalculate cost.
            updateMapCost();
            //if we are "Farming" for resources, make sure it's Plentiful OR metal (and always aim for lowest difficulty)
            if (shouldFarm || !enoughDamage || !enoughHealth || game.global.challengeActive == 'Metal') {
                biomeAdvMapsSelect.value = useGardens ? "Plentiful" : "Mountain";
                updateMapCost();
            }
            //set up various priorities for various situations
            if (updateMapCost(true) > game.resources.fragments.owned) {
                if (needPrestige && !enoughDamage) decrement.push('diff');
                if (shouldFarm) decrement.push('size');
            }

            //Decrement 1 - use priorities first:
            //if we STILL cant afford the map, lower the loot slider (less loot)
            while (decrement.indexOf('loot') > -1 && lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            //default: if we can't afford the map:
            //Put a priority on small size, and increase the difficulty? for high Helium that just wants prestige = yes.
            //Really just trying to prevent prestige mapping from getting stuck
            while (decrement.indexOf('diff') > -1 && difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            //if we still cant afford the map, lower the size slider (make it larger) (doesn't matter much for farming.)
            while (decrement.indexOf('size') > -1 && sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }
            //Decrement 2 - if its still too expensive:
            //if we STILL cant afford the map, lower the loot slider (less loot)
            while (lootAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                lootAdvMapsRange.value -= 1;
            }
            //default: if we can't afford the map:
            //Put a priority on small size, and increase the difficulty? for high Helium that just wants prestige = yes.
            //Really just trying to prevent prestige mapping from getting stuck
            while (difficultyAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                difficultyAdvMapsRange.value -= 1;
            }
            //if we still cant afford the map, lower the size slider (make it larger) (doesn't matter much for farming.)
            while (sizeAdvMapsRange.value > 0 && updateMapCost(true) > game.resources.fragments.owned) {
                sizeAdvMapsRange.value -= 1;
            }

            //run the Advanced Special Modifier script, bring
            if (getPageSetting('AdvMapSpecialModifier'))
                testMapSpecialModController();

            //if we can't afford the map we designed, pick our highest existing map
            //TODO Debug Output the mods we made.
            var maplvlpicked = parseInt($mapLevelInput.value) + (getPageSetting('AdvMapSpecialModifier') ? getExtraMapLevels() : 0);
            if (updateMapCost(true) > game.resources.fragments.owned) {
                selectMap(game.global.mapsOwnedArray[highestMap].id);
                debug("Can't afford the map we designed, #" + maplvlpicked, "maps", '*crying2');
                debug("...selected our highest map instead # " + game.global.mapsOwnedArray[highestMap].id + " Level: " + game.global.mapsOwnedArray[highestMap].level, "maps", '*happy2');
                runMap();
                lastMapWeWereIn = getCurrentMapObject();
                //if we can afford it, buy it and run it:
            } else {
                debug("Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                var result = buyMap();
                if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true);
                    debug("Retrying, Buying a Map, level: #" + maplvlpicked, "maps", 'th-large');
                    buyMap();
                }
            }
            //if we already have a map picked, run it
        } else {
            selectMap(selectedMap);
            var themapobj = game.global.mapsOwnedArray[getMapIndex(selectedMap)];
            var levelText = " Level: " + themapobj.level;
            var voidorLevelText = themapobj.location == "Void" ? " Void: " : levelText;
            debug("Running selected " + selectedMap + voidorLevelText + " Name: " + themapobj.name, "maps", 'th-large');
            runMap();
            lastMapWeWereIn = getCurrentMapObject();
        }
    }
}

//update the UI with stuff from automaps.
function updateAutoMapsStatus(get) {
    //automaps status
    var status;
    var minSp = getPageSetting('MinutestoFarmBeforeSpire');
    if (getPageSetting('AutoMaps') == 0) status = 'Off';
    else if (presRaiding) status = 'Prestige Raiding';
    else if (BWRaidingStatus) status = 'BW Raiding';
    else if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) status = 'Out of Map Credits';
    else if (preSpireFarming) {
        var secs = Math.floor(60 - (spireTime * 60) % 60).toFixed(0)
        var mins = Math.floor(minSp - spireTime).toFixed(0);
        var hours = minSp - (spireTime / 60).toFixed(2);
        var spiretimeStr = (spireTime >= 60) ?
            (hours + 'h') : (mins + 'm:' + (secs >= 10 ? secs : ('0' + secs)) + 's');
        status = 'Farming for Spire ' + spiretimeStr + ' left';
    } else if (spireMapBonusFarming) status = 'Getting Spire Map Bonus';
    else if (doMaxMapBonus) status = 'Max Map Bonus After Zone';
    else if (!game.global.mapsUnlocked) status = '&nbsp;';
    else if (needPrestige && !doVoids) status = 'Prestige';
    else if (doVoids && voidCheckPercent == 0) status = 'Void Maps: ' + game.global.totalVoidMaps + ' remaining';
    else if (stackingTox) status = 'Getting Tox Stacks';
    else if (needToVoid && !doVoids && game.global.totalVoidMaps > 0) status = 'Prepping for Voids';
    else if (doVoids && voidCheckPercent > 0) status = 'Farming to do Voids: ' + voidCheckPercent + '%';
    else if (shouldFarm && !doVoids) status = 'Farming: ' + HDratio.toFixed(2) + 'x';
    else if (scryerStuck) status = 'Scryer Got Stuck, Farming';
    else if (!enoughHealth && !enoughDamage) status = 'Want Health & Damage';
    else if (!enoughDamage) status = 'Want ' + HDratio.toFixed(2) + 'x &nbspmore damage';
    else if (!enoughHealth) status = 'Want more health';
    else if (enoughHealth && enoughDamage) status = 'Ratio = ' + HDratio.toFixed(6) +' Advancing';

    if (skippedPrestige) // Show skipping prestiges
        status += '<br><b style="font-size:.8em;color:pink;margin-top:0.2vw">Prestige Skipped</b>';

    //hider he/hr% status
    var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    var lifetime = (game.resources.helium.owned / (game.global.totalHeliumEarned - game.resources.helium.owned)) * 100;
    var hiderStatus = 'He/hr: ' + getPercent.toFixed(3) + '%<br>&nbsp;&nbsp;&nbsp;He: ' + lifetime.toFixed(3) + '%';

    if (get) {
        return [status, getPercent, lifetime];
    } else {
        document.getElementById('autoMapStatus').innerHTML = status;
        document.getElementById('hiderStatus').innerHTML = hiderStatus;
    }
}

function PrestigeRaid() {
    var StartZone = getPageSetting('PRaidingZoneStart'); //from this zone we prestige raid. -1 to ignore
    var PAggro = getPageSetting('PAggression'); //0 - light 1 - aggressive. 
    var PRaidMax = getPageSetting('PRaidingMaxZones'); //max zones to plus map
            
    if(debugging){
        debug("game.global.mapsActive " + game.global.mapsActive);
        debug("game.global.world " + game.global.world);
        debug("scaleUp = " + scaleUp);
    }
    
    if (PRaidMax > 10){
        PRaidMax = 10;
        setPageSetting('PRaidingMaxZones', 10);
    }
    if (PRaidMax < 0){
        PRaidMax = 0;
        setPageSetting('PRaidingMaxZones', 0);
    }
    
    if (StartZone == -1 || currWorldZone < StartZone || PRaidMax <= 0 || getPageSetting('AutoMaps') == 0){
        mapbought = false;
        startedMap = false
        return 2; //prestigeRaid is out of work, allow autoMaps to continue 
    }
    
    var havePrestigeUpTo = calcPrestige(); //check currently owned prestige levels
    findDesiredMapLevel(currWorldZone, PRaidMax, PAggro, havePrestigeUpTo); //decide which level we want to raid to

    if(havePrestigeUpTo >= maxDesiredLevel){
        debug("have all the prestige levels that we want. exiting.", "general", "");
        return 2; //prestigeRaid is out of work, allow autoMaps to continue 
    }
    
    debug("currWorldZone = " + currWorldZone, "general", "");
    debug("empowerment = " + getEmpowerment(), "general", "");
    debug("maxDesiredLevel = " + maxDesiredLevel, "general", "");
    debug("minDesiredLevel = " + minDesiredLevel, "general", "");
    debug("havePrestigeUpTo = " + havePrestigeUpTo, "general", "");
    
    //Let's see if we already own a map of suitable level
    var map = findMap(minDesiredLevel);
    if(map == -1){ //do not own a high enough map, try to make one if we can afford it
        //find highest map level we can afford
        var foundSuitableMap = decideMapParams(scaleUp);

        if (!foundSuitableMap){
            debug("could not find suitable map.");
            debug("cheapest map level " + (currWorldZone+extraLevels) + "  would cost " + cost + " fragments");
            debug("exiting.");
            scaleUp = false;
            return 2;
        }
        
        //lets create the map
        var flag = createAMap(type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
        if (!flag){
            debug("error in creating map process");
            return 2;
        }
        
        selectMap(game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id);
    }
    else
        selectMap(map);
    
    runMap();
    startedMap = true;
    debug("startedMap on");
    
    presRaiding = true; //update UI
    updateAutoMapsStatus(); //UI

    if (!game.global.repeatMap) {
        repeatClicked();
    }
    
    if(scaleUp)
    {
        if(minDesiredLevel != maxDesiredLevel)
            return 1; //we're not done yet
        else
            return 1;
    }
    
    presRaiding = false; //update UI
    updateAutoMapsStatus(); //UI
    
    return 1;
}

function createAMap(type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect){
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
            return true;
        }
        else if ((updateMapCost(true) > game.resources.fragments.owned)) {
            debug("Failed to prestige raid. We can't afford the map.");
            debug("Expected map level " + (currWorldZone+extraLevels) + " is " + cost + " and we have " + fragments + " frags.");
            return false;
        }
    }
    return false;
}

//searches for a map of at least minimum level
function findMap(level){
    var bestSoFar = -1;
    var theMap;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) { //not a unique map
            if(game.global.mapsOwnedArray[map].level >= bestSoFar && game.global.mapsOwnedArray[map].level >= level){
                theMap = game.global.mapsOwnedArray[map];
                bestSoFar = game.global.mapsOwnedArray[map].level;
                debug("map is " + theMap + "game.global.mapsOwnedArray[map] " + game.global.mapsOwnedArray[map] + "game.global.mapsOwnedArray[map].level " +game.global.mapsOwnedArray[map].level + " game.global.mapsOwnedArray[map].noRecycle" + game.global.mapsOwnedArray[map].noRecycle);
            }
        }
    }    
    if (bestSoFar>-1)
        return theMap;
    return -1;
}

function decideMapParams(scaleUp){
    var start, end, delta;
    var fragments = game.resources.fragments.owned; //our available fragments
    if (scaleUp){
        start = minDesiredLevel;
        end = maxDesiredLevel+1;
        delta = 1;
    }
    else{
        start = maxDesiredLevel;
        end = minDesiredLevel-1;
        delta = -1;
    }
    
    for(i = start; i != end; i=i+delta){
        baseLevel = currWorldZone;
        sizeSlider=9;
        diffSlider=9;
        lootSlider=0;
        specialMod="Prestigious";
        perfect=false;
        extraLevels = i-currWorldZone;
        type="Random";
             //calcMapCost(currWorldZone,   0-9,       0-9,        0-9,        "Prestigious"/"FA"/"LMC"/"", boolean, 0-10, "Random"/other){ 
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
        if (cost/fragments > 1 && (i == minDesiredLevel || (currWorldZone % 10 == 5 && getEmpowerment() == "Poison"))){//last attempt to buy a map. also do this on xx5 poison zones
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
            debug("map level " + (currWorldZone+extraLevels), "general", "");

            return true;
        }
    }
    debug("did not find suitable map. start = " + start + " end = " + end + " scaleUp = " + scaleUp);
    return false;
}

function findDesiredMapLevel(currWorldZone, PRaidMax, PAggro, havePrestigeUpTo){
    var ret;
    var empowerment = getEmpowerment();
    var lastDigitZone = currWorldZone % 10;
    
    scaleUp = false; //by default, we want to buy the highest level map and just run that one map for prestige
    
    //are we in an active spire? if so we always want +5 map levels
    if(currWorldZone % 100 == 0 && currWorldZone >= getPageSetting('IgnoreSpiresUntil')){
        debug("active spire mode");
        maxDesiredLevel = currWorldZone + 5;
        minDesiredLevel = currWorldZone + 1;
    }
    //there are 7 cases: poison/wind/ice (each 2 cases depending on zones xx1-xx5 or xx6-x10), and 7th case for no empowerment before zone 236.
    else if (empowerment == "Ice"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5 here aggressive is same as light because poison zones are coming up
            maxDesiredLevel = currWorldZone - lastDigitZone + 5; 
            minDesiredLevel = currWorldZone - lastDigitZone + 1; 
        }
        else if (lastDigitZone > 5){ //xx6-xx9
            if(PAggro == 0){
                maxDesiredLevel = currWorldZone - lastDigitZone + 11;
                minDesiredLevel = currWorldZone - lastDigitZone + 11;
            }
            else{ //PAggro == 1
                scaleUp = true; //special case, we want to run xx1 then xx2 then xx3 for faster clear
                maxDesiredLevel = currWorldZone - lastDigitZone + 13;
                minDesiredLevel = currWorldZone - lastDigitZone + 11;
            }
        }
        else { //xx0
            if(PAggro == 0){
                maxDesiredLevel = currWorldZone + 1;
                minDesiredLevel = currWorldZone + 1;
            }
            else{
                maxDesiredLevel = currWorldZone + 3;
                minDesiredLevel = currWorldZone + 1;
            }
        }
    }
    else if (empowerment == "Poison"){
        if(PAggro == 0){ //low aggro poison is fairly straightforward; get to last poison zone and farm 5 or 6 zones higher
            if(lastDigitZone == 0){
                maxDesiredLevel = currWorldZone + 5;
                minDesiredLevel = currWorldZone + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = currWorldZone + 6;
                minDesiredLevel = currWorldZone + 6;
            }
            else{
                maxDesiredLevel = currWorldZone - lastDigitZone + 5;
                minDesiredLevel = currWorldZone - lastDigitZone + 5;
            }
        }
        else {//PAggro == 1
            if(lastDigitZone == 0){
                maxDesiredLevel = currWorldZone + 5; //most available
                minDesiredLevel = currWorldZone + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = currWorldZone + 10; //most available
                minDesiredLevel = currWorldZone + 6;
            }
            else if(lastDigitZone < 5){
                maxDesiredLevel = currWorldZone - lastDigitZone + 5;
                minDesiredLevel = currWorldZone + 1; //+1 level is still fine, just dont get xx6
            }
            else{ //xx6-xx9
                scaleUp = true; //special case, we want to run xx1 then xx2 then xx3 for faster clear
                maxDesiredLevel = currWorldZone - lastDigitZone + 15;
                if(maxDesiredLevel > currWorldZone + 7)
                    maxDesiredLevel = currWorldZone+7;
                minDesiredLevel = currWorldZone - lastDigitZone + 11;
            }
        }
    }
    else if (empowerment == "Wind"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5, fairly conservative because ice is coming up
            maxDesiredLevel = currWorldZone - lastDigitZone + 5;
            minDesiredLevel = currWorldZone - lastDigitZone + 1;
        }
        else if (lastDigitZone == 0){
            if(PAggro == 0){
                maxDesiredLevel = currWorldZone + 1;
                minDesiredLevel = currWorldZone + 1;
            }
            else{
                maxDesiredLevel = currWorldZone + 1;
                minDesiredLevel = currWorldZone + 1;
            }
        }
        else{ //xx6-xx9
            if(PAggro == 0){ 
                maxDesiredLevel = currWorldZone - lastDigitZone + 11;
                minDesiredLevel = currWorldZone - lastDigitZone + 11;
            }
            else {
                maxDesiredLevel = currWorldZone - lastDigitZone + 11;
                minDesiredLevel = currWorldZone - lastDigitZone + 11;
            }
        }
    }
    else{ //no empowerment, pre 236
        if (lastDigitZone <= 5){
            maxDesiredLevel = currWorldZone - lastDigitZone + 5;
            minDesiredLevel = currWorldZone + 1;
        }
        else{
            maxDesiredLevel = currWorldZone - lastDigitZone + 15;
            minDesiredLevel = currWorldZone - lastDigitZone + 11;
        }
    }
    
    if (maxDesiredLevel > currWorldZone + PRaidMax)
        maxDesiredLevel = currWorldZone + PRaidMax; //dont go above user defined max
    if(lastDigitZone <= 5 && minDesiredLevel < currWorldZone) //always want to keep prestige at least upto current zone
        minDesiredLevel = currWorldZone;
    if(minDesiredLevel < havePrestigeUpTo + 1)
        minDesiredLevel = havePrestigeUpTo + 1;
    if(minDesiredLevel > maxDesiredLevel)
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


//New Code for Map Special Mods dropdown. (only the first dropdown for now)
//
//PLAN:
//1. lmc when you can afford it, or cycle down the list sequentially until one can be afforded.
//2. prestigious when you need prestiges,
//NEW IDEA:
//+lmc when you need more lvls in your eq
//+perfect sliders when you can afford it
//  another valid idea is burn out all your frags on perfect nearthe end i guess
//Automaps: Map Special Modifier Selector Decider Magical Action Taker
//TODO: a priority list? Which is more important, perfect slide, LMC or the +x value?

MODULES["maps"].advSpecialMapMod_numZones = 3; //The default amount of +x zones you try to skip and work backwards from there. (if its too hard you will fail the map there is no dmg check only cost yet)
var advExtraMapLevels = 0;

function testMapSpecialModController() {
    //var mapSpecialMods = ["Fast Attacks", "Large Cache", "Small Savory Cache", "Small Wooden Cache", "Small Metal Cache", "Prestigious", "Huge Cache", "Large Savory Cache", "Large Wooden Cache", "Large Metal Cache"];
    var mapSpecialMods = [];
    Object.keys(mapSpecialModifierConfig).forEach(function(key) {
        var elem = mapSpecialModifierConfig[key];
        if ((game.global.highestLevelCleared + 1) >= elem.unlocksAt)
            mapSpecialMods.push(elem.name);
    });
    if (mapSpecialMods.length < 1)
        return; //nothing to do.
    //try to use the highest one we have.
    var maxIndex = mapSpecialMods.length;
    var $advSpecialMod = document.getElementById('advSpecialSelect');
    if (!$advSpecialMod)
        return;
    if (game.global.highestLevelCleared >= 59) {
        if (needPrestige)
            maxIndex = 6;
        //Set the special mod to some max.
        $advSpecialMod.selectedIndex = maxIndex;
        if ($advSpecialMod.selectedIndex == 0)
            return;
        //Check Hyperspeed 2 or Fast Attacks
        if (!needPrestige && game.talents.hyperspeed2.purchased && (game.global.world > Math.floor((game.global.highestLevelCleared + 1) * 0.5)))
            $advSpecialMod.selectedIndex = 1;
        else if (needPrestige)
            $advSpecialMod.selectedIndex = 0;
        if (game.global.mapExtraBonus != "fa" && $advSpecialMod.selectedIndex == 1);
        //map frag cost is stored in: document.getElementById("mapCostFragmentCost").innerHTML
        var mc = updateMapCost(true);
        var my = game.resources.fragments.owned;
        var pct = mc / my * 100;
        while ($advSpecialMod.selectedIndex > 0 && mc > my) {
            $advSpecialMod.selectedIndex -= 1;
        }
        var mc = updateMapCost(true);
        var my = game.resources.fragments.owned;
        var pct = mc / my * 100;
        if ($advSpecialMod.value != "0") //if its 0 it fails {
            console.log("Set the map special modifier to: " + mapSpecialModifierConfig[$advSpecialMod.value].name + ". Cost: " + pct.toFixed(2) + "% of your fragments.");
    }
    //TODO:
    var specialMod = getSpecialModifierSetting(); //either 0 or the abbreviation/property of mapSpecialModifierConfig
    var perfectAllowed = (game.global.highestLevelCleared >= 109); //levels are 109 and 209 for Perfect sliders and Extra Levels
    var perfectChecked = checkPerfectChecked(); //Perfect Checkboxes
    var $advPerfect = document.getElementById('advPerfectCheckbox');
    var extraMapLevels = getPageSetting('AdvMapSpecialModifier') ? getExtraMapLevels() : 0; //Extra Levels

    //Set the extra level to max ( 3 )
    var extraAllowed = (game.global.highestLevelCleared >= 209);
    if (extraAllowed) {
        var $advExtraLevel = document.getElementById('advExtraMapLevelselect');
        if (!$advExtraLevel)
            return;
        var maplvlpicked = document.getElementById("mapLevelInput").value;
        if (maplvlpicked == game.global.world) //then the +x zones dropdown is open.
            $advExtraLevel.selectedIndex = MODULES["maps"].advSpecialMapMod_numZones;
        else
            $advExtraLevel.selectedIndex = 0;
        while ($advExtraLevel.selectedIndex > 0 && (updateMapCost(true) > game.resources.fragments.owned)) {
            $advExtraLevel.selectedIndex -= 1;
        }
    }
}

function mapTimeEstimater() {
    //Check our graph history and - Estimate = The zone should take around this long in milliseconds.
    var thiszone = lookUpZoneData(currWorldZone);
    var lastzone = lookUpZoneData(currWorldZone - 1);
    if (thiszone && lastzone)
        mapTimeEstimate = thiszone.currentTime - lastzone.currentTime;
    else
        mapTimeEstimate = 0;
    return mapTimeEstimate;
}
