MODULES["maps"] = {};
//These can be changed (in the console) if you know what you're doing:

var enoughDamageCutoff = 2; //above this the game will do maps for map bonus stacks

MODULES["maps"].poisonMult = 30; //how much bonus damage to treat poison zones as giving us
MODULES["maps"].farmingCutoff = 16; //above this the game will farm.
MODULES["maps"].numHitsSurvived = 8; //survive X hits in D stance or not enough Health.
MODULES["maps"].LeadfarmingCutoff = 10; //lead has its own farmingCutoff
MODULES["maps"].NurseryMapLevel = 50; //with blacksmithery, run map for nursery on this level
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
MODULES["maps"].UnearnedPrestigesRequired = 2;
MODULES["maps"].maxMapBonusAfterZ = MODULES["maps"].maxMapBonus; //Max Map Bonus After Zone uses this many stacks
//- init as default value (10). user can set if they want.

//Initialize Global Vars (dont mess with these ones, nothing good can come from it).
var customVars = MODULES["maps"];  
var doVoids = false;
var presRaiding = false;
var BWRaidingStatus = false;
var needToVoid = false;
var needPrestige = false;
var skippedPrestige = false;
var voidCheckPercent = 0;
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
var currWorldZone = 1;
//Activate Robo Trimp (will activate on the first zone after liquification)
var lastMsg; //stores last message, stops spam to console
var AutoMapsCoordOverride = false;
var PRaidingActive = false; //used for coordination purchase during praids

function calcDmg(){
    
    calcBaseDamageinS(); //baseDamage = our displayed damage in S
    const FORMATION_MOD_1 = game.upgrades.Dominance.done ? 2 : 1;
    
    ourBaseDamage = baseDamage*2*(game.upgrades.Dominance.done ? 4 : 1); //D if we have it, X otherwise
    
    ourBaseDamage = ourBaseDamage / (game.unlocks.imps.Titimp ? 2 : 1); // *we dont care about titimp damage
    
    //if we dont have max anticipation stacks, calculate as though we do. we dont want automap to kick in after autostance3 went through all the trouble of deliberately lowering our current anticipation stacks, and really it shouldnt be automap()'s job to handle trimpicides
    if(game.global.antiStacks < maxAnti)
        ourBaseDamage = ourBaseDamage / (1+0.2*game.global.antiStacks) * (1+0.2 * maxAnti);
    
    //calculate with map bonus
    var mapbonusmulti = 1 + (0.20 * game.global.mapBonus);
    //(autostance2 has mapbonusmulti built in)
    
    //if autostance 3 forces not to buy coordinations, factor those in. otherwise we'll enter maps for more damage thinking that we dont have enough.
    if(buyCoords == false && canAffordCoordinationTrimps() && getPageSetting('AutoStance') == 3){
        var missingCoords = game.global.world - 1 + (game.global.world > 230 ? 100 : 0) - game.upgrades.Coordination.done;
        ourBaseDamage = ourBaseDamage * Math.pow(1.25, missingCoords);
    }
    
    ourBaseDamage2 = ourBaseDamage; //keep a version without mapbonus
    ourBaseDamage *= mapbonusmulti;

    //get average enemyhealth and damage for the next zone, cell 50, snimp type and multiply it by a max range fluctuation of 1.2
    var enemyDamage;
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
    
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.badHealth !== 'undefined'){
                enemyHealth *= dailyModifiers.badHealth.getMult(game.global.dailyChallenge.badHealth.strength);
        }
        if (typeof game.global.dailyChallenge.empower !== 'undefined'){
                        enemyHealth *= dailyModifiers.empower.getMult(game.global.dailyChallenge.empower.strength, game.global.dailyChallenge.empower.stacks);
        }
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
    }
    // enter farming if it takes over 4 hits in D stance (16) (and exit if under.)
    if (!getPageSetting('DisableFarm')) {
        shouldFarm = enemyHealth > (ourBaseDamage * customVars.farmingCutoff);
        if (game.options.menu.repeatUntil.enabled == 1) toggleSetting('repeatUntil'); //turn repeat forever on if farming is on.
    }

    //Lead specific farming calcuation section:
    if ((game.global.challengeActive == 'Lead')) {
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

    var pierceMod = (game.global.brokenPlanet && !game.global.mapsActive) ? getPierceAmt() : 0;
    
    //Enough Health and Damage calculations:    
    //asks if we can survive x number of hits in either D stance or X stance.
    enoughHealth = (baseHealth / FORMATION_MOD_1 > customVars.numHitsSurvived * (enemyDamage - baseBlock / FORMATION_MOD_1 > 0 ? enemyDamage - baseBlock / FORMATION_MOD_1 : enemyDamage * pierceMod));
    
    if (windZone() && getPageSetting('AutoStance')==3 && avgWorthZone > 0.01)
        windMult = 2.5; //in windstacking zones, wait longer before doing maps for damage
    else
        windMult = 1;
    poisonMult = (getEmpowerment() == "Poison" ? customVars.poisonMult : 1);
    
    threshhold = poisonMult * windMult * enoughDamageCutoff;
    if(windMult > 1 && (game.global.MapsActive) && game.empowerments.Wind.currentDebuffPower < 50) //if we enter map screen in wind farm zone and have low stacks, may as well do a few more maps
        threshhold = threshhold / 1.3;
    enoughDamage = (ourBaseDamage * threshhold > enemyHealth); //add damage multiplier for poison zones (30 by default)

    if(!enoughHealth)
        debug("missing health");
    
    HDratio = (enemyHealth / ourBaseDamage);
    if(HDratio < 0.00001)
        HDratio = HDratio.toExponential(4);
    else if (HDratio < 1)
        HDratio = HDratio.toFixed(4);
    else
        HDratio = HDratio.toFixed(1);
}

