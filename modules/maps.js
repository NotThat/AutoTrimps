MODULES["maps"] = {};
//These can be changed (in the console) if you know what you're doing:

var remainingCells = 100;

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
MODULES["maps"].wantHealthMapBonus = 10; //cap how many maps are run during Want More Health mode
MODULES["maps"].SpireFarm199Maps = true; //this will farm spire on 199 maps instead of 200 maps when Map Reducer is bought
MODULES["maps"].watchChallengeMaps = [15, 25, 35, 50]; //during 'watch' challenge, run maps on these levels:
MODULES["maps"].UnearnedPrestigesRequired = 2;
//- init as default value (10). user can set if they want.

//Initialize Global Vars
var customVars = MODULES["maps"];  
var doVoids = false;
var presRaiding = false;
var BWRaidingStatus = false;
var needToVoid = false;
var needPrestige = false;
var skippedPrestige = false;
var ourBaseDamage = 0;
var ourBaseDamagePlusOne = 0;
var shouldDoMaps = false;
var mapTimeEstimate = 0;
var preSpireFarming = false;
var spireMapBonusFarming = false;
var spireTime = 0;
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
var lastMsg; //stores last message, stops spam to console
var AutoMapsCoordOverride = false;
var PRaidingActive = false; //used for coordination purchase during praids
var spireStackFirst = true;

var prestigeState = 0;

var status = "";

function calcDmg(){    
    //if(!highDamageHeirloom) //automaps() calculates using the good shield
    //    equipMainShield();

    calcBaseDamageinB();
    
    ourBaseDamage = baseDamageHigh*8;
    
    if(getPageSetting('AutoStance') == 2) //when in DE farming mode, we climb in S
        ourBaseDamage = ourBaseDamage / (game.talents.scry.purchased ? 4 : 8);

    //calculate dmg with max anticipation in autogen setting #3 (so if its lower than max, our max is lower than max
    if(game.global.antiStacks < maxAnti){
        var max = Math.min(game.global.GeneticistassistSteps[3], maxAnti);
        ourBaseDamage = ourBaseDamage * (1+0.2*max) / (1+0.2 * game.global.antiStacks);
    }
    
    //if autostance forces not to buy coordinations, factor those in. otherwise we'll enter maps for more damage thinking that we dont have enough.
    if(buyCoords == false && canAffordCoordinationTrimps() && getPageSetting('AutoStance')){
        var missingCoords = game.global.world - 1 + (game.global.world > 230 ? 100 : 0) - game.upgrades.Coordination.done;
        ourBaseDamage = ourBaseDamage * Math.pow(1.25, missingCoords);
    }
    
    if(game.global.mapsActive){
        if (game.global.titimpLeft > 1)
            ourBaseDamage *= 0.5; //remove titimp bonus
        ourBaseDamagePlusOne = (ourBaseDamage * (1 + (0.2 * (game.global.mapBonus >= 10 ? game.global.mapBonus : (game.global.mapBonus + 1)))));
        ourBaseDamage *= 1 + (0.2 * game.global.mapBonus); //add map bonus


    }
    
    const FORMATION_MOD_1 = game.upgrades.Dominance.done ? 2 : 1;
    
    //get average enemyhealth and damage for the next zone, cell 50, snimp type and multiply it by a max range fluctuation of 1.2

    enemyHealth = getEnemyMaxHealth(game.global.world, 50);
    if (game.global.challengeActive == "Toxicity") {
        enemyHealth *= 2;
    }
    else if (game.global.challengeActive == "Obliterated"){
        var oblitMult = Math.pow(10,12);
        var zoneModifier = Math.floor(game.global.world / 10);
        oblitMult *= Math.pow(10, zoneModifier);
        enemyHealth *= oblitMult;
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
    if (game.global.world >= mutations.Corruption.start(true)) {
        var cptnum = getCorruptedCellsNum(); //count corrupted cells
        var cpthlth = getCorruptScale("health"); //get corrupted health mod
        var cptpct = cptnum / 100; //percentage of zone which is corrupted.
        var hlthprop = cptpct * cpthlth; //Proportion of cells corrupted * health of a corrupted cell
        if (hlthprop >= 1) //dont allow sub-1 numbers to make the number less
            enemyHealth *= hlthprop;
    }
    
    if (windZone() && getPageSetting('AutoStance') == 1 && !game.global.runningChallengeSquared)
        windMult = 0.125; //in windstacking zones, we want less dmg since we can equip high damage shield to compensate
    else
        windMult = 1;
    poisonMult = (getEmpowerment() == "Poison" ? poisonMultFixed : 1);
    
    remainingCells = 99 - game.global.lastClearedCell;
    
    threshhold = poisonMult * windMult * remainingCells * 0.01;
    
    DHratio = (ourBaseDamage*0.25 / enemyHealth);
    enoughDamage = DHratio > threshhold;
    nextZoneDHratio = DHratio / (game.jobs.Magmamancer.getBonusPercent() * ((game.global.mapBonus * .2) + 1) * 2);
    
    var cellNum = (game.global.mapsActive) ? game.global.lastClearedMapCell + 1 : game.global.lastClearedCell + 1;
    var cell = (game.global.mapsActive) ? game.global.mapGridArray[cellNum] : game.global.gridArray[cellNum];
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 8) && checkForGoodCell(0);
    if(game.global.mapsActive && !stackSpire){
        if(BWRaidNowLogic()){ //bwraid, buy all
            getDamageCaller(cell.health*8*9999, false, true);
        }
        else if(game.global.world % 100 === 0){ //mapping for prestige in spire4 without spire stacking. we probably want all the damage.
            var requiredDmgToOK = dmgNeededToOKHelper(80, worldArray[80].maxHealth);
            getDamageCaller(requiredDmgToOK*3, false, true);
        }
        else{   
            if(currMap.location == "Void"){
                var requiredDmgToOK = dmgNeededToOKHelper(cellNum, cell.health);
                getDamageCaller(requiredDmgToOK*30*8, false, true); //doing voids in S stance
            }
            if(poisonZone() && game.global.world % 10 === 5 && zoneWorth > 1){ //xx5 poison zone potentially mapping +10. if zones worth is high we dont wanna overshoot damage or we wont be able to stack properly next zone(s)
                var limit = 20;
                getDamageCaller(8*baseDamageHigh * 3*limit / DHratio, false);
            }
            else{
                var requiredDmgToOK = dmgNeededToOKHelper(cellNum, cell.health);
                getDamageCaller(requiredDmgToOK*3, false, true);
            }
        }
    }
    
    if(DHratio < 0.0001)
        formattedRatio = DHratio.toExponential(2);
    else if (DHratio < 1)
        formattedRatio = DHratio.toFixed(3);
    else if (DHratio < 10000)
        formattedRatio = DHratio.toFixed(1);
    else
        formattedRatio = DHratio.toExponential(2);
}