//AutoMap - function originally created by Belaith (in 1971)
//anything/everything to do with maps.
function autoMap() {
    
    equipMainShield();
    calcDmg(); //checks enoughdamage/health to decide going after map bonus. calculating it here so we can display hd ratio in world screen
    
    updateAutoMapsStatus("", "Advancing"); //default msg. any other trigger will override this later
    currWorldZone = game.global.world;
    AutoMapsCoordOverride = false;
    
    //lets see if we can figure out how much fragments we're getting
    //need to be inside of a map while calling this function to see our expected frags per second
    //var fragIncome = fragCalc(); //TODO: maybe someday
    
    //allow script to handle abandoning
    // if(game.options.menu.alwaysAbandon.enabled == 1) toggleSetting('alwaysAbandon');
    //if we are prestige mapping, force equip first mode
    var prestige = autoTrimpSettings.Prestige.selected;
    if (prestige != "Off" && game.options.menu.mapLoot.enabled != 1) toggleSetting('mapLoot');
    //Control in-map right-side-buttons for people who can't control themselves. If you wish to use these buttons manually, turn off autoMaps temporarily.
    //if (game.options.menu.repeatUntil.enabled == 2) toggleSetting('repeatUntil');
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    if (game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    //exit and do nothing if we are prior to zone 6 (maps haven't been unlocked):
    if (!game.global.mapsUnlocked || !(baseDamage > 0)) { //if we have no damage, why bother running anything? (this fixes weird bugs)
        enoughDamage = true;
        enoughHealth = true;
        shouldFarm = false;
        //updateAutoMapsStatus("", "0 Damage, waiting"); //refresh the UI status (10x per second)
        return;
    }
    
    //if we are in mapology and we have no credits, exit
    if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) {
        updateAutoMapsStatus("", "No Map Credits");
        return;
    }
    
    if (getPageSetting('PRaidingZoneStart') >0)
        if(!PrestigeRaid()){ //prestigeraid is not done yet so we'll return to it in the next visit to autoMaps() function. until then go back to main AT so we can purchase prestiges and stuff
            PRaidingActive = true;
            return; 
        }
    
    PRaidingActive = false;
    if (getPageSetting('BWraid')==true && (!getPageSetting('BWraidDailyC2Only') || game.global.challengeActive))
        if(!BWraiding()) //BW Raiding
            return; 
    
    needPrestige = behindOnPrestige(); //checks if we have uncollected prestiges

    //BEGIN AUTOMAPS DECISIONS:
    //variables for doing maps
    var selectedMap = "world";
    var shouldFarmLowerZone = false;
    shouldDoMaps = false;
    //prevents map-screen from flickering on and off during startup when base damage is 0.
    if (ourBaseDamage > 0 && highDamageHeirloom) {
        shouldDoMaps = !enoughDamage || shouldFarm || scryerStuck || needPrestige;
        if(!enoughDamage) {
            AutoMapsCoordOverride = true;
            buyWeaponsModeAS3 = 3; //buy/get everything
            updateAutoMapsStatus("", "AutoMaps: Need Damage, forcing Coordination purchase");
        }    
        else
            AutoMapsCoordOverride = false;
    }
    //Check our graph history and - Estimate = The zone should take around this long in milliseconds.
    //mapTimeEstimate = mapTimeEstimater(); //currently unused, but interesting

    var shouldDoHealthMaps = false;
    //if we are at max map bonus (10), and we don't need to farm, don't do maps
    if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
        shouldDoMaps = false;
    else if (game.global.mapBonus >= customVars.maxMapBonus && shouldFarm)
        shouldFarmLowerZone = getPageSetting('LowerFarmingZone');
    //do (1) map if we dont have enough health
    else if (game.global.mapBonus < customVars.wantHealthMapBonus && !enoughHealth && !shouldDoMaps && !needPrestige) {
        debug("automaps wants more health."); //TODO: do we want to run maps for healths? feels unneeded in currentyear
        /*shouldDoMaps = true;
        shouldDoHealthMaps = true;
        if(enoughDamage)
            updateAutoMapsStatus("", "Need Health!");
        else
            updateAutoMapsStatus("", "Need Health/Dmg!");*/
    }

    //Disable Farm mode if we are capped for all attack weapons
    if (shouldFarm && areWeAttackLevelCapped()) {
        shouldFarm = false;
        if (game.global.mapBonus >= customVars.maxMapBonus && !shouldFarm)
            shouldDoMaps = false;
    }

    //during 'watch' challenge, run maps on these levels:
    var watchmaps = customVars.watchChallengeMaps;
    var shouldDoWatchMaps = false;
    if (game.global.challengeActive == 'Watch' && watchmaps.indexOf(game.global.world) > -1 && game.global.mapBonus < 1) {
        shouldDoMaps = true;
        shouldDoWatchMaps = true;
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
    
    //Farm X Minutes Before Spire:
    var shouldDoSpireMaps = false;
    preSpireFarming = (isActiveSpireAT()) && (spireTime = (new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire');
    spireMapBonusFarming = getPageSetting('MaxStacksForSpire') && isActiveSpireAT() && game.global.mapBonus < customVars.maxMapBonus;
    if (preSpireFarming || spireMapBonusFarming) {
        shouldDoMaps = true;
        shouldDoSpireMaps = true;
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
    if (getPageSetting('DynamicSiphonology') || shouldFarmLowerZone) {
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = ourBaseDamage2;// * (game.unlocks.imps.Titimp ? 2 : 1); // *2 for titimp. (ourBaseDamage2 has no mapbonus in it)
            if (game.upgrades.Dominance.done && !getPageSetting('ScryerUseinMaps2'))
                mapdmg *= 4; //dominance stance and not-scryer stance in maps.
            if (game.global.challengeActive == "Daily"){
                if (typeof game.global.dailyChallenge.badMapHealth !== 'undefined' && game.global.mapsActive)
                    maphp *= dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength);
            }
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
            //only accept LMC maps
            if (game.global.mapsOwnedArray[map].level == siphlvl && (game.global.highestLevelCleared < 185 || game.global.mapsOwnedArray[map].bonus == "lmc"))
                siphonMap = map;
        }
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
            }
        }
    }

    doVoids = checkNeedToVoid();
    
    updateAutoMapsStatus("", "");
    
    //LEAD EVEN ZONE EXIT
    //don't map on even worlds if on Lead Challenge, except if person is dumb and wants to void on even
    if (game.global.challengeActive == 'Lead' && !doVoids && (game.global.world % 2 == 0 || game.global.lastClearedCell < customVars.shouldFarmCell)) {
        if (game.global.preMapsActive)
            mapsClicked();
        return; //exit
    }
    
    //this code prevents automaps from killing our army and going into map screen under certain conditions:    
    if (game.global.soldierHealth > 1000){//if we have an army currently fighting
        if(!doVoids){ //and we dont need to voids
            if(!game.global.mapsActive && !game.global.preMapsActive){ //and we are in the world screen
                if (game.resources.trimps.owned < game.resources.trimps.realMax()){ //and we dont have another army ready, then we may as well stay in the world until another army is ready. may not be true for some dailies
                    if (getEmpowerment() == "Poison"){
                        if(currWorldZone % 10 != 5 && currWorldZone % 10 != 0) //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                            return;
                    }
                    else //ice/wind/no empowerment: always stay in world if army isnt ready
                        return;
                }
            }
        }
    }

    //MAPS CREATION pt1:
    if ((shouldDoMaps || doVoids || needPrestige) && selectedMap == "world") {
        selectedMap = "create";
        
        if (doVoids)
            selectedMap = findVoidMap();
        else if (preSpireFarming) { //if preSpireFarming x minutes is true, switch over from wood maps to metal maps.
            updateAutoMapsStatus("", "Spire Farming");
            var spiremaplvl = (game.talents.mapLoot.purchased && MODULES["maps"].SpireFarm199Maps) ? game.global.world - 1 : game.global.world;
            if (game.global.mapsOwnedArray[highestMap].level >= spiremaplvl && game.global.mapsOwnedArray[highestMap].location == ((customVars.preferGardens && game.global.decayDone) ? 'Plentiful' : 'Mountain'))
                selectedMap = game.global.mapsOwnedArray[highestMap].id;
        }
        else if (needPrestige) { //if needPrestige, TRY to find current level map as the highest level map we own.
            updateAutoMapsStatus("", "Prestige");
            if (game.global.world == game.global.mapsOwnedArray[highestMap].level)
                selectedMap = game.global.mapsOwnedArray[highestMap].id;
        }
        else if (siphonMap != -1) //use the siphonology adjusted map
            selectedMap = game.global.mapsOwnedArray[siphonMap].id;
    }
    
    //3 cases based on where we are: 
    //1) in a map - decide what to do with repeat button
    //2) in the world - do we need to enter the map screen?
    //3) in premap screen - create/select a map and run it, or go back to world
    
    //#1 in a map, figure out repeat button
    if (game.global.mapsActive) { 
        if(selectedMap != game.global.currentMapId){ //if we are not where we want to be, then disable repeat
            if (game.global.repeatMap)
                repeatClicked();
        }
        else{   
            if (!game.global.repeatMap) //start with repeat button on
                repeatClicked();

            var repeatChoice = 1; //0 - forever 1 - map bonus 2 - items 3 - any

            if(behindOnPrestige(getCurrentMapObject().level)) //we still need prestige from our current map
                repeatChoice = 2;

            if (doMaxMapBonus) {
                if(repeatChoice == 2) //if also need prestige, then repeat for any
                    repeatChoice = 3;
                else
                    repeatChoice = 1; //repeat for map bonus
            }
            
            //turn off repeat maps if we doing Watch maps.
            if (shouldDoWatchMaps && game.global.repeatMap)
                repeatClicked();
            //turn repeat off on the last WantHealth map.
            if (shouldDoHealthMaps && game.global.mapBonus >= customVars.wantHealthMapBonus - 1 && game.global.repeatMap) {
                repeatClicked();
                shouldDoHealthMaps = false;
            }

            while (game.options.menu.repeatUntil.enabled != repeatChoice) { //select the correct repeat until option
                toggleSetting('repeatUntil');
            }
        }
    }

    //#2 in the world
    else if (!game.global.preMapsActive && !game.global.mapsActive) { 
        if (selectedMap != "world") {
            //if we should not be in the world, and the button is not already clicked, click map button once (and wait patiently until death)
            if (!game.global.switchToMaps){
                mapsClicked();
            }
            //Get Impatient/Abandon if: (need prestige / _NEED_ to do void maps / on lead in odd world.) AND (a new army is ready, OR _need_ to void map OR lead farming and we're almost done with the zone) (handle shouldDoWatchMaps elsewhere below)
            if ((!getPageSetting('PowerSaving') || (getPageSetting('PowerSaving') == 2) && doVoids) && game.global.switchToMaps && !shouldDoWatchMaps &&
                (needPrestige || doVoids ||
                    (game.global.challengeActive == 'Lead' && game.global.world % 2 == 1) ||
                    (!enoughDamage && enoughHealth && game.global.lastClearedCell < 9) ||
                    (shouldFarm && game.global.lastClearedCell >= customVars.shouldFarmCell) ||
                    (scryerStuck)) &&
                (
                    (game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) ||
                    (game.global.challengeActive == 'Lead' && game.global.lastClearedCell > 93) ||
                    (doVoids && game.global.lastClearedCell > 93)
                )){
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
    } 
    
    //#3 in premap screen
    if (game.global.preMapsActive) { 
        if (selectedMap == "world") {
            mapsClicked(); //go back to world
        } else {
            if (selectedMap == "create") {
                var lvl = (needPrestige ? game.global.world : siphlvl);
                var flag = decideMapParams(lvl, lvl, "LMC", !(shouldFarm || !enoughDamage || !enoughHealth)); //cheap or no cheap
                var flag2 = createAMap(lvl, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                if(!flag || !flag2){
                    debug("Can't afford map with parameters. level: " + lvl + " type: " + type);
                    debug("error in creating map process. Can't afford it? Running existing map instead.");
                    selectedMap = game.global.mapsOwnedArray[highestMap].id; //revert to highest existing map
                }
                else{
                    selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id; //the map we just created
                } 
            }
            //debug("selectedMap " + selectedMap);
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
function updateAutoMapsStatus(get, msg) {

    var status;
    var minSp = getPageSetting('MinutestoFarmBeforeSpire');

    if (msg === "" || msg === undefined || msg.length == 0) 
        status = "";
    else
        status = msg+"<br>";
    
    if (preSpireFarming) {
        var secs = Math.floor(60 - (spireTime * 60) % 60).toFixed(0)
        var mins = Math.floor(minSp - spireTime).toFixed(0);
        var hours = minSp - (spireTime / 60).toFixed(2);
        var spiretimeStr = (spireTime >= 60) ?
            (hours + 'h') : (mins + 'm:' + (secs >= 10 ? secs : ('0' + secs)) + 's');
        status = 'Farming for Spire ' + spiretimeStr + ' left<br>';
    } else if (spireMapBonusFarming) status = 'Getting Spire Map Bonus<br>';
    else if (doVoids && voidCheckPercent == 0) status = 'Remaining VMs: ' + game.global.totalVoidMaps + "<br>";
    else if (skippedPrestige) status += '<br><b style="font-size:.8em;color:pink;margin-top:0.2vw">Prestige Skipped</b><br>'; // Show skipping prestiges
    else if (!(enoughHealth)) status = 'Need Health<br>';
    
    var formattedRatio;
    if(HDratio > 1e6 || HDratio < 1e-6)
        formattedRatio = HDratio;
    else
        formattedRatio = HDratio;
    status = status + "Ratio = " + formattedRatio;
    /*
    else if (doMaxMapBonus) status = 'Max Map Bonus After Zone';
    else if (!game.global.mapsUnlocked) status = '&nbsp;';
    else if (needPrestige && !doVoids) status = 'Prestige';
    else if (needToVoid && !doVoids && game.global.totalVoidMaps > 0) status = 'Prepping for Voids';
    else if (doVoids && voidCheckPercent > 0) status = 'Farming to do Voids: ' + voidCheckPercent + '%';
    else if (shouldFarm && !doVoids) status = 'Farming: ' + HDratio.toFixed(2) + 'x';
    else if (scryerStuck) status = 'Scryer Got Stuck, Farming';
    else if (!enoughHealth && !enoughDamage) status = 'Want Health & Damage';
    else if (!enoughDamage) status = 'Want ' + HDratio.toFixed(2) + 'x &nbspmore damage';
    else if (!enoughHealth) status = 'Want more health';
    */

    if (getPageSetting('AutoMaps') == 0) status = 'Off';

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

//returns true when done
function PrestigeRaid() {
    var StartZone = getPageSetting('PRaidingZoneStart'); //from this zone we prestige raid. -1 to ignore
    var PAggro = getPageSetting('PAggression'); //0 - light 1 - aggressive. 
    var PRaidMax = getPageSetting('PRaidingMaxZones'); //max zones to plus map
    presRaiding = true; //for message passing to UI
    
    if (PRaidMax > 10){
        PRaidMax = 10;
        setPageSetting('PRaidingMaxZones', 10);
    }
    else if (PRaidMax < 0){
        PRaidMax = 0;
        setPageSetting('PRaidingMaxZones', 0);
    }
    
    //at the zone where we BW, we want the most gear from normal maps that is possible.
    if (game.global.world == getPageSetting('BWraidingz') && getPageSetting('BWraid') &&
        !(getPageSetting('BWraidDailyCOnly') && !(game.global.runningChallengeSquared || game.global.challengeActive)))
            PRaidMax = 10;
    
    if (StartZone == -1 || currWorldZone < StartZone || PRaidMax <= 0 || getPageSetting('AutoMaps') == 0){
        return true; 
    }
    
    var havePrestigeUpTo = calcPrestige(); //check currently owned prestige levels
    findDesiredMapLevel(currWorldZone, PRaidMax, PAggro, havePrestigeUpTo); //decide which level we want to raid up to

    if(havePrestigeUpTo >= maxDesiredLevel) //have all the prestige levels that we want.
        return true; 
    
    if (game.global.mapsActive){ //if we are in a map
        //do we need prestige from this map?
        var needPrestige = behindOnPrestige(getCurrentMapObject().level);
        if(needPrestige){
            if(getCurrentMapObject().location === "Bionic"){
                var map = game.global.mapsOwnedArray[getMapIndex(game.global.currentMapId)];
                updateAutoMapsStatus("", "BW Raiding: "+ addSpecials(true, true, map));
            }
            else{
                var map = game.global.mapsOwnedArray[getMapIndex(game.global.currentMapId)];
                updateAutoMapsStatus("", "Prestige Raid: " + addSpecials(true, true, map));
            }
        }
        else{
            if (game.global.repeatMap) {//make sure repeat button is turned off
                repeatClicked();
            }
            updateAutoMapsStatus("", "Finishing Map");
        }
        
        return false;
    }
    
    //this code prevents automaps from killing our army and going into map screen under certain conditions:    
    if (game.global.soldierHealth > 1000){//if we have an army currently fighting
        if(!game.global.mapsActive && !game.global.preMapsActive){ //and we are in the world screen
            if (game.resources.trimps.owned < game.resources.trimps.realMax()){ //and we dont have another army ready, then we may as well stay in the world until another army is ready. may not be true for some dailies
                if (getEmpowerment() == "Poison"){
                    if(currWorldZone % 10 != 5 && currWorldZone % 10 != 0){ //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                        if(!doVoids)
                            return false; //we'll want to keep revisiting prestigeRaid until something changes
                        else //need to run void maps
                            return true;
                    }
                }
            }
        }
    }
    
    //Let's see if we already own a map of suitable level
    var map = findMap(minDesiredLevel); //ignores bionics and uniques
    if(map == -1){ //do not own a high enough map, try to make one if we can afford it
        //find best match map we can afford
        if(maxDesiredLevel-havePrestigeUpTo>=8){
            debug("need to run " + (maxDesiredLevel-havePrestigeUpTo)+" maps levels higher, running +6 first");
            var foundSuitableMap = decideMapParams(havePrestigeUpTo+6, havePrestigeUpTo+6, "Prestigious", true); //get dagger first for speed before going max level map
        }
        else
            var foundSuitableMap = decideMapParams(minDesiredLevel, maxDesiredLevel, "Prestigious", false);

        if (!foundSuitableMap){
            //debug("Could not create a suitable map. min " + minDesiredLevel + " max " + maxDesiredLevel + " currWorldZone " + currWorldZone + " extraLevels " + extraLevels);
            //debug("Cheapest map level " + (currWorldZone+extraLevels) + "  would cost " + cost.toPrecision(3) + " fragments.");
            //debug("Exiting.");
            updateAutoMapsStatus("", "Need Fragments. Advancing."); //UI
            return true;
        }
        debug("Level = "+(baseLevel+extraLevels)+"|"+sizeSlider+"|"+diffSlider+"|"+lootSlider+"|"+specialMod+"|perfect="+perfect+ "|"+type+" cost: " + cost.toPrecision(3) + " / " + game.resources.fragments.owned.toPrecision(3) + " fragments.");
    }
    

    if (!game.global.preMapsActive) { //in world, get to map screen
        mapsClicked();
    }

    if(map == -1){
        //lets create the map
        var flag = createAMap(currWorldZone, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
        if (!flag){
            debug("error in creating map process");
            //updateAutoMapsStatus("", "Error in creating map"); //UI
            return true;
        }
        selectMap(game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1].id); //the map we just created
    }
    else{ //we have a map with prestige available in our map list
        selectMap(map.id);
    }
    
    debug("havePrestigeUpTo = " + havePrestigeUpTo + " | minDesiredLevel = " + minDesiredLevel + " | maxDesiredLevel = " + maxDesiredLevel, "general", "");
    
    runMap();
    
    var map = game.global.mapsOwnedArray[getMapIndex(game.global.currentMapId)];
    updateAutoMapsStatus("", "Prestige Raid: " + addSpecials(true, true, map));

    if (!game.global.repeatMap) {
        repeatClicked();
    } 
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
    
    return false;
}

function createAMap(baseLevel, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect){
    if (!game.global.preMapsActive && !game.global.mapsActive) { 
        mapsClicked();
        if (!game.global.preMapsActive) 
            mapsClicked();
	debug("Entered map screeen");
    }
    
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
                
    if (game.global.preMapsActive){ 
        document.getElementById("mapLevelInput").value = baseLevel;
        if (baseLevel != currWorldZone)
            extraLevels = 0;
        
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
            var result = buyMap();
            if (result == -2) {
                    debug("Too many maps, recycling now: ", "maps", 'th-large');
                    recycleBelow(true);
                    debug("Retrying, Buying a Map, level: #" + (baseLevel+extraLevels), "maps", 'th-large');
                    buyMap();
                }
            return true;
        }
        else {
            debug("Failed to prestige raid. We can't afford the map.");
            debug("Expected map level " + (currWorldZone+extraLevels) + " is " + cost + " and we have " + fragments + " frags.");
            return false;
        }
    }
    else
        debug("error: not in premap screen");
    return false;
}

//searches for a map of at least minimum level
function findMap(level){
    var bestSoFar = -1;
    var theMap;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) { //not a unique map
        //if (!map.noRecycle) { //not a unique map
            if(game.global.mapsOwnedArray[map].level >= bestSoFar && game.global.mapsOwnedArray[map].level >= level){
            //if(map.level >= bestSoFar && map.level >= level){
                theMap = game.global.mapsOwnedArray[map];
                bestSoFar = theMap.level;
                //debug("map is " + theMap + "game.global.mapsOwnedArray[map] " + game.global.mapsOwnedArray[map] + "game.global.mapsOwnedArray[map].level " +game.global.mapsOwnedArray[map].level + " game.global.mapsOwnedArray[map].noRecycle" + game.global.mapsOwnedArray[map].noRecycle);
            }
        }
    }    
    if (bestSoFar>-1){
        return theMap;
    }
    return -1;
}

function decideMapParams(minLevel, maxLevel, special, cheap){
    var fragments = game.resources.fragments.owned;
    baseLevel = Math.min(currWorldZone, maxLevel); //if maxLevel == currWorldZone that means extra levels is 0 and we are doing world zone map at the highest.
    var sizeLast=0, diffLast=0, lootLast=0, specialModLast="", perfectLast=false, extraLevelsLast=minLevel-baseLevel, typeLast="Random";
    if (special == "LMC")
        specialModLast = "LMC";
    else specialModLast = "";
    
    var mostExpensiveType;
    if (cheap)
        mostExpensiveType = "Random";
    else{
        if(customVars.preferGardens && game.global.decayDone)
            mostExpensiveType = "Plentiful";
        else
            mostExpensiveType = "Mountain";
    }
    
    if(maxLevel < baseLevel) maxLevel = baseLevel;
    if(minLevel > maxLevel) minLevel = maxLevel;    
    
    //function calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod,     perfect,     extraLevels,     type){
    cost =      calcMapCost(minLevel, sizeLast,   diffLast,   lootLast,   specialModLast, perfectLast, extraLevelsLast, typeLast);
    if(cost > fragments){
        //debug("cant afford map level " + minLevel);
        sizeSlider = 0;
        diffSlider = 0;
        lootSlider = 0;
        specialMod = "";
        extraLevels = minLevel-baseLevel;
        perfect = false;
        type = "Random";
        return false;
    }

    //order of importance for prestigious maps (prestige mode):
    //size > prestigious > difficulty > perfect
    //order of importance for LMC maps (map bonus/metal):
    //LMC (must have) > size  > difficulty > loot > perfect > Garden
    
    //iterate over all values in order of priority to find the best map we can afford.
    //at all times the 'Last' variables hold affordable configuration.
    
    while(true){
        for(lootEnum = 0; lootEnum <= 9; lootEnum++){
            if(  calcMapCost(baseLevel, sizeLast,   diffLast,   lootEnum,   specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                lootLast = lootEnum;
            else
                break;            
            
            for(diffEnum = 0; diffEnum <= 9; diffEnum++){
                if(  calcMapCost(baseLevel, sizeLast,   diffEnum,   lootLast,   specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                    diffLast = diffEnum;
                else
                    break;

                if(special != "LMC"){ //LMC never skip. prestigious maybe skip
                    if(  calcMapCost(baseLevel, sizeLast,   diffLast,   lootLast,   "Prestigious", perfectLast, extraLevelsLast, typeLast) < fragments)
                        specialModLast = "Prestigious";
                    else
                        specialModLast = "";
                }

                for(sizeEnum = 0; sizeEnum <= 9; sizeEnum++){
                    if(  calcMapCost(baseLevel, sizeEnum,   diffLast,   lootLast,   specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                        sizeLast = sizeEnum;
                    else
                        break;
                }
            }
        }
        
        if(sizeLast+diffLast+lootLast < 27)
            perfectLast=false;
        else{
            if(  calcMapCost(baseLevel, sizeLast,   diffLast,   lootLast,   specialModLast, true, extraLevelsLast, typeLast) < fragments)
                perfectLast = true;
            else
                perfectLast = false;
        }
        
        if(2 * calcMapCost(baseLevel, sizeLast,   diffLast,   lootLast,   specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments && special == "LMC")
            typeLast = mostExpensiveType;
        else
            typeLast = "Random";
        
        sizeSlider = sizeLast;
        diffSlider = diffLast;
        lootSlider = lootLast;
        specialMod = specialModLast;
        extraLevels = extraLevelsLast;
        if(!cheap){
            perfect = perfectLast;
            type = typeLast;
        }
        else{//for quick +6 maps we never wanna spend the frags for perfect/garden
            perfect = false;
            type = "Random";
        }
        if(specialMod != "LMC"){
            perfect = false;
            lootSlider = 0;
        }
        
        if(extraLevelsLast+1 > maxLevel-baseLevel)
            break;
        
        if(specialModLast == "LMC"){
            if(calcMapCost(baseLevel, 0, 0, 0, "LMC", false, extraLevelsLast+1, "Random") < fragments){
                sizeLast=0; diffLast=0; lootLast=0; specialModLast="LMC"; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
            }
            else
                break;
        }
        if(calcMapCost(baseLevel, 0, 0, 0, "", false, extraLevelsLast+1, "Random") < fragments){
             sizeLast=0; diffLast=0; lootLast=0; specialModLast=""; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
        }
        else
            break;
    
    }
    
    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
    if(fragments >= cost){
        return true;
    }
    
    debug("error: can't afford map level " + minLevel);
    return false;
}

function findDesiredMapLevel(currWorldZone, PRaidMax, PAggro, havePrestigeUpTo){
    var empowerment = getEmpowerment();
    var lastDigitZone = currWorldZone % 10;
    
    //are we in an active spire? if so we always want +5 map levels
    if(currWorldZone % 100 == 0 && currWorldZone >= getPageSetting('IgnoreSpiresUntil')){
        //debug("active spire mode");
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
            else{ //xx6-xx9 special case, we want to run xx1 then xx2 then xx3 for faster clear
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
    if(maxDesiredLevel % 10 == 0) //bring 540 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - 5;
    else if (maxDesiredLevel % 10 > 5) //bring 536 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - maxDesiredLevel % 10 + 5;
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
    else if(specialMod == "LMC")
        baseCost += 18;
    else if(specialMod == "FA")
        baseCost += 7;
    baseCost += (perfect ? 6 : 0);
    baseCost += 10 * extraLevels;
    baseCost += baseLevel;
    baseCost = Math.floor((((baseCost / 150) * (Math.pow(1.14, baseCost  - 1))) * baseLevel  * 2) * Math.pow((1.03 + (baseLevel / 50000)), baseLevel))* (type == "Random" ? 1 : 2);
    return baseCost;
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

function behindOnPrestige(zone) {
    var havePrestigeUpTo = calcPrestige();
    var lastPrestigeZone;
    if (zone == null)
        zone = currWorldZone;
    if (zone % 10 > 5)
        lastPrestigeZone = zone - (zone % 10) + 5;
    else if (zone % 10 == 0)
        lastPrestigeZone = zone-5;
    else
        lastPrestigeZone = zone;
    
    if (havePrestigeUpTo < lastPrestigeZone)
        return true;
    else
        return false;
}

function fragCalc(){
    var fragIncome = 0;
    
    //for true, need to be currently in a map
    //fragIncome = rewardResource("fragments", 1, currWorldZone-1, true);
    fragIncome = 5;
    
    //debug("fragIncome = " + fragIncome);
    return fragIncome;
}

function checkNeedToVoid(){
    //FIND VOID MAPS LEVEL:
    var voidMapLevelSetting = getPageSetting('VoidMaps');
    //Add your daily zone mod onto the void maps level
    var dailyVoidMod = getPageSetting('AutoFinishDailyNew');
    if (game.global.challengeActive == "Daily" && getPageSetting('AutoFinishDailyNew') != 999 && getPageSetting('DailyVoidMod'))
        voidMapLevelSetting += dailyVoidMod;
    
    //decimal void maps are possible, using string function to avoid false float precision (0.29999999992). javascript can compare ints to strings anyway.
    var voidMapLevelSettingZone = (voidMapLevelSetting + "").split(".")[0];
    var voidMapLevelSettingMap = (voidMapLevelSetting + "").split(".")[1];
    if (voidMapLevelSettingMap === undefined || (game.global.challengeActive == 'Lead'))
        voidMapLevelSettingMap = 90;
    if (voidMapLevelSettingMap.length == 1) voidMapLevelSettingMap += "0"; //entering 187.70 becomes 187.7, this will bring it back to 187.70
    var voidsuntil = getPageSetting('RunNewVoidsUntilNew');
    doVoids = voidMapLevelSetting > 0 && game.global.totalVoidMaps > 0 && game.global.lastClearedCell + 1 >= voidMapLevelSettingMap &&
        (game.global.world == voidMapLevelSettingZone ||
            (game.global.world >= voidMapLevelSettingZone && getPageSetting('RunNewVoidsUntilNew') != 0 && (voidsuntil == -1 || game.global.world <= (voidsuntil + voidMapLevelSettingZone))));
    if (game.global.totalVoidMaps == 0)
        doVoids = false;
    return doVoids;
}

function findVoidMap(){
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
        return theMap.id;
    }
    return null;

}

function windZone(){
    return (game.global.world-241) % 15 <= 4 && game.global.world > 240;
}

function poisonZone(){
    return ((game.global.world-236) % 15 <= 4);
}