function autoMap() {
    //if (game.global.gridArray.length === 0) //world not ready yet
    //    return;
    
    var AS = getPageSetting('AutoStance');
    var ASMode;
    if(AS < 2)       ASMode = "Advancing";
    else if(AS == 2) ASMode = "DE";
    else             ASMode = "Push";
    statusMsg = ASMode;
    wantGoodShield = true;
    AutoMapsCoordOverride = false;
    calcDmg(); //checks enoughdamage/health to decide going after map bonus. calculating it here so we can display hd ratio in world screen
    
    if(!(getPageSetting('AutoMaps') > 0))
        return;

    //exit and do nothing if we are prior to zone 6 (maps haven't been unlocked):
    if (!game.global.mapsUnlocked || !(ourBaseDamage > 0)) { //if we have no damage, why bother running anything? (this fixes weird bugs)
        enoughDamage = true;
        return;
    }
    
    //check if we want to trimpicide for stacks
    if(game.global.soldierHealth > 0 && game.global.mapsActive && hiddenBreedTimer > maxAnti && game.global.antiStacks < maxAnti-1 && typeof game.global.dailyChallenge.bogged === 'undefined'){
        debug("Maps: Trimpiciding to get max stacks", "trimpicide");
        if(currMap.location == "Void"){
            mapsClicked(true);
            cancelTooltip()
        }
        else
            mapsClicked();
        trimpicides++;
    }
    
    if (game.global.mapsActive){
        wantGoodShield = true; //always want good shield in maps
        if(currMap.location == "Void" && useScryhard2()){
            goDefaultStance(4); //S
        }
        else
            goDefaultStance(); //D if we have it, X otherwise
    }
    
    //if we are prestige mapping, force equip first mode
    var prestige = autoTrimpSettings.Prestige.selected;
    if (prestige != "Off" && game.options.menu.mapLoot.enabled != 1 && game.global.mapsActive) toggleSetting('mapLoot');
    //Control in-map right-side-buttons.
    if (game.options.menu.exitTo.enabled != 0) toggleSetting('exitTo');
    
    //if we are in mapology and we have no credits, exit
    if (game.global.challengeActive == "Mapology" && game.challenges.Mapology.credits < 1) {
        statusMsg = "No Map Credits";
        return;
    }
    
    if (!enoughDamage)
        AutoMapsCoordOverride = true;
    
    preSpireFarming = false;
    spireMapBonusFarming = false;
    needPrestige = (lastPrestigeZone() < lastDropZone()) || (lastPrestigeZone() == lastDropZone() && prestigeState != 2);
    
    if (!needPrestige && getPageSetting('PRaidingZoneStart') >0){
        if(!PrestigeRaid()){ //prestigeraid is not done yet so we'll return to it in the next visit to autoMaps() function. until then go back to main AT so we can purchase prestiges and stuff
            PRaidingActive = true;
            return; 
        }
        else{
            statusMsg = ASMode;
        }
    }
    
    PRaidingActive = false;
    
    if (!needPrestige && getPageSetting('BWraid') && (!getPageSetting('BWraidDailyC2Only') || game.global.challengeActive)){
        if(!BWraiding()){ //BW Raiding
            return; 
        }
        else{
            statusMsg = ASMode;
        }
    }
    
    //BEGIN AUTOMAPS DECISIONS:
    shouldDoMaps = !enoughDamage && game.global.mapBonus < 10;
    var selectedMap = "world";

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
    
    //spire specific settings
    var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 8);
    var stackSpireGetMinDamage = stackSpire && (game.global.lastClearedCell + 1 === 0) && (checkForGoodCell(0));
    preSpireFarming = (isActiveSpireAT()) && ((spireTime = (new Date().getTime() - game.global.zoneStarted) / 1000 / 60) < getPageSetting('MinutestoFarmBeforeSpire') || getPageSetting('MinutestoFarmBeforeSpire') < 0);
    spireMapBonusFarming = getPageSetting('MaxStacksForSpire') && isActiveSpireAT() && game.global.mapBonus < 10;
    if (preSpireFarming || spireMapBonusFarming || stackSpireGetMinDamage)
        shouldDoMaps = true;

    //Allow automaps to work with in-game Map at Zone option:
    vanillaMapatZone = (game.options.menu.mapAtZone.enabled && game.global.canMapAtZone && !isActiveSpireAT());
    var shouldDoMapsVanillaRepeat = false;
    if (vanillaMapatZone)
        for (var x = 0; x < game.options.menu.mapAtZone.setZone.length; x++){
             if (game.global.world == game.options.menu.mapAtZone.setZone[x]){
                 shouldDoMapsVanillaRepeat = true;
                 break;
             }
        }
    
    //Dynamic Siphonology section (when necessary)
    //Lower Farming Zone = Lowers the zone used during Farming mode. Starts 10 zones below current and Finds the minimum map level you can successfully one-shot
    var siphlvl = game.global.world - game.portal.Siphonology.level;
    var maxlvl = game.talents.mapLoot.purchased ? game.global.world - 1 : game.global.world;
    if (getPageSetting('DynamicSiphonology') && windZone()){ //outside of wind zones we get bad value from doing not the lowest siph maps.
        for (siphlvl; siphlvl < maxlvl; siphlvl++) {
            //check HP vs damage and find how many siphonology levels we need.
            var maphp = getEnemyMaxHealth(siphlvl) * 1.1; // 1.1 mod is for all maps (taken out of the function)
            var cpthlth = getCorruptScale("health") / 2; //get corrupted health mod
            if (mutations.Magma.active())
                maphp *= cpthlth;
            var mapdmg = baseDamageHigh * 8;
            if(game.global.mapsActive)
                mapdmg = mapdmg / (1 + 0.2*game.global.mapBonus);
            
            if (game.global.challengeActive == "Daily"){
                if (typeof game.global.dailyChallenge.badMapHealth !== 'undefined' && game.global.mapsActive)
                    maphp *= dailyModifiers.badMapHealth.getMult(game.global.dailyChallenge.badMapHealth.strength);
            }
            if (mapdmg < maphp) {
                break;
            }
        }
    }
    if(game.global.world % 100 != 0)
        siphlvl = game.global.world - game.portal.Siphonology.level; //speed up run. is this better?
    
    //if we dont need the resources and arent in wind zones, always farm lowest map that gives map bonus
    var preferFAMaps = false;
    if(game.equipment["Dagger"].level > 100 && game.equipment["Greatsword"].level > 100 && !windZone())
        preferFAMaps = true;
    
    var obj = {};
    var siphonMap = -1;
    for (var map in game.global.mapsOwnedArray) {
        if (!game.global.mapsOwnedArray[map].noRecycle) { //not a unique map
            obj[map] = game.global.mapsOwnedArray[map].level; //find map with correct level
            //Get matching map for our siphonology level

            if (preferFAMaps && game.global.mapsOwnedArray[map].level == siphlvl && (game.global.highestLevelCleared < 185 || game.global.mapsOwnedArray[map].bonus == "fa")){
                siphonMap = map;
                break;
            }
            else if (!preferFAMaps && game.global.mapsOwnedArray[map].level == siphlvl && (game.global.highestLevelCleared < 185 || game.global.mapsOwnedArray[map].bonus == "lmc")){
                siphonMap = map;
                break;
            }
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
                    selectedMap = theMap;
                    break;
                }
                //game.global.portalActive
                //if (theMap.name == 'Dimension of Anger' && document.getElementById("portalBtn").style.display == "none" && !game.talents.portal.purchased) {
                if (theMap.name == 'Dimension of Anger' && !game.global.portalActive) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 20 + theMapDifficulty) continue;
                    selectedMap = theMap;
                    break;
                }
                var dont = game.global.runningChallengeSquared;
                if (theMap.name == 'The Block' && !game.upgrades.Shieldblock.allowed && ((game.global.challengeActive == "Scientist" || game.global.challengeActive == "Trimp") && !dont || getPageSetting('BuyShieldblock'))) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if (game.global.world < 11 + theMapDifficulty) continue;
                    selectedMap = theMap;
                    break;
                }
                /*var treasure = getPageSetting('TrimpleZ');
                if (theMap.name == 'Trimple Of Doom' && (!dont && (game.global.challengeActive == "Meditate" || game.global.challengeActive == "Trapper") && game.mapUnlocks.AncientTreasure.canRunOnce && game.global.world >= treasure)) {
                    var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                    if ((game.global.world < 33 + theMapDifficulty) || treasure > -33 && treasure < 33) continue;
                    selectedMap = theMap;
                    if (treasure < 0) // need to reset
                        setPageSetting('TrimpleZ', 0);
                    break;
                }*/
                if (!dont) {
                    //run the prison only if we are 'cleared' to run level 80 + 1 level per 200% difficulty. Could do more accurate calc if needed
                    if (theMap.name == 'The Prison' && (game.global.challengeActive == "Electricity" || game.global.challengeActive == "Mapocalypse")) {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 80 + theMapDifficulty) continue;
                        selectedMap = theMap;
                        break;
                    }
                    if (theMap.name == 'Bionic Wonderland' && game.global.challengeActive == "Crushed") {
                        var theMapDifficulty = Math.ceil(theMap.difficulty / 2);
                        if (game.global.world < 125 + theMapDifficulty) continue;
                        selectedMap = theMap;
                        break;
                    }
                }
            }
        }
    }

    doVoids = checkNeedToVoid();
    if(doVoids && game.options.menu.repeatVoids.enabled != 1) toggleSetting('repeatVoids');
    else if(!doVoids && game.options.menu.repeatVoids.enabled != 0) toggleSetting('repeatVoids');
    
    //LEAD EVEN ZONE EXIT
    //don't map on even worlds if on Lead Challenge, except if person wants to void on even
    if (game.global.challengeActive == 'Lead' && !doVoids && game.global.world % 2 == 0) {
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
                        if(game.global.world % 10 != 5 && game.global.world % 10 != 0) //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                            return;
                    }
                    else //ice/wind/no empowerment: always stay in world if army isnt ready
                        return;
                }
            }
        }
    }


    //MAPS CREATION pt1:
    if ((shouldDoMaps || doVoids || needPrestige || shouldDoMapsVanillaRepeat) && selectedMap == "world") {
        selectedMap = "create";
        
        if (doVoids){
            //selectedMap = findVoidMap();
            if(game.global.mapsActive && currMap.location === "Void"){
                selectedMap = currMap;
            }
            else
                selectedMap = findFirstVoidMap(); //returns map object or false

            if(!selectedMap){
                debug("No void found. Continuing.");
                return;
            }
        }
        else if (preSpireFarming) { //if preSpireFarming x minutes is true, switch over from wood maps to metal maps.
            statusMsg = "Spire Farm: ";
            var spiremaplvl = (game.talents.mapLoot.purchased && MODULES["maps"].SpireFarm199Maps) ? game.global.world - 1 : game.global.world;
            if (game.global.mapsActive) {
                if(currMap.level === spiremaplvl)
                    selectedMap = currMap;
            }
            else if (game.global.mapsOwnedArray[highestMap].level >= spiremaplvl && game.global.mapsOwnedArray[highestMap].location == ((customVars.preferGardens && game.global.decayDone) ? 'Plentiful' : 'Mountain'))
                selectedMap = game.global.mapsOwnedArray[highestMap];
        }
        else if (needPrestige) { //if needPrestige, TRY to find current level map as the highest level map we own.
            if (game.global.world == game.global.mapsOwnedArray[highestMap].level)
                selectedMap = game.global.mapsOwnedArray[highestMap];
            statusMsg = "Prestige: " + getRemainingSpecials(game.global.world);
        }
        else if (siphonMap != -1) //use the siphonology adjusted map
            selectedMap = game.global.mapsOwnedArray[siphonMap];
    }
    
    /*
    3 cases based on where we are: 
    1) in a map - decide what to do with repeat button
    2) in the world - do we need to enter the map screen?
    3) in premap screen - create/select a map and run it, or go back to world*/
    
    //#1 in a map, figure out repeat button
    if (game.global.mapsActive) {
        if(currMap.location == "Void"){
            if(doVoids && !game.global.repeatMap)
                repeatClicked(); //enable repeat
            if(!doVoids && game.global.repeatMap)
                repeatClicked(); //disable repeat
            if(useScryhard2())
                goDefaultStance(4);
        }
        else if(selectedMap != currMap){ //if we are not where we want to be, then disable repeat
            if (game.global.repeatMap)
                repeatClicked();
        }
        else{
            if (!game.global.repeatMap) //start with repeat button on
                repeatClicked();

            var repeatChoice = 1; //0 - forever 1 - map bonus 2 - items 3 - any
            
            if(shouldDoMapsVanillaRepeat)
                repeatChoice = 0;
            
            var specials = addSpecials(true, true, currMap);
            if(specials > 0) //we still need prestige from our current map
                repeatChoice = 2;
            
            if((DHratio / ourBaseDamage * ourBaseDamagePlusOne) > threshhold)
                repeatChoice = 2; //psuedo 'repeat off' if we dont need more damage
            //DHratio = (ourBaseDamage*0.25 / enemyHealth);
            //enoughDamage = DHratio > threshhold;
            
            if(preSpireFarming)
                repeatChoice = 0;
            
            //turn off repeat maps if we doing Watch maps.
            if (shouldDoWatchMaps && game.global.repeatMap)
                repeatClicked();
            //turn off repeat if we're running a unique map that isnt BW
            else if (theMap.noRecycle && theMap.name != 'Bionic Wonderland')
                repeatClicked();
            
            
            if(specials > 0)            statusMsg = "Prestige: " + specials;
            else if(repeatChoice === 0) statusMsg = "Mapping at z" + game.global.world;
            else if(repeatChoice == 1)  statusMsg = "Map bonus ";
            while (game.options.menu.repeatUntil.enabled != repeatChoice) { //select the correct repeat until option
                toggleSetting('repeatUntil');
            }
        }
        return;
    }

    //#2 in the world
    else if (!game.global.preMapsActive && !game.global.mapsActive) { 
        if (selectedMap != "world") {
            //we want to run a map
            mapsClicked(true);
            //Get Impatient/Abandon if: (need prestige / _NEED_ to do void maps / on lead in odd world.) AND (a new army is ready, OR _need_ to void map OR lead farming and we're almost done with the zone) (handle shouldDoWatchMaps elsewhere below)
            //if (doVoids && !shouldDoWatchMaps && (needPrestige || doVoids || (game.global.challengeActive == 'Lead' && game.global.world % 2 == 1) || (!enoughDamage && game.global.lastClearedCell < 9)) &&
            //    ((game.resources.trimps.realMax() <= game.resources.trimps.owned + 1) || (game.global.challengeActive == 'Lead' && game.global.lastClearedCell > 93) || (doVoids && game.global.lastClearedCell > 93))){
            //        mapsClicked();
           // }
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
                if(needPrestige)
                    var flag = decideMapParams(lvl, lvl, "Prestigious", enoughDamage); //cheap or no cheap
                else if(preSpireFarming){
                    lvl = spiremaplvl;
                    var flag = decideMapParams(lvl, lvl, "LMC", false, 1);
                }
                else if(preferFAMaps)
                    var flag = decideMapParams(lvl, lvl, "FA", enoughDamage); //cheap or no cheap
                else
                    var flag = decideMapParams(lvl, lvl, "LMC", enoughDamage); //cheap or no cheap
                
                
                var flag2 = createAMap(lvl, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                if(!flag || !flag2){
                    debug("Can't afford map with parameters. level: " + lvl + " type: " + type, "maps");
                    debug("error in creating map process. Can't afford it? Running existing map instead.", "maps");
                    selectedMap = game.global.mapsOwnedArray[highestMap]; //revert to highest existing map
                }
                else{
                    selectedMap = game.global.mapsOwnedArray[game.global.mapsOwnedArray.length-1]; //the map we just created
                } 
            }
            selectMap(selectedMap.id);
            if(!spireMapBonusFarming && stackSpireGetMinDamage){ //equip low shield - enter map, go to premaps. enter map - manual fight - go to premaps - exit to world - manual fight
                debug("Lowering damage for Spire IV");
                var deltaGenes = getDeltaGenes(1);
                if(deltaGenes > 0){ //if we need to fire geneticists
                    switchOffGA(); //pause autogeneticist  
                    debug("Automaps: Trimpiciding " + game.global.antiStacks + "->1. Firing " + deltaGenes + " Geneticists. New Geneticists: " + (game.jobs.Geneticist.owned-deltaGenes));
                    fireGeneticists(deltaGenes);
                }
                
                runMap();                           //--enter map
                fightManual();                      //--fight
                mapsClicked(true);                  //--exit map
                
                var start = new Date().getTime();
                while(game.global.breedBack > 0){
                    var current = new Date().getTime();
                    if(current-start > 1000){
                        debug("error: took too long to breed back army. exiting.");
                        break;
                    }
                }
                runMap();                           //--enter map
                fightManual();                      //--fight
                switchOnGA();
                mapsClicked(true);                  //--exit map
                recycleMap();
                mapsClicked();                      //--exit to world
                fightManual();                      //--fight
                spireStackFirst = false;
                return;
            }
            else{
                if(typeof selectedMap === 'undefined'){
                    debug("maps: selectedMap === 'undefined' error. resuming.");
                    return;
                }
                var levelText = " Level: " + selectedMap.level;
                var voidorLevelText = selectedMap.location == "Void" ? " Void: " : levelText;
                var stanceText = "";
                if(selectedMap.location == "Void" && useScryhard2()){
                    goDefaultStance(4);
                    stanceText = " in S";
                }
                else {
                    goDefaultStance(2);
                    if (selectedMap.location == "Void")
                        stanceText = " not in S";
                }
                debug("Running selected " + selectedMap.id + voidorLevelText + " Name: " + selectedMap.name + stanceText, "maps", 'th-large');
                runMap();
                currMap = selectedMap;
            }
        }
    }
}

//update the UI with stuff from automaps.
function updateAutoMapsStatus(get, msg, final) {
    var minSp = getPageSetting('MinutestoFarmBeforeSpire');

    if (msg === "" || msg === undefined || msg.length === 0) 
        status = "";
    else
        status = msg+"<br>";

    if (preSpireFarming) {
        if(getPageSetting('MinutestoFarmBeforeSpire') < 0){ //farm for infinity
            var hours = Math.floor(spireTime / 60).toFixed(2);    
            var mins = Math.floor(spireTime - 60*hours).toFixed(0);
            var secs = Math.floor((spireTime - mins) * 60 % 60).toFixed(0)
        }
        else{
            var secs = Math.floor(60 - (spireTime * 60) % 60).toFixed(0)
            var mins = Math.floor(minSp - spireTime).toFixed(0);
            var hours = minSp - (spireTime / 60).toFixed(2);
        }
        var spiretimeStr = (spireTime >= 60) ?
            (hours + 'h') : (mins + 'm:' + (secs >= 10 ? secs : ('0' + secs)) + 's');
        if(getPageSetting('MinutestoFarmBeforeSpire') < 0){ //farm for infinity
            status += spiretimeStr + '<br>';
        }
        else{
            status += spiretimeStr + ' left<br>';
        }
    } else if (spireMapBonusFarming) status += 'Spire Bonus<br>';
    else if (doVoids) status += 'VMs Left: ' + game.global.totalVoidMaps + "<br>";
    else if (skippedPrestige) status += '<br><b style="font-size:.8em;color:pink;margin-top:0.2vw">Prestige Skipped</b><br>'; // Show skipping prestiges

    status = status + "Ratio = " + formattedRatio;

    //hider he/hr% status
    var getPercent = (game.stats.heliumHour.value() / (game.global.totalHeliumEarned - (game.global.heliumLeftover + game.resources.helium.owned))) * 100;
    var lifetime = (game.resources.helium.owned / (game.global.totalHeliumEarned - game.resources.helium.owned)) * 100;
    var hiderStatus = 'He/hr: ' + getPercent.toFixed(4) + '%<br>&nbsp;&nbsp;&nbsp;He: ' + lifetime.toFixed(3) + '%';

    if (get) {
        return statusMsg + ' ' + formattedRatio;
        //return [status, getPercent, lifetime];
    } 
    else if(final && !ATmakeUp){
        if(status != document.getElementById('autoMapStatus').innerHTML)
            document.getElementById('autoMapStatus').innerHTML = status;
        var b = 'Threshhold = ' + threshhold.toFixed(3) + '<br>' + hiderStatus;
        if(b != document.getElementById('hiderStatus').innerHTML)
            document.getElementById('hiderStatus').innerHTML = b;
    }
}

//returns true when done
function PrestigeRaid() {
    if(game.global.highestLevelCleared < 210){
        //debug("Prestige Raiding is unlocked until HZE 210.", "maps");
        return true;
    }
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
    
    if(!BWRaidNowLogic())
        if (StartZone == -1 || game.global.world < StartZone || PRaidMax <= 0 || getPageSetting('AutoMaps') == 0){
            if(!isActiveSpireAT() || !getPageSetting('PRaidSpire'))
                return true; 
        }
    
    var havePrestigeUpTo = lastPrestigeZone(); // check currently owned prestige levels
    findDesiredMapLevel(PRaidMax, PAggro, havePrestigeUpTo); //finds min and max levels we want to raid

    if(havePrestigeUpTo > maxDesiredLevel) //have all the prestige levels that we want.
        return true; 
    if(havePrestigeUpTo === maxDesiredLevel && prestigeState === 2) //have all
        return true; 
    if(havePrestigeUpTo === maxDesiredLevel && prestigeState === 1 && game.global.world % 100 != 0 && !BWRaidNowLogic()) //only missing last armor (we want the armor in spire and when BWRaiding)
        return true; 
    
    if (game.global.mapsActive){ //if we are in a map
        //do we need prestige from this map?
        var last = game.global.mapGridArray[game.global.mapGridArray.length - 1].special;
        if(last != "" && last != "Any" && last != "gems"){ //last cell is robotrimp or prestige item. addSpecials() is more cpu
            var map = currMap;
            if(currMap.location === "Bionic")
                statusMsg = "BW Raiding: "+ addSpecials(true, true, currMap);
            else{
                statusMsg = "Prestige Raid: " + getRemainingSpecials(maxDesiredLevel);
            }
            //if this is last run we need of the map, turn off repeat button
            var levelFromThisRun = Math.max(Math.floor(dropsAtZone(game.global.mapGridArray[game.global.mapGridArray.length-1].special, true)), Math.floor(dropsAtZone(game.global.mapGridArray[game.global.mapGridArray.length-2].special, true)))
            if (levelFromThisRun == currMap.level && game.global.repeatMap) 
                repeatClicked();
        }
        else{
            if (game.global.repeatMap) //make sure repeat button is turned off 
                repeatClicked();
            statusMsg = "Prestige Raid: " + getRemainingSpecials(maxDesiredLevel);
        }
        return false;
    }
    else {
        //debug("hi");
        }
    //this code prevents PrestigeRaid() from killing our army and going into map screen under certain conditions:    
    if (game.global.soldierHealth > 1000){//if we have an army currently fighting
        if(!game.global.mapsActive && !game.global.preMapsActive){ //and we are in the world screen
            if (game.resources.trimps.owned < game.resources.trimps.realMax()){ //and we dont have another army ready, then we may as well stay in the world until another army is ready. may not be true for some dailies
                if (getEmpowerment() == "Poison"){
                    if(game.global.world % 10 != 5 && game.global.world % 10 != 0){ //in poison zones xx0 and xx5, we are willing to sit and wait in the map screen to be sure not to miss our last poison zone
                        if(!doVoids)
                            return false; //we'll want to keep revisiting prestigeRaid until something changes
                        else //need to run void maps
                            return true;
                    }
                }
            }
        }
    }
    
    //first, lets create maps for each level between minDesiredLevel and maxDesiredLevel
    var map = false;
    for(var lvl = maxDesiredLevel; lvl >= minDesiredLevel; lvl--){
        if(lvl % 10 > 5 || lvl % 10 === 0)
            continue;
        map = findMap(lvl); //ignores uniques
        if(!map){ //if we don't have a map, create one using 80% of our available fragments
            if(decideMapParams(lvl, lvl, "Prestigious", true, 0.8)){ //this also sets the variables that createAMap uses
                if (!game.global.preMapsActive && !game.global.mapsActive) //in world, get to map screen
                    mapsClicked(true);
                var flag = createAMap(game.global.world, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                if (!flag){
                    debug("error in creating map process");
                    return true;
                }
            }
            else if (lvl == maxDesiredLevel){ //we really want ANY map of the highest level, even if its a bad one. if we cant buy it with 80% frag, try with 100%
                if(decideMapParams(lvl, lvl, "Prestigious", true)){
                    if (!game.global.preMapsActive && !game.global.mapsActive) //in world, get to map screen
                        mapsClicked(true);
                    var flag = createAMap(game.global.world, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect);
                    if (!flag){
                        debug("error in creating map process");
                        return true;
                    }
                }
            }    
        }
    }
    
    //Let's see if we already own a map of suitable level
    var map = false;
    for(var i = minDesiredLevel; i <= maxDesiredLevel; i++){
        map = findMap(i); //ignores uniques
        if(map)
            break;
    }
    
    if(!map)
        return true;

    selectMap(map.id);
    
    //debug("havePrestigeUpTo = " + havePrestigeUpTo + " | minDesiredLevel = " + minDesiredLevel + " | maxDesiredLevel = " + maxDesiredLevel);
    
    runMap();
    currMap = map;
    statusMsg = "Prestige Raid: " + addSpecials(true, true, currMap);

    if (!game.global.repeatMap) {
        repeatClicked();
    } 
    while (game.options.menu.repeatUntil.enabled != 2) {
        toggleSetting('repeatUntil'); //repeat for all items
    }
    
    return false;
}

function createAMap(baseLevel, type, extraLevels, specialMod, lootSlider, diffSlider, sizeSlider, perfect){
    if (!game.global.preMapsActive && !game.global.mapsActive)
        mapsClicked(true);
    
    while (game.options.menu.repeatUntil.enabled != 2)
        toggleSetting('repeatUntil'); //repeat for all items
                
    if (game.global.preMapsActive){ 
        document.getElementById("mapLevelInput").value = baseLevel;
        if (baseLevel != game.global.world)
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
            var perfectText = (perfect ? "Perfect" : "");
            var specialModText = (specialMod ? specialMod : "vanilla");
            var typeText = (type == "Plentiful" ? "Garden" : type);
            debug("Level = "+(baseLevel+extraLevels)+"|"+parseFloat(lootSlider)+"|"+parseFloat(sizeSlider)+"|"+parseFloat(diffSlider)+"|"+specialModText+"|"+perfectText+"|"+typeText+" cost: " + cost.toPrecision(3) + " / " + game.resources.fragments.owned.toPrecision(3) + " fragments.", "maps");
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
            debug("Expected map level " + (game.global.world+extraLevels) + " is " + cost + " and we have " + fragments + " frags.");
            return false;
        }
    }
    else
        debug("error: not in premap screen");
    return false;
}

//searches for a map of at least minimum level
function findMap(level){
    var map1 = false;
    var map2 = false;
    for (var map in game.global.mapsOwnedArray)
        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == level){
            map1 = game.global.mapsOwnedArray[map];
            break;
        }
    
    //prestigeState: 0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    if(!map1 || addSpecials(true, true, map1) > 1) //if no map of level - nothing to run. if it has multiple items in it, run it
        return map1;
    
    //map has 1 item remaining. we can either run it, or run a prestigious map of 1 level higher
    for (var map in game.global.mapsOwnedArray)
        if (!game.global.mapsOwnedArray[map].noRecycle && game.global.mapsOwnedArray[map].level == level+1 && game.global.mapsOwnedArray[map].bonus == "p"){
            map2 = game.global.mapsOwnedArray[map];
            break;
        }
    if(map2)
        return map2;
    return map1;
}

function decideMapParams(minLevel, maxLevel, special, cheap, fragCap){
    var fragments = game.resources.fragments.owned * (fragCap === undefined ? 1 : fragCap);
    var baseLevel = game.global.world;
    var sizeLast=0, diffLast=0, lootLast=0, specialModLast="", perfectLast=false, extraLevelsLast=minLevel-baseLevel, typeLast="Random";
    
    var mostExpensiveType;
    if (cheap)
        mostExpensiveType = "Random";
    else{
        if(customVars.preferGardens && game.global.decayDone)
            mostExpensiveType = "Plentiful";
        else
            mostExpensiveType = "Mountain";
    }
    
    if(maxLevel < minLevel) maxLevel = minLevel;
    if(minLevel > maxLevel) minLevel = maxLevel;    
    
    cost = calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast);
    if(cost > fragments){
        debug("can't afford map level " + minLevel + " " + cost.toExponential(2));
        return false;
    }

    var fragments = game.resources.fragments.owned * (fragCap === undefined ? 1 : fragCap);
    if(special == "LMC")
        specialModLast = "LMC";
    
    //order of importance for prestigious maps (prestige mode):
    //size > prestigious > difficulty > perfect
    //order of importance for LMC maps (map bonus/metal):
    //LMC (must have) > size  > difficulty > loot > perfect > Garden
    
    //iterate over all values in order of priority to find the best map we can afford.
    //at all times the 'Last' variables hold affordable configuration.
    
    while(true){
        for(lootEnum = 0; lootEnum <= 9; lootEnum++){
            if(calcMapCost(baseLevel, sizeLast, diffLast, lootEnum, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                lootLast = lootEnum;
            else
                break;            
            
            for(diffEnum = 0; diffEnum <= 9; diffEnum++){
                if(calcMapCost(baseLevel, sizeLast, diffEnum, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                    diffLast = diffEnum;
                else
                    break;

                if(special != "LMC"){ //LMC never skip. prestigious maybe skip
                    if(calcMapCost(baseLevel, sizeLast, diffLast, lootLast, special, perfectLast, extraLevelsLast, typeLast) < fragments){
                         specialModLast = special;
                    }
                    else
                        specialModLast = "";
                }

                for(sizeEnum = 0; sizeEnum <= 9; sizeEnum++){
                    if(calcMapCost(baseLevel, sizeEnum, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
                        sizeLast = sizeEnum;
                    else
                        break;
                }
            }
        }
        
        if(sizeLast+diffLast+lootLast < 27)
            perfectLast=false;
        else{
            if(calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, true, extraLevelsLast, typeLast) < fragments)
                perfectLast = true;
            else
                perfectLast = false;
        }
        
        if(2 * calcMapCost(baseLevel, sizeLast, diffLast, lootLast, specialModLast, perfectLast, extraLevelsLast, typeLast) < fragments)
            typeLast = mostExpensiveType;
        else
            typeLast = "Random";
        
        sizeSlider = sizeLast;
        diffSlider = diffLast;
        lootSlider = lootLast;
        specialMod = specialModLast;
        extraLevels = extraLevelsLast;
        perfect = perfectLast;
        type = typeLast;
        
        if(extraLevelsLast+1 > maxLevel-baseLevel)
            break;
        
        if(specialModLast == "LMC"){
            if(calcMapCost(baseLevel, 0, 0, 0, "LMC", false, extraLevelsLast+1, "Random") < fragments){
                sizeLast=0; diffLast=0; lootLast=0; specialModLast="LMC"; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
            }
            else
                break;
        }
        else if(calcMapCost(baseLevel, 0, 0, 0, specialModLast, false, extraLevelsLast+1, "Random") < fragments){
             sizeLast=0; diffLast=0; lootLast=0; perfectLast=false; extraLevelsLast=extraLevelsLast+1, typeLast="Random";
        }
        else
            break;
    
    }
    
    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
    
    if(cheap && cost > fragments * 0.01){
        lootSlider = 0;
        perfect = false;
        type = "Random";
    }
    
    cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
    
    if(fragments >= cost)
        return true;
    else //something went wrong, revert to base
    {
        debug("decideMapParams error - cant afford map");
        specialMod = "";
        cost = calcMapCost(baseLevel, sizeSlider, diffSlider, lootSlider, specialMod, perfect, extraLevels, type);
        if(fragments >= cost)
            return true;
        else
            return false;
    }
}

function findDesiredMapLevel(PRaidMax, PAggro, havePrestigeUpTo){
    var empowerment = getEmpowerment();
    var lastDigitZone = game.global.world % 10;
    
    //are we in an active spire? if so we always want +5 map levels
    if(game.global.world % 100 == 0 && game.global.world >= getPageSetting('IgnoreSpiresUntil')){
        //debug("active spire mode");
        maxDesiredLevel = game.global.world + 5;
        minDesiredLevel = game.global.world + 1;
    }
    //there are 7 cases: poison/wind/ice (each 2 cases depending on zones xx1-xx5 or xx6-x10), and 7th case for no empowerment before zone 236.
    else if (empowerment == "Ice"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5 here aggressive is same as light because poison zones are coming up
            maxDesiredLevel = game.global.world - lastDigitZone + 5; 
            minDesiredLevel = game.global.world - lastDigitZone + 1; 
        }
        else if (lastDigitZone > 5){ //xx6-xx9
            if(PAggro == 0){
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
            else{ //PAggro == 1
                maxDesiredLevel = game.global.world - lastDigitZone + 13;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
        else { //xx0
            if(PAggro == 0){
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
            else{
                maxDesiredLevel = game.global.world + 3;
                minDesiredLevel = game.global.world + 1;
            }
        }
    }
    else if (empowerment == "Poison"){
        if(PAggro == 0){ //low aggro poison is fairly straightforward; get to last poison zone and farm 5 or 6 zones higher
            if(lastDigitZone == 0){
                maxDesiredLevel = game.global.world + 5;
                minDesiredLevel = game.global.world + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = game.global.world + 6;
                minDesiredLevel = game.global.world + 6;
            }
            else{
                maxDesiredLevel = game.global.world - lastDigitZone + 5;
                minDesiredLevel = game.global.world - lastDigitZone + 5;
            }
        }
        else {//PAggro == 1
            if(lastDigitZone == 0){
                maxDesiredLevel = game.global.world + 5; //most available
                minDesiredLevel = game.global.world + 1;
            }
            else if(lastDigitZone == 5){
                maxDesiredLevel = game.global.world + 10; //most available
                minDesiredLevel = game.global.world + 6;
            }
            else if(lastDigitZone < 5){
                maxDesiredLevel = game.global.world - lastDigitZone + 5;
                minDesiredLevel = game.global.world + 1; //+1 level is still fine, just dont get xx6
            }
            else{ //xx6-xx9 special case, we want to run xx1 then xx2 then xx3 for faster clear
                maxDesiredLevel = game.global.world - lastDigitZone + 15;
                if(maxDesiredLevel > game.global.world + 7)
                    maxDesiredLevel = game.global.world+7;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
    }
    else if (empowerment == "Wind"){
        if(lastDigitZone <= 5 && lastDigitZone > 0){ //xx1-xx5, fairly conservative because ice is coming up
            maxDesiredLevel = game.global.world - lastDigitZone + 5;
            minDesiredLevel = game.global.world - lastDigitZone + 1;
        }
        else if (lastDigitZone == 0){
            if(PAggro == 0){
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
            else{
                maxDesiredLevel = game.global.world + 1;
                minDesiredLevel = game.global.world + 1;
            }
        }
        else{ //xx6-xx9
            if(PAggro == 0){ 
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
            else {
                maxDesiredLevel = game.global.world - lastDigitZone + 11;
                minDesiredLevel = game.global.world - lastDigitZone + 11;
            }
        }
    }
    else{ //no empowerment, pre 236
        if (lastDigitZone <= 5){
            maxDesiredLevel = game.global.world - lastDigitZone + 5;
            minDesiredLevel = game.global.world + 1;
        }
        else if(lastDigitZone == 9){
            maxDesiredLevel = game.global.world - lastDigitZone + 15;
            minDesiredLevel = game.global.world - lastDigitZone + 11;
        }
        else{
            maxDesiredLevel = game.global.world;
            minDesiredLevel = game.global.world;
        }
    }
    
    if (maxDesiredLevel > game.global.world + PRaidMax)
        maxDesiredLevel = game.global.world + PRaidMax; //dont go above user defined max
    if(maxDesiredLevel % 10 == 0) //bring 540 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - 5;
    else if (maxDesiredLevel % 10 > 5) //bring 536 down to 535 etc
        maxDesiredLevel = maxDesiredLevel - maxDesiredLevel % 10 + 5;
    if(lastDigitZone <= 5 && minDesiredLevel < game.global.world) //always want to keep prestige at least upto current zone
        minDesiredLevel = game.global.world;
    
    //prestigeState: 0 - have something from zone (zone xx5 and we have greatsword and possibly breastplate) 1 - have all but last armor 2 - have everything from zone
    if(prestigeState === 2){
        if(minDesiredLevel < havePrestigeUpTo + 1)
            minDesiredLevel = havePrestigeUpTo + 1;    
    }
    else{
        if(minDesiredLevel < havePrestigeUpTo)
            minDesiredLevel = havePrestigeUpTo;
    }
    
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

function updateMapCost(getValue){
	var mapLevel =  parseInt(document.getElementById("mapLevelInput").value, 10);
	var baseCost = 0;
	baseCost += getMapSliderValue("size");
	baseCost += getMapSliderValue("loot");
	baseCost += getMapSliderValue("difficulty");
	baseCost *= (game.global.world >= 60) ? 0.74 : 1;
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

function lastDropZone(zone) {
    lastPrestigeZone(); //sets prestigeState which indicates how many drops we already have of possible drops in our last prestige zone
    var lastPrestigeZ;
    if (zone == null)
        zone = game.global.world;
    if (zone % 10 > 5)
        lastPrestigeZ = zone - (zone % 10) + 5;
    else if (zone % 10 == 0)
        lastPrestigeZ = zone-5;
    else
        lastPrestigeZ = zone;
    
    return lastPrestigeZ;
}

function checkNeedToVoid(){
    //FIND VOID MAPS LEVEL:
    var voidMapLevelSetting = getPageSetting('VoidMaps');
    //Add your daily zone mod onto the void maps level
    var dailyVoidMod = getPageSetting('VoidMapsDailyMod');
    if (dailyVoidMod == 999){
        dailyVoidMod = getPageSetting('AutoFinishDailyNew');
        if(dailyVoidMod == 999)
            dailyVoidMod = 0;
    }
    if (game.global.challengeActive == "Daily")
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
            (game.global.world >= voidMapLevelSettingZone && voidsuntil != 0 && (voidsuntil == -1 || game.global.world <= (voidsuntil + voidMapLevelSettingZone))));
    if (game.global.totalVoidMaps == 0)
        doVoids = false;
    return doVoids;
}

function findFirstVoidMap(){
    for (var map in game.global.mapsOwnedArray){
        if(game.global.mapsOwnedArray[map].location === "Void")
            return game.global.mapsOwnedArray[map];
    }
    return false;
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

        //only go into the voidmap if we need to.
        return theMap;
    }
    return null;

}

function windZone(value){
    if(value !== undefined && value > 0)
        return (value-241) % 15 <= 4 && value > 240;
    else
        return (game.global.world-241) % 15 <= 4 && game.global.world > 240;
}

function poisonZone(){
    return ((game.global.world-236) % 15 <= 4);
}

function getRemainingSpecials(maxZone){
    if (typeof maxZone === 'undefined' || maxZone < 6)
        return -1;
    
    var highestMap = null;
    for (var mapIterator of game.global.mapsOwnedArray){
        if(mapIterator.noRecycle || mapIterator.level > maxZone)
            continue;
        if(highestMap == null)
            highestMap = mapIterator;
        else if(mapIterator.level > highestMap.level)
            highestMap = mapIterator;
    }
    if(highestMap == null)
        return 0;
    else
        return addSpecials(true, true, highestMap);
}

function useScryhard2(){
    return game.talents.scry2.purchased && !game.global.runningChallengeSquared;
}