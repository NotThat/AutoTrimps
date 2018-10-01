//Create blank AutoPerks object
var AutoPerks = {};

var presetList = [];
function presetObj(header, Helium, Attack, Health, Fluffy, DG) {
    var preset = {header:header, Helium:Helium, Attack:Attack, Health:Health, Fluffy:Fluffy, DG:DG};
    presetList.push(preset);
    return preset;
}

presetObj("a1",             1,    1,  1,    1,   1);
presetObj("a2",             1,    1,  1,    1,   1);
presetObj("--------------", 1,    1,  1,    1,   1);

var preset_Custom = JSON.parse(localStorage.getItem('AutoPerksCustomRatios'));
var secondLine    = JSON.parse(localStorage.getItem('AutoPerksSecondLine'));
if(Array.isArray(preset_Custom) || preset_Custom == null){
    preset_Custom = presetObj("Custom", 1, 1, 1, 1, 1);
    safeSetItems('AutoPerksCustomRatios', JSON.stringify(preset_Custom) );
}
else presetList.push(preset_Custom);

//Custom Creation for all perk customRatio boxes in Trimps Perk Window
AutoPerks.createInput = function(perkname,div, isCheckBox) {
    var perk1input = document.createElement("Input");
    if(isCheckBox) perk1input.setAttribute("type", "checkbox");
    perk1input.id = perkname + (isCheckBox ? '' : 'Ratio');
    perk1input.perkname = perkname;
    //if(isCheckBox)
    //    var oldstyle = 'text-align: center; width: calc(100vw/36); font-size: 1.0vw; ';
    //else
        var oldstyle = 'text-align: center; width: calc(100vw/25); font-size: 1.0vw; ';
    if(game.options.menu.darkTheme.enabled != 2) perk1input.setAttribute("style", oldstyle + " color: black;");
    else perk1input.setAttribute('style', oldstyle);
    perk1input.setAttribute('class', 'perkRatios');
    perk1input.setAttribute('onchange', 'AutoPerks.switchAndSaveCustomRatio(this.perkname, this.value)');
    var perk1label = document.createElement("Label");
    perk1label.id = perkname + 'Label';
    perk1label.innerHTML = perkname;
    perk1label.setAttribute('style', 'margin-right: 0.7vw; width: calc(100vw/18); color: white; font-size: 0.9vw; font-weight: lighter; margin-left: 0.3vw; ');
    //add to the div.
    div.appendChild(perk1input);
    div.appendChild(perk1label);
    return perk1input;
};

AutoPerks.GUI = {};
AutoPerks.initializeGUI = function() {
    let apGUI = AutoPerks.GUI;
    //Create Allocator button and add it to Trimps Perk Window
    var $buttonbar = document.getElementById("portalBtnContainer");
    apGUI.$allocatorBtn1 = document.createElement("DIV");
    apGUI.$allocatorBtn1.id = 'allocatorBtn1';
    apGUI.$allocatorBtn1.setAttribute('class', 'btn inPortalBtn settingsBtn settingBtntrue');
    apGUI.$allocatorBtn1.setAttribute('onclick', 'AutoPerks.clickAllocate()');
    apGUI.$allocatorBtn1.setAttribute('style', 'color: #ffffff;');
    apGUI.$allocatorBtn1.textContent = 'Allocate Perks';
    $buttonbar.appendChild(apGUI.$allocatorBtn1);
    $buttonbar.setAttribute('style', 'margin-bottom: 0.8vw;');
    apGUI.$customRatios = document.createElement("DIV");
    apGUI.$customRatios.id = 'customRatios';
    //Line 1 of the UI
    apGUI.$ratiosLine1 = document.createElement("DIV");
    apGUI.$ratiosLine1.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    var listratiosLine1 = ["Helium","Attack","Health","Fluffy","DG"];
    for (var i in listratiosLine1)
        AutoPerks.createInput(listratiosLine1[i],apGUI.$ratiosLine1);

    apGUI.$customRatios.appendChild(apGUI.$ratiosLine1);
    //Line 2 of the UI
    apGUI.$ratiosLine2 = document.createElement("DIV");
    apGUI.$ratiosLine2.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    var listratiosLine2 = ["Portal Zone","amalGoal","amalZone","coordsBehind"];
    for (i in listratiosLine2)
        var input = AutoPerks.createInput(listratiosLine2[i],apGUI.$ratiosLine2);
    
    //check boxes line
    apGUI.$checkBoxesLine3 = document.createElement("DIV");
    apGUI.$checkBoxesLine3.setAttribute('style', 'display: inline-block; text-align: left; width: 100%');
    var checkBoxMaxFuel = AutoPerks.createInput("MaxFuel", apGUI.$checkBoxesLine3, true);
    checkBoxMaxFuel.setAttribute("onmouseover", 'tooltip("Max Fuel", "customText", event, "Force use max fuel, even after Amalgamator goal has been reached.")');
    var checkBoxRespecAfterAmal = AutoPerks.createInput("RespecAfterAmal", apGUI.$checkBoxesLine3, true);
    checkBoxRespecAfterAmal.setAttribute("onmouseover", 'tooltip("Respec After Reaching Amalgamator Goal", "customText", event, "After reaching Amalgamator goal, will respec to maintain amalgamators by Portal Zone.")');
    var checkBoxMaintainMode = AutoPerks.createInput("MaintainMode", apGUI.$checkBoxesLine3, true);
    checkBoxMaintainMode.setAttribute("onmouseover", 'tooltip("Maintain Amalgamator only", "customText", event, "Check this box if you in the middle of a run and already have Amalgamator Goal and wish to respec to minimum Carp1 / 2 / Coordinated to maintain it until Portal Zone. Assumes fueling until the end of the run.")');
    var checkBoxSaveSettings = AutoPerks.createInput("SaveATSettings", apGUI.$checkBoxesLine3, true);
    checkBoxSaveSettings.setAttribute("onmouseover", 'tooltip("Save Run Settings to AT", "customText", event, "Will save Fuel Start / Fuel End / Disables Fuel until Amalgamator / Start no Buy Coords / Amalgamator Goal to AT settings. Only occurs when the confirm button is pressed.")');
    var checkBoxArr = [checkBoxMaxFuel, checkBoxRespecAfterAmal, checkBoxMaintainMode, checkBoxSaveSettings];
    for (i in checkBoxArr){
        checkBoxArr[i].setAttribute("onmouseout", 'tooltip("hide")');
    }
    checkBoxArr[1].disabled = true;
    //checkBoxArr[2].disabled = true;
    
    //create text allocate area
    apGUI.$textArea = document.createElement("DIV");
    apGUI.$textArea.setAttribute('style', 'display: inline-block; text-align: left; width: 100%; background-color: #ffffff; font-size: 15px; color: #000000'); //black on white background                       ";
    apGUI.$textArea.id ='textAreaAllocate';
    //Create ratioPreset dropdown
    apGUI.$ratioPresetLabel = document.createElement("Label");
    apGUI.$ratioPresetLabel.id = 'Ratio Preset Label';
    apGUI.$ratioPresetLabel.innerHTML = "Ratio Preset:";
    apGUI.$ratioPresetLabel.setAttribute('style', 'margin-right: 0.5vw; color: white; font-size: 0.9vw;');
    apGUI.$ratioPreset = document.createElement("select");
    apGUI.$ratioPreset.id = 'ratioPreset';
    apGUI.$ratioPreset.setAttribute('onchange', 'AutoPerks.updateFromBoxes()');
    var oldstyle = 'text-align: center; width: 8vw; font-size: 0.8vw; font-weight: lighter; ';
    if(game.options.menu.darkTheme.enabled != 2) apGUI.$ratioPreset.setAttribute("style", oldstyle + " color: black;");
    else apGUI.$ratioPreset.setAttribute('style', oldstyle);
    //Populate ratio preset dropdown list from HTML above:
    //Ratio preset dropdown list
    var presetListHtml = "";
    for (i = 0; i < presetList.length; i++)
        presetListHtml += '<option>'+presetList[i].header+'</option>';
    presetListHtml += '</select>';
    apGUI.$ratioPreset.innerHTML = presetListHtml;

    //Add the presets dropdown to UI Line 1
    apGUI.$ratiosLine1.appendChild(apGUI.$ratioPresetLabel);
    apGUI.$ratiosLine1.appendChild(apGUI.$ratioPreset);
    apGUI.$customRatios.appendChild(apGUI.$ratiosLine2);
    apGUI.$customRatios.appendChild(apGUI.$checkBoxesLine3);
    apGUI.$customRatios.appendChild(apGUI.$textArea);

    //Add it all to the perk/portal screen
    var $portalWrapper = document.getElementById("portalWrapper");
    $portalWrapper.appendChild(apGUI.$customRatios);
};

//loads saved preset ID from memory, selects it, and updates all the boxes to fit
AutoPerks.initializeRatioPreset = function() {
    var $rp = document.getElementById("ratioPreset");
    var savedID = JSON.parse(localStorage.getItem('AutoperkSelectedRatioPresetID'));
    if(typeof savedID === 'undefined' || savedID > presetList.length-1)
        savedID = 0;
    $rp.selectedIndex = savedID;
    
    var chosenPreset = presetList[savedID];
    var perkname;
    var $perkRatioBoxes = document.getElementsByClassName("perkRatios");
    for(var i = 0; i < $perkRatioBoxes.length; i++) {
        perkname = $perkRatioBoxes[i].perkname;
        if(typeof chosenPreset !== 'undefined' && chosenPreset.hasOwnProperty(perkname))
            $perkRatioBoxes[i].value = chosenPreset.perkname;
        else
            $perkRatioBoxes[i].value = "";
    }
};

//a perk box value was changed
AutoPerks.switchAndSaveCustomRatio = function(perkname, value) {
    //select the custom preset if it isnt already
    var $rp = document.getElementById("ratioPreset");
    if ($rp.selectedIndex != $rp.length-1)
        ($rp.selectedIndex = $rp.length-1);
    
    //update custom preset with new value and save to localstorage
    preset_Custom[perkname] = parseFloat(value);
    
    AutoPerks.updatePerkRatios(); //updates perk ratios from boxes into the data structures
        
    saveSecondLine();
    
    safeSetItems('AutoperkSelectedRatioPresetID', $rp.selectedIndex);
    safeSetItems('AutoperkSelectedRatioPresetName', $rp.selectedOptions[0].id);
    safeSetItems('AutoPerksCustomRatios', JSON.stringify(preset_Custom));   
    safeSetItems('AutoPerksSecondLine',   JSON.stringify(secondLine));
};

//sets the ratioboxes with the default ratios embedded in the script when perks are instanciated.
// (and everytime the ratio-preset dropdown-selector is changed)
//loads custom ratio selections from localstorage if applicable
AutoPerks.updateFromBoxes = function() {
    var $perkRatioBoxes = document.getElementsByClassName("perkRatios");
    var $rp = document.getElementById("ratioPreset");
    if (!$rp || !$perkRatioBoxes || !$rp.selectedOptions[0]) return;
    var ratioSet = $rp.selectedIndex;
    var presetObj = presetList[ratioSet];
    var perkname;
    //set ratio boxes values from currently selected preset
    for(var i = 0; i < 5; i++) {
        perkname = $perkRatioBoxes[i].perkname;
        if(presetObj.hasOwnProperty(perkname))
            $perkRatioBoxes[i].value = presetObj[perkname];
    }
    
    $perkRatioBoxes[5].value = (secondLine != null && typeof secondLine[0] !== 'undefined') ? secondLine[0] : 560;
    $perkRatioBoxes[6].value = (secondLine != null && typeof secondLine[1] !== 'undefined') ? secondLine[1] : 6;
    $perkRatioBoxes[7].value = (secondLine != null && typeof secondLine[2] !== 'undefined') ? secondLine[2] : 420;
    $perkRatioBoxes[8].value = (secondLine != null && typeof secondLine[3] !== 'undefined') ? secondLine[3] : 105;
    
    //check boxes
    $perkRatioBoxes[9].checked  = (secondLine != null && typeof secondLine[4] !== 'undefined') ? secondLine[4] : false;
    $perkRatioBoxes[10].checked = (secondLine != null && typeof secondLine[5] !== 'undefined') ? secondLine[5] : false;
    $perkRatioBoxes[11].checked = (secondLine != null && typeof secondLine[6] !== 'undefined') ? secondLine[6] : false;
    $perkRatioBoxes[12].checked = (secondLine != null && typeof secondLine[7] !== 'undefined') ? secondLine[7] : false;
    

    
    AutoPerks.updatePerkRatios(); //updates perk ratios from boxes into the data structures
 
    //save the last ratio used to localstorage
    safeSetItems('AutoperkSelectedRatioPresetID', ratioSet);
    safeSetItems('AutoperkSelectedRatioPresetName', $rp.selectedOptions[0].id);
};

//updates the internal perk variables with values grabbed from the custom ratio input boxes that the user may have changed.
AutoPerks.updatePerkRatios = function() {
    var $perkRatioBoxes = document.getElementsByClassName('perkRatios');
    //for(var i = 0; i < $perkRatioBoxes.length; i++) {
    for(var i = 0; i < 5; i++) {
        //currentPerk = AutoPerks.perksByName[$perkRatioBoxes[i].id.substring(0, $perkRatioBoxes[i].id.length - 5)]; // Remove "ratio" from the id to obtain the perk name
        var newWeight = parseFloat($perkRatioBoxes[i].value);
        AutoPerks.benefitHolder[i].weightUser = Math.max(0, newWeight);
    }
    AutoPerks.maxZone       = parseFloat($perkRatioBoxes[5].value);
    AutoPerks.amalGoal      = parseFloat($perkRatioBoxes[6].value);
    AutoPerks.amalZone      = parseFloat($perkRatioBoxes[7].value);
    AutoPerks.coordsBehind  = parseFloat($perkRatioBoxes[8].value);
    
    AutoPerks.userMaxFuel           = $perkRatioBoxes[9].checked;
    AutoPerks.userRespecAfterAmal   = $perkRatioBoxes[10].checked;
    AutoPerks.userMaintainMode      = $perkRatioBoxes[11].checked;
    AutoPerks.userSaveATSettings    = $perkRatioBoxes[12].checked;
};

AutoPerks.resetPerks = function(){
    for (var i in AutoPerks.perkHolder){
        AutoPerks.perkHolder[i].level = 0;
        AutoPerks.perkHolder[i].spent = 0;
    }
};

AutoPerks.resetBenefits = function(){
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++){
        AutoPerks.benefitHolder[i].benefit     = 1;
        AutoPerks.benefitHolder[i].benefitBak  = AutoPerks.benefitHolder[i].benefit;
    }
};

//Calculate price of buying *next* level
AutoPerks.calculatePrice = function(perk, level) { 
    if(perk.priceLinearScaling == 'linear') return perk.baseCost + perk.increase * level;
    
    //exponential type calculation is an approximation, however it is what the game uses for price, and therefore the calculation we use
    else if(perk.priceLinearScaling == 'exponential') return Math.ceil(level/2 + perk.baseCost * Math.pow(1.3, level));
};

//Calculate Total Price
AutoPerks.calculateTotalPrice = function(perk, finalLevel) {
    if(perk.priceLinearScaling == 'linear') return AutoPerks.calculateTIIprice(perk, finalLevel);
    
    var totalPrice = 0;
    for(var i = 0; i < finalLevel; i++) {
        totalPrice += AutoPerks.calculatePrice(perk, i);
    }
    return totalPrice;
};

//Calculate Tier 2 Total Price - based on Trimps getAdditivePrice()
AutoPerks.calculateTIIprice = function(perk, finalLevel) {
    return (finalLevel - 1) * finalLevel / 2 * perk.increase + perk.baseCost * finalLevel;
};

//Fluffy is special
AutoPerks.calculateFluffyTotalPrice = function(perk, level){
    var price = 0;
    for (var i = 1; i <= level; i++)
        price += perk.baseCost * Math.pow(10, i-1);
    return price;
};

AutoPerks.calculateBenefit = function(perk, level) {
    if(perk.benefitType) return perk.value * perk.baseIncrease * perk.userWeight;
    else if (perk.priceLinearScaling === "exponential") return perk.value * perk.userWeight;
    else { //linear
        var increase = (1 + (level + 1) * perk.baseIncrease) / ( 1 + level * perk.baseIncrease) - 1; //absolute increase. if carp2 gives 0.25% at level 1, this will be 0.125% at level 400
        //return increase / perk.baseIncrease * perk.userWeight; //if we divide increase by perk.baseIncrease, we get the relative worth of current level compared to level 1 instead of absolute worth. in the above example this will be 0.5
        return perk.value * increase * perk.userWeight;
    }
};

//calcs helium like the game does
AutoPerks.getHelium = function() {
    //determines if we are in the portal screen or the perk screen.
    var respecMax = (game.global.viewingUpgrades) ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
    //var respecMax = (!usePortal) ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
    //iterates all the perks and gathers up their heliumSpent counts.
    for (var item in game.portal){
        if (game.portal[item].locked) continue;
        var portUpgrade = game.portal[item];
        if (typeof portUpgrade.level === 'undefined') continue;
        respecMax += portUpgrade.heliumSpent;
    }
    return respecMax;
};

AutoPerks.updateDailyMods = function(){
    AutoPerks.dailyObj = null;
    if(portalWindowOpen) //we are respecting to enter a new portal
        AutoPerks.dailyObj = getDailyChallenge(readingDaily, true, false);
    else if(game.global.challengeActive == "Daily")//get current run challenge/daily
        AutoPerks.dailyObj = game.global.dailyChallenge;
    
    
    AutoPerks.DailyHousingMult = 1;
    AutoPerks.DailyBadHealthMult = 1;
    //AutoPerks.
    if(AutoPerks.dailyObj != null){
        if(AutoPerks.dailyObj.hasOwnProperty("large"))
            AutoPerks.DailyHousingMult = (100 - AutoPerks.dailyObj.large.strength) / 100;
        if(AutoPerks.dailyObj.hasOwnProperty("badHealth"))
            AutoPerks.DailyHousingMult = (100 + 20*AutoPerks.dailyObj.badHealth.strength) / 100;
    }
}

//green "Allocate Perks" button:
AutoPerks.clickAllocate = function() {
    if(!game.global.canRespecPerks){
        var $text = document.getElementById("textAreaAllocate");
        var msg = "A respec is needed to Auto Allocate. Portal or use a Bone Portal to get a respec.";
        debug(msg);
        $text.innerHTML = msg;
        return;
    }
    AutoPerks.totalHelium = AutoPerks.getHelium(); //differs whether we're in the portal screen or mid run respec
    AutoPerks.gearLevels  = 1;
    AutoPerks.breedMult   = 1;
    AutoPerks.gearLevels  = 0;
    AutoPerks.compoundingImp = Math.pow(1.003, AutoPerks.maxZone * 3 - 1);
    AutoPerks.windMod = 1 + 13 * game.empowerments.Wind.getModifier() * 10; //13 minimum stacks
    
    AutoPerks.sharpBonusMult = 1; //TODO: checkbox this
    AutoPerks.battleGUMult = 1; //TODO: checkbox this
    //AutoPerks.sharpBonusMult = 1.5; //TODO: checkbox this
    //AutoPerks.battleGUMult = 19.89; //TODO: checkbox this
    
    /* benefitStat captures how much of a stat we have, and what the change will be from increasing a perk.
     * increasing a weight by a factor of 2 means we are willing to spend twice as much helium for the same increase.
     * finally, perk.efficiency equals perk.calculateBenefit() / perk.cost
     */
    
    AutoPerks.updateDailyMods(); // current (or selected) challenge modifiers
    AutoPerks.resetPerks();      // set all perks to level 0
    AutoPerks.resetBenefits();   // benefit and benefitBak = 1;
    AutoPerks.initializeAmalg(); // calculates amalgamator related variables. also pumps carp1/2/coord. doing this every allocate instead of 
                                 // on firstRun() because DG stats and helium mightve changed
    //calculates attack / health of non tough cell 50 corrupted enemy at AutoPerks.maxZone
    AutoPerks.zoneHealth = approxZoneHP(AutoPerks.maxZone); //this is health approx of the entire zone
    AutoPerks.enemyDamage = calcEnemyAttack("Corruption", "corruptDbl", corruptHealthyStatScaleAT(3, AutoPerks.maxZone), 'Snimp', 50, 1);

    var helium = AutoPerks.totalHelium;

    // Get fixed perks
    var preSpentHe = 0;
    var perks = AutoPerks.perkHolder;
    //var fixedPerks = AutoPerks.perkHolder; //test
    for (i in perks) {
        if(perks[i].isLocked || !perks[i].isFixed)
            continue;
        //Maintain your existing fixed perks levels.
        perks[i].level = game.portal[perks[i].name].level;
        perks[i].spent = perks[i].getTotalPrice(perks[i].level);
        preSpentHe += perks[i].spent;
    }

    if (preSpentHe)
        debug("AutoPerks: Your existing fixed-perks reserve Helium: " + prettify(preSpentHe), "perks");

    preSpentHe = 0;
    for (var i in AutoPerks.perkHolder){
        preSpentHe += AutoPerks.perkHolder[i].spent;
    }
    //if one of these is NaN, bugs.
    var remainingHelium = helium - preSpentHe;
   //Check for NaN - if one of these is NaN, bugs.
    if (Number.isNaN(remainingHelium))
        debug("AutoPerks: Major Error: Reading your Helium amount. " + remainingHelium, "perks");    

    // determine how to spend helium
    var result = AutoPerks.spendHelium(remainingHelium);
    if (result == false) {
        debug("AutoPerks: Major Error: Make sure all ratios are set properly.","perks");
        return;
    }

    var missing = -AutoPerks.applyCalculations(true);
    if(missing >= 0){ //theres some issues with large helium number inaccuracies. if missing is 0, remove 1 level just in case
        if(missing > 0) debug("missing " + missing + " helium. attempting to correct");
        //try removing 1 from T2 perk
        var lowest = Number.MAX_VALUE;
        var perk;
        var perksAdditive = AutoPerks.additivePerks;
        for (i = 0; i < perksAdditive.length; i++){
            if(perksAdditive[i].level > 0){
                var lastCost = perksAdditive[i].baseCost + perksAdditive[i].increase * (perksAdditive[i].level-1);
                if (lastCost > missing && lastCost < lowest){
                    lowest = lastCost;
                    perk = perksAdditive[i];
                }
            }
        }
        if(lowest < Number.MAX_VALUE && lowest > missing){
            if(missing > 0) debug("removing 1 level from " + perk.name + " worth " + lowest + " helium");
            remainingHelium += lowest;
            perk.spent -= lowest;
            perk.level--;
        }
    }
    
    if(AutoPerks.applyCalculations(true) < 0){
        debug("error! setup not affordable. Aborting.");
        return;
    }
    
    AutoPerks.applyCalculations(); //re-arrange perk points
    
    debug("AutoPerks: Auto-Allocate Finished.","perks");
};

AutoPerks.spendHelium = function(helium) {
    debug("Calculating how to spend " + prettify(helium) + " Helium...","perks");
    if(helium < 0) {
        throw "AutoPerks: Major Error - Not enough helium to buy fixed perks.";
        return false;
    }
    if (Number.isNaN(helium)) {
        throw "AutoPerks: Major Error - Helium is Not a Number!";
        return false;
    }

    AutoPerks.workPerks = AutoPerks.perkHolder.slice(); //create a copy of perkHolder which holds all perks we are currently leveling
    
    

    //var effQueue = new PriorityQueue(function(a,b) { return a.efficiency > b.efficiency; } ); // Queue that keeps most efficient purchase at the top
    // Calculate base efficiency of all perks
    for(var i = 0; i < AutoPerks.workPerks.length; i++){
        if(AutoPerks.workPerks[i].isLocked || AutoPerks.workPerks[i].isFixed || typeof AutoPerks.workPerks[i].parent !== 'undefined'){ //skip unowned, fixed, and T2 perks.
            AutoPerks.workPerks.splice(i, 1); //remove from array
            i--;
        }
    }
    if (AutoPerks.workPerks.length === 0) {
        throw "All Perk Ratios were 0, or some other error.";
        return false;
    }
    
    calcZeroState(); //calculates efficiency of benefits, and sums benefitBak for every perk
    
    for(var i = 0; i < AutoPerks.workPerks.length; i++){ //next we calculate the efficiency of leveling each perk
        var inc = AutoPerks.workPerks[i].getBenefit();
        var price = AutoPerks.workPerks[i].getPrice();
        AutoPerks.workPerks[i].efficiency = inc/price;
        if(AutoPerks.workPerks[i].efficiency < 0) {
            throw "Error: Perk ratios must be positive values.";
            return false;
        }
    }

    var mostEff, price, inc;
    var packPrice,packLevel;
    var loopCounter=0;
    var highestEfficiency = 0;
    var highestEffPrice = 0;
    var highestEffLocation = 0;
    
    //iterate and find highest efficiency perk
    function iterateArr(){
        highestEfficiency = 0;
        highestEffPrice = 0;
        highestEffLocation = 0;
        calcZeroState();
        
        for(var i = 0; i < AutoPerks.workPerks.length; i++){
            if(AutoPerks.workPerks[i].level >= AutoPerks.workPerks[i].max){
                AutoPerks.workPerks.splice(i, 1); //remove from array
                if(AutoPerks.workPerks.length === 0) //all done
                    return false;
                i--;
                continue;
            }
            price = AutoPerks.workPerks[i].getPrice();
            if (helium <= price){ //can no longer afford a level of this perk, so remove it from AutoPerks.workPerks
                AutoPerks.workPerks.splice(i, 1); //remove from array
                if(AutoPerks.workPerks.length === 0) //all done
                    return false;
                i--;
                continue;
            }
            inc = AutoPerks.workPerks[i].getBenefit();
            AutoPerks.workPerks[i].efficiency = inc/price;
            if(AutoPerks.workPerks[i].efficiency < 0){
                throw "Error: Perk ratios must be positive values.";
                return false;
            }
            if(highestEfficiency < AutoPerks.workPerks[i].efficiency){
                highestEfficiency = AutoPerks.workPerks[i].efficiency;
                highestEffPrice = price;
                highestEffLocation = i;
            }
        }
        if(AutoPerks.workPerks.length === 0) //all done
            return false;
        
        mostEff = AutoPerks.workPerks[highestEffLocation];
        price = highestEffPrice;
        loopCounter++;
        return true;
    }
    while(iterateArr()){
        helium -= price;
        mostEff.buyLevel();
        mostEff.spent += price;            
        //inc = mostEff.getBenefit();
        //price = mostEff.getPrice();
        //mostEff.efficiency = inc / price;

        //when we level a T1 perk that has a T2 version, level the T2 alongside the T1 perk.
        //childLevelFunc() tells us how many levels we want in T2.
        //if we cant afford enough levels, proceed to next phase of the algorithm.
        if(mostEff.hasChild){
            var child = mostEff.child;
            var childLevelTarget = mostEff.childLevelFunc();
            var childNewLevel = Math.max(0, childLevelTarget);
            if(childNewLevel > child.level){
                packLevel = childNewLevel - child.level;
                packPrice = child.getTotalPrice(childNewLevel) - child.spent;
                if (packPrice <= helium) {
                    helium -= packPrice;
                    child.level += packLevel;
                    child.spent += packPrice;
                }
                else
                    break; //as soon as we cant afford T2 to match T1, break and continue with a more fine tuned calculation
            }
        }
    }
    debug("AutoPerks2: Pass One Complete. Loops ran: " + loopCounter, "perks");
    
    var calcHe = AutoPerks.applyCalculations(true);
    if(calcHe !== helium) //this can (and will) happen due to large number rounding errors. thought about using bigInt, but since the game doesnt there's no point.
        helium = calcHe;
    
    //add T2 perks into queue
    for (var i = 0; i < AutoPerks.additivePerks.length; i++){
        if(!AutoPerks.additivePerks[i].isLocked)
            AutoPerks.workPerks.push(AutoPerks.additivePerks[i]);
    }
    
    //printBenefitsPerks(true);

    debug("Spending remainder " + prettify(helium), "perks");
    loopCounter = 0;
    //Repeat the process for spending round 2. This spends any extra helium we have that is less than the cost of the last point of the dump-perk.
    while (iterateArr()){
        //Purchase the most efficient perk
        //when a T2 perk is most efficient, buy as many as we can afford with 0.1% of our total helium (min 1)
        if(typeof mostEff.parent !== 'undefined'){ //T2
            var pct = helium * 0.001;
            var extraLevels = mostEff.getBulkAmountT2(pct); //returns how many additional levels of this perk we can afford with helium. minimum 0;
            var newCost = mostEff.getTotalPrice(mostEff.level + extraLevels);
            var oldCost = mostEff.spent;
            var packPrice = newCost-oldCost;
            if(packPrice > helium){
                throw "error, can't afford " + (extraLevels - mostEff.level);
                continue;
            }
            helium-= packPrice;
            mostEff.buyLevel(extraLevels);
            mostEff.spent += packPrice;
        }
        else{ //T1
            helium -= price;
            mostEff.buyLevel();
            mostEff.spent += price;
        }
        loopCounter++;
    }

    debug("AutoPerks2: Pass Two Complete. Loops ran: " + loopCounter + " Leftover Helium: " + prettify(helium),"perks");
    minMaxMi(true); //recalculate mi efficiency, and also printout amalgamator/fuel info
};

AutoPerks.applyCalculations = function(testValidOnly){
    game.global.lockTooltip = true;

    if(!game.global.canRespecPerks && !portalWindowOpen){
        debug("AutoPerks - A Respec is required but no respec available. Try again on next portal.");
        return;
    }
    if(!game.global.viewingUpgrades && !portalWindowOpen) //we need some sort of screen open to do this.. right?
        viewPortalUpgrades(); //open 'view perks'
    
    //Pushes the respec button, then the Clear All button, then assigns perk points based on what was calculated.
    // *Apply calculations with respec
    if (game.global.canRespecPerks && !portalWindowOpen)
        respecPerksAT(); //without drawing
    if(!game.global.respecActive){
        game.global.lockTooltip = false;
        return;
    }
    
    clearPerksAT(); //without drawing
    var ret = useQuickImportAT(testValidOnly); //uses adapted code from export/import
    
    game.global.lockTooltip = false;
    if(!testValidOnly) numTab(1, true); //used to refresh perk displays. TODO: find a better way.
    return ret;
};

function useQuickImportAT(testValidOnly){
    var levels = {};
    for (var item in AutoPerks.perkHolder){
        //For smaller strings and backwards compatibility, perks not added to the object will be treated as if the perk is supposed to be level 0.
        if (AutoPerks.perkHolder[item].isLocked || AutoPerks.perkHolder[item].level <= 0) continue;
        //Add the perk to the object with the desired level
        levels[AutoPerks.perkHolder[item].name] = AutoPerks.perkHolder[item].level;
    }

    if (!levels){
            debug("This doesn't look like a valid perk string.");
            return;
    }
    if (levels.global){
            debug("This looks like a save string, rather than a perk string. To import a save string, use the Import button on the main screen.");
            return;
    }
    // Check that everything is in order. Don't touch anything yet.
    var respecNeeded = false;
    var heNeeded = 0;
    var changeAmt = {};
    var price = {};

    for (var perk in game.portal) {
        if (!levels[perk]){
            if (game.portal[perk].locked) continue;
            if (game.portal[perk].level + game.portal[perk].levelTemp == 0) continue;
            levels[perk] = 0;
        }
        // parseInt parses "1e6" as 1, so we use parseFloat then floor as a replacement
        var level = Math.floor(parseFloat(levels[perk]));

        if (game.portal[perk].locked || level > game.portal[perk].max || isNumberBad(level)){
            debug("Cannot set " + perk + " to level " + level + ".");
            return;
        }

        if (level < game.portal[perk].level)
            respecNeeded = true;

        changeAmt[perk] = level - game.portal[perk].level - game.portal[perk].levelTemp;
        price[perk] = changeAmt[perk] > 0 ? getPortalUpgradePrice(perk, false, changeAmt[perk]) :
                      changeAmt[perk] < 0 ? -getPortalUpgradePrice(perk, true, -changeAmt[perk]) : 0;
        heNeeded += price[perk];
    }
    if (heNeeded > game.resources.helium.respecMax - game.resources.helium.totalSpentTemp){
        if(!testValidOnly) debug("You don't have enough Helium to afford this perk setup. " + prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded));
        if(!testValidOnly) debug(levels);
        return game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded;
    }
    if(testValidOnly) return game.resources.helium.respecMax - game.resources.helium.totalSpentTemp - heNeeded;

    if (respecNeeded && !game.global.canRespecPerks){
        debug("This perk setup would require a respec, but you don't have one available.");
        return;
    }

    // Okay, now we can actually set the perks.
    cancelTooltip();
    if (respecNeeded && !game.global.respecActive)
        respecPerks();

    for (perk in changeAmt) {
        game.portal[perk].levelTemp += changeAmt[perk];
        game.resources.helium.totalSpentTemp += price[perk];
        game.portal[perk].heliumSpentTemp += price[perk];
        updatePerkLevel(perk);
    }

    document.getElementById("portalHeliumOwned").innerHTML = prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp);
    enablePerkConfirmBtn();
    updateAllPerkColors();
    document.getElementById("totalHeliumSpent").innerHTML = prettify(countHeliumSpent(true));
}

//copied from main.js with displayPortalUpgrades and numTab commented for speed
function respecPerksAT(){
	if (!game.global.canRespecPerks) return;
	//if (!game.global.viewingUpgrades) return;
	game.global.respecActive = true;
	//displayPortalUpgrades(true);
	//numTab(1, true);
	game.resources.helium.respecMax = (game.global.viewingUpgrades) ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
	document.getElementById("portalHeliumOwned").innerHTML = prettify(game.resources.helium.respecMax - game.resources.helium.totalSpentTemp);
	document.getElementById("respecPortalBtn").style.display = "none";
	document.getElementById("portalStory").innerHTML = "You can only respec once per run. Clicking cancel will not consume this use.";
	document.getElementById("portalTitle").innerHTML = "Respec Perks";
	document.getElementById("ptabRemove").style.display = "table-cell";
	document.getElementById("clearPerksBtn").style.display = "inline-block";
	if (selectedPreset)
		swapClass('tab', 'tabNotSelected', document.getElementById('presetTabLoad'));
}

//copied from main.js with displayPortalUpgrades commented for speed
function clearPerksAT(){
	if (!game.global.respecActive) return;
	game.resources.helium.respecMax = (game.global.viewingUpgrades) ? game.global.heliumLeftover : game.global.heliumLeftover + game.resources.helium.owned;
	game.resources.helium.totalSpentTemp = 0;
	for (var item in game.portal){
		if (game.portal[item].locked) continue;
		var portUpgrade = game.portal[item];
		if (typeof portUpgrade.level === 'undefined') continue;
		portUpgrade.levelTemp = 0;
		portUpgrade.levelTemp -= portUpgrade.level;
		game.resources.helium.respecMax += portUpgrade.heliumSpent;
		portUpgrade.heliumSpentTemp = 0;
		portUpgrade.heliumSpentTemp -= portUpgrade.heliumSpent;
	}
	//displayPortalUpgrades(true);
	document.getElementById("portalHeliumOwned").innerHTML = prettify(game.resources.helium.respecMax);
	if (game.global.viewingUpgrades) {
		document.getElementById("respecPortalBtn").style.display = "none";
		document.getElementById("activatePortalBtn").innerHTML = "Confirm";
		document.getElementById("activatePortalBtn").style.display = "inline-block";
	}
	document.getElementById("totalHeliumSpent").innerHTML = prettify(countHeliumSpent(true));
}

//internal test function
function testPerks(){
    for (var i in AutoPerks.perkHolder){
        var diff = AutoPerks.perkHolder[i].getTotalPrice() - AutoPerks.perkHolder[i].spent;
        if(diff !== 0){
            debug("Discrepency perk " + AutoPerks.perkHolder[i].name + " diff " + diff);
        }
    }
}

//used for all non T2 perks. returns price of next level at usedLevel
function compoundingPriceFunc(atLevel){
    var usedLevel = (typeof atLevel === 'undefined' ? this.level : atLevel);
    return Math.ceil(usedLevel/2 + this.baseCost * Math.pow(1.3, usedLevel));
}


function compoundingTotalPriceFunc(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    var totalPrice = 0;
    for(var i = 0; i < usedLevel; i++)
        totalPrice += this.getPrice(i);
    return totalPrice;
}

//used for all T2 perks. returns price of next level at usedLevel
function linearPriceFunc(atLevel){
    var usedLevel = (typeof atLevel === 'undefined' ? this.level : atLevel);
    return this.baseCost + this.increase * usedLevel;
}

function linearTotalPriceFunc(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    return (usedLevel - 1) * usedLevel / 2 * this.increase + this.baseCost * usedLevel;
}

//returns how many additional levels of this perk we can afford using hel helium. minimum 0
function getBulkT2(hel){
    var helium = hel+this.spent;
    return Math.max(0,Math.ceil((Math.sqrt(Math.pow(this.increase-2*this.baseCost,2)+ 8*this.increase*helium) + this.increase - 2*this.baseCost)/(2*this.increase)) - this.level);
}

//capable perk only
function calculateFluffyTotalPrice(toLevel){
    var usedLevel = (typeof toLevel === 'undefined' ? this.level : toLevel);
    var price = 0;
    for (var i = 1; i <= usedLevel; i++)
        price += this.baseCost * Math.pow(10, i-1);
    return price;
}

function buyLevel(howMany){
    var amt = (typeof howMany === 'undefined' ? 1: howMany);
    this.level+= amt;
    this.benefits.forEach((benefit) => {
        benefit.calc(this.incomeFlag, this.popBreedFlag);
    });
}

function calcBenefits(){ //calculate the benefits of raising a perk by 1 
    this.level++;
    var sum = 0;
    this.benefits.forEach((benefit) => {
        sum += benefit.weightBase * (benefit.calc(this.incomeFlag, this.popBreedFlag)/benefit.getZeroStateValue() - 1) * benefit.weightUser;
    });
    this.level--;
    return sum;
}

function getBenefitValue(){
    //return this.weightBase * this.benefit * this.weightUser;
    return this.benefit;
}

function benefitSave(value){
    this.benefitBak = value;
}

function benefitGetZeroStateValue(){
    return this.benefitBak;
}

function calcZeroState(){
    if(AutoPerks.userMaintainMode)
        AutoPerks.basePopAtMaxZ = calcBasePopMaintain();
    else
        AutoPerks.basePopAtMaxZ  = AutoPerks.basePopAtAmalZ * Math.pow(1.009, AutoPerks.maxZone-AutoPerks.amalZone);
    
    AutoPerks.basePopToUse  = AutoPerks.userMaxFuel ? AutoPerks.maxFuelBasePopAtMaxZ : AutoPerks.basePopAtMaxZ;
    
    calcIncome();
    calcPopBreed();
    
    for (var i = 0; i < AutoPerks.benefitHolder.length; i++)
        AutoPerks.benefitHolder[i].save(AutoPerks.benefitHolder[i].calc()); //with all perks' levels frozen, calculate the benefits, and store each in that benefit's benefitBak.
    
    
}

function benefitHeliumCalc(){
    var looting1 = AutoPerks.perksByName.Looting;
    var looting2 = AutoPerks.perksByName.Looting_II;
    
    this.benefit = (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level);
    
    if(isNaN(this.benefit)) {
        throw "error - Helium NaN benefit";
        return 0;
    }
    
    return this.getValue();
}

function benefitAttackCalc(incomeFlag){
    var power1Perk = AutoPerks.perksByName.Power;
    var power2Perk = AutoPerks.perksByName.Power_II;
    
    //if(incomeFlag) 
        calcIncome(); //updates AutoPerks.equipmentAttack TODO: use incomeFlag
    var amalBonus = game.talents.amalg.purchased ? Math.pow(1.5, AutoPerks.currAmalgamators) : (1 + 0.5*AutoPerks.currAmalgamators);
    this.benefit = (1 + 0.05*power1Perk.level) * (1 + 0.01*power2Perk.level) * AutoPerks.equipmentAttack * amalBonus;
    
    if(isNaN(this.benefit)) {
        throw "error - Attack NaN benefit";
        return 0;
    }
    
    return this.getValue();
}

function benefitHealthCalc(incomeFlag, popBreedFlag){
    var resilPerk      = AutoPerks.perksByName.Resilience;
    var toughness1Perk = AutoPerks.perksByName.Toughness;
    var toughness2Perk = AutoPerks.perksByName.Toughness_II;
    
    //if(incomeFlag) 
        calcIncome(); //updates AutoPerks.equipmentHealth
    var income = AutoPerks.equipmentHealth;    
    
    //if(popBreedFlag) 
        calcPopBreed();
    var popBreed = AutoPerks.breedMult;
    
    var ResourcefulFudgeFactor = AutoPerks.perksByName.Resourceful.level; //resourceful isnt useless, but hard to capture its value. so use this for now. TODO.
    this.benefit = (1 + 0.05*toughness1Perk.level) * (1 + 0.01*toughness2Perk.level)*Math.pow(1.1, resilPerk.level) * income * popBreed * Math.pow(40, AutoPerks.currAmalgamators) * (1 + 0.001*ResourcefulFudgeFactor);
    
    if(isNaN(this.benefit)) {
        throw "error - Health NaN benefit";
        return 0;
    }
    
    return this.getValue();
}

function benefitFluffyCalc(){
    var flufffocus = (game.talents.fluffyExp.purchased ? 1 + (0.25 * game.global.fluffyPrestige) : 1);
    var staffBonusXP = 1 + game.heirlooms.Staff.FluffyExp.currentBonus / 100;
    var cunningCuriousMult = (50 + AutoPerks.perksByName.Curious.level * 30) * (1 + AutoPerks.perksByName.Cunning.level * 0.25);
    var startZone = 301 - 2*AutoPerks.perksByName.Classy.level;
    
    var sumBenefit = (1 - Math.pow(1.015, AutoPerks.maxZone - startZone + 1)) / (-0.015); //sum of a geometric series
    for(var zone = 400; zone <= AutoPerks.maxZone; zone += 100)
        sumBenefit += 2*Math.pow(1.015,zone - startZone); //spire 3+ c50 rewards 2x zone reward
    
    this.benefit = sumBenefit * cunningCuriousMult * flufffocus * staffBonusXP;

    if(isNaN(this.benefit)) {
        throw "error - Fluffy NaN benefit";
        return 1;
    }
    
    return this.getValue();
}

function benefitDGCalc(){
    if(AutoPerks.userMaintainMode) return 1; //using max fuel for amalg maintain mode
    
    //when we change DG perks, we potentially change the amount of Mi we get and DG growth. if Mi changed we need to recalculate AutoPerks.benefitDG
    //var miBefore = AutoPerks.totalMi;
    var miPerRun = minMaxMi(); //calculates maximum Mi using carp1/carp2/coordinated to maintain amalgamator goal
    //if(miBefore !== miPerRun)
        this.benefit = MiToDGGrowth(miPerRun); //mi changed, update benefit
    
    if(isNaN(this.benefit)) {
        throw "error - DG NaN benefit";
        return 1;
    }
    
    return this.getValue();
}

function calcIncome(){
    var artisanPerk     = AutoPerks.perksByName.Artisanistry;
    var motivation1Perk = AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.perksByName.Motivation_II;

    var staffBonusMining= 1 + game.heirlooms.Staff.MinerSpeed.currentBonus / 100;
    var staffBonusDrop  = 1 + game.heirlooms.Staff.metalDrop.currentBonus / 100;
    //var windMod = 1 + game.empowerments.Wind.getCombatModifier() * 10;
    
    AutoPerks.gatheredResources =   0.5 *                   //base
                        AutoPerks.basePopToUse *
                        popMultiplier() *
                        Math.pow(1.25, 60) *                //basic books
                        Math.pow(1.6, AutoPerks.maxZone-60) * //advanced books
                        2 *                                 //bounty
                        AutoPerks.compoundingImp *          //same bonus as whipimp
                        (1 + 0.05*motivation1Perk.level) * 
                        (1 + 0.01*motivation2Perk.level) *
                        AutoPerks.windMod *
                        staffBonusMining *
                        2;                                 //sharing food
                        
    AutoPerks.cacheResources = calcCacheReward(); //LMC

    AutoPerks.baseZoneLoot = baseZoneDrop();
    var tBonus = 1.166;
    if (game.talents.turkimp4.purchased) tBonus = 1.333;
    else if (game.talents.turkimp3.purchased) tBonus = 1.249;
    AutoPerks.lootedResources = calcLootedResources();
    
    AutoPerks.totalResources = (AutoPerks.cacheResources + AutoPerks.gatheredResources + tBonus * staffBonusDrop * AutoPerks.lootedResources); //out of these 3, AutoPerks.cacheResources is the predominent one (from LMC maps)
    
    var baseCost = 1315 * Math.pow(0.95, artisanPerk.level); //total all gear level 1 basecost
    AutoPerks.prestiges = Math.floor(AutoPerks.maxZone/10) * 2 + 2 + (AutoPerks.maxZone % 10 >= 5 && cycleZone(AutoPerks.maxZone) !== 9 ? 2 : 0); //roundup to next xx5 zone for prestige, unless its last wind zone
    
    var prestigeMod = (AutoPerks.prestiges - 3) * 0.85 + 2;
    AutoPerks.gearCost = baseCost * Math.pow(1.069, prestigeMod * 53 + 1); //this is the cost of all gear at max prestige level 1
    
    AutoPerks.resourcesNeededXXX = AutoPerks.gearCost * Math.pow(1.2, 123);
    AutoPerks.resourcesMissingRatio = AutoPerks.resourcesNeededXXX / AutoPerks.totalResources;
    if(AutoPerks.totalResources >= AutoPerks.gearCost)
        AutoPerks.gearLevels = Math.log(AutoPerks.totalResources/AutoPerks.gearCost) / Math.log(1.2);
    else{ //cant even afford a single level
        //since we cant afford a single level, lets go down in prestiges until we can.
        var prestigesDropped = 0;
        var maxLoops = 500;
        while(AutoPerks.totalResources < AutoPerks.gearCost && maxLoops-- > 0){
            prestigesDropped++;
            AutoPerks.prestiges--;
            prestigeMod = (AutoPerks.prestiges - 3) * 0.85 + 2;
            AutoPerks.gearCost = baseCost * Math.pow(1.069, prestigeMod * 53 + 1);
        }
        if(maxLoops === 0){
            debug("Error: calcIncome() maxLoops is 0.");
            throw "Error: calcIncome() maxLoops is 0.";
            return -1;
        }
        AutoPerks.gearLevels = Math.log(AutoPerks.totalResources/AutoPerks.gearCost) / Math.log(1.2) / Math.pow(100000, prestigesDropped); //the main thing i want from this is lower prestige -> smaller fraction of a level. i expect users to be able to afford at least 1 level of last prestige.
    }
    
    AutoPerks.equipmentAttack = Math.round(40 * Math.pow(1.19, ((AutoPerks.prestiges - 1) * 13) + 1)) * AutoPerks.gearLevels; //40 is prestige 0 level 0 total attack values
    AutoPerks.equipmentHealth = Math.round(152 * Math.pow(1.19, ((AutoPerks.prestiges - 1) * 14) + 1)) * AutoPerks.gearLevels; //40 is prestige 0 level 0 total attack values
}

function calcLootedResources(){
    var looting1        = AutoPerks.perksByName.Looting;
    var looting2        = AutoPerks.perksByName.Looting_II;
    var spireBonus = 1 + 10 * Math.floor((AutoPerks.maxZone - 100) / 100) * (game.talents.stillRowing.purchased ? 0.03 : 0.02);
    AutoPerks.lootedResources = AutoPerks.baseZoneLoot *
                                AutoPerks.basePopToUse *
                                popMultiplier() *
                                (1 + 0.05*looting1.level) * 
                                (1 + 0.0025*looting2.level) * 
                                AutoPerks.compoundingImp * 
                                spireBonus * 
                                AutoPerks.windMod;
    return AutoPerks.lootedResources;
}

function calcCacheReward(){
    var looting1        = AutoPerks.perksByName.Looting;
    var looting2        = AutoPerks.perksByName.Looting_II;
    
    var amt = AutoPerks.basePopToUse * popMultiplier() / 2 * getJobModifierAT() * 20; //game.jobs["Miner"].modifier;
    amt *= AutoPerks.windMod;
    amt = calcHeirloomBonus("Staff", "MinerSpeed", amt);

    if (game.talents.turkimp4.purchased)
        amt *= 2;
    
    amt += getPlayerModifierAT() * 20; //tiny effect
    
    if (Fluffy.isRewardActive("lucky"))
        amt *= 1.25;
    
    //if (game.portal.Meditation.level > 0) amt *= (1 + (game.portal.Meditation.getBonusPercent() * 0.01));
    //if (game.jobs.Magmamancer.owned > 0 && what == "metal") amt *= game.jobs.Magmamancer.getBonusPercent();
    
    //whats left of scaleToCurrentMap()
    amt *= 0.64; //low level map -2 levels penalty
    amt *= 1.85; //perfect map loot
    
    amt *= AutoPerks.compoundingImp; //magnimp
    amt *= (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level);
    
    return amt;
}

function getJobModifierAT(){
    var motivation1Perk = AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.perksByName.Motivation_II;
    
    var base = 0.5 *
    Math.pow(1.25, 60) *                //basic books
    Math.pow(1.6, AutoPerks.maxZone-60) * //advanced books
    2 *                                     //bounty
    AutoPerks.compoundingImp *
    (1 + 0.05*motivation1Perk.level) *
    (1 + 0.01*motivation2Perk.level)*
    (1 + 14 * game.empowerments.Wind.getModifier() * 10); //wind around 14 stacks assuming 1shots
    return base;
}

function getPlayerModifierAT(){
    var base = 10;
    base = base * Math.pow(2, Math.floor(AutoPerks.maxZone / 2));
    return base;
}

function baseZoneDrop(){
    var amt = 0;
    var tempModifier = 0.5 * Math.pow(1.25, (AutoPerks.maxZone >= 59) ? 59 : AutoPerks.maxZone);
    //Mega books
    if (AutoPerks.maxZone >= 60) {
        if (game.global.frugalDone) tempModifier *= Math.pow(1.6, AutoPerks.maxZone - 59);
        else tempModifier *= Math.pow(1.5, AutoPerks.maxZone - 59);
    }
    //Bounty
    if (AutoPerks.maxZone >= 15) tempModifier *= 2;
    //Whipimp
    if (game.unlocks.impCount.Whipimp) tempModifier *= Math.pow(1.003, game.unlocks.impCount.Whipimp);
    var avgSec = tempModifier;
    if (AutoPerks.maxZone < 100)
        amt = avgSec * 3.5;
    else
        amt = avgSec * 5;
    return (amt * .8) + ((amt * .002) * (50 + 2));
}

function calcPopBreed(){
    //we want the value of breeding translated into health. 
    var coordPerk = AutoPerks.perksByName.Coordinated;
    var pheroPerk = AutoPerks.perksByName.Pheromones;
    
    var finalArmySize = calcCoords(AutoPerks.maxZone+99, coordPerk.level) * Math.pow(1000, AutoPerks.currAmalgamators);
    var finalPopSize  = AutoPerks.basePopToUse * popMultiplier();
    
    var lumberjackEff = getJobModifierAT();
    var lumberjacks = finalPopSize * 0.001;
    var gatheredResources = lumberjacks * lumberjackEff;
    AutoPerks.lootedResources = calcLootedResources();
    AutoPerks.maxNurseries = calculateMaxNurseries(AutoPerks.lootedResources + gatheredResources);
    
    AutoPerks.breed =   0.0085        //AutoPerks.breed is how many trimps are bred each second before geneticists.
                        * finalPopSize/2
                        * Math.pow(1.1, Math.floor(AutoPerks.maxZone / 5)) //potency
                        * AutoPerks.compoundingImp
                        * 0.1           //broken planet
                        * (1 + 0.1*pheroPerk.level)
                        * Math.pow(1.01, AutoPerks.maxNurseries / 5);
    
    var desiredAmalMult = (finalArmySize / 45) / AutoPerks.breed;
    var geneticists = Math.floor(Math.log(desiredAmalMult) / Math.log(0.98));
    var genHealthBonus = Math.pow(1.01, geneticists);
    AutoPerks.breedMult = genHealthBonus;
    return AutoPerks.breedMult;
}

function calculateMaxNurseries(resourcesAvailable){ 
    var resourcefulPerk = AutoPerks.perksByName.Resourceful;
    var mostAfford = -1;

    var price = game.buildings.Nursery.cost.wood;
    var start = price[0];
    start *= Math.pow(0.95, resourcefulPerk.level);
    var toBuy = log10(resourcesAvailable / start * (price[1] - 1) + 1) / log10(price[1]);
    
    if (mostAfford == -1 || mostAfford > toBuy) mostAfford = toBuy;
    
    if (mostAfford > 1000000000) return 1000000000;
    if (mostAfford <= 0) return 1;
    return mostAfford;
}








AutoPerks.initializePerks = function () {
    //Fixed perks: These perks do not get changed by autoperks.
    var siphonology     = {name: "Siphonology",     baseCost: 100000};
    var anticipation    = {name: "Anticipation",    baseCost: 1000};
    var meditation      = {name: "Meditation",      baseCost: 75};
    var relentlessness  = {name: "Relentlessness",  baseCost: 75};
    var range           = {name: "Range",           baseCost: 1};
    var agility         = {name: "Agility",         baseCost: 4};
    var bait            = {name: "Bait",            baseCost: 4};
    var trumps          = {name: "Trumps",          baseCost: 3};
    var packrat         = {name: "Packrat",         baseCost: 3};
    var overkill        = {name: "Overkill",        baseCost: 1e6, max: 30};   
    
    AutoPerks.fixedPerks = [siphonology, anticipation, meditation, relentlessness, range, agility, bait, trumps, packrat, overkill];
    for (var i in AutoPerks.fixedPerks){
        AutoPerks.fixedPerks[i].getPrice        = compoundingPriceFunc;
        AutoPerks.fixedPerks[i].getTotalPrice   = compoundingTotalPriceFunc;
        AutoPerks.fixedPerks[i].isFixed           = true;
    }
    var capable = {name: "Capable", baseCost: 1e8, getTotalPrice: calculateFluffyTotalPrice, isFixed: true}; //capable has a unique getTotalPrice function
    
    //perks affect 1 or more benefit (stats)
    /* most of these will be user adjustable. These weights are baseline, and each gets multiplied by their relevant benefits and multiplied again by userWeight
     * benefitStat captures how much of a stat we have, and what the change will be from increasing a perk.
     * increasing a weight by a factor of 2 means we are willing to spend twice as much helium for the same increase.
     * calculateBenefit(): each perk has its own calculateBenefit function. it calculates the relevant increases of stat(s) associated with a weight type(s)
     * looting for example, increases our helium, but also slightly increases our attack. 
     * so looting.calculateBenefit() multiplies a large increase in helium * weightHelium + a small increase in attack * weightAttack
     * finally, perk.efficiency equals perk.calculateBenefit() / perk.cost
     */
    
    //these are the main stats of the game. atk probably shouldnt be here, and health definitely shouldnt be here (they affect single run only)
    //TODO: attack and health -> helium/fluffy/DG conversion and get rid of them as stats.
    //
    //Nu probably belongs here but i dont know how relevant it is to decision making. maybe it affects maxzone (via runspeed) but atm that value is user entered. 
    //
    //
    //calc: updates benefit based on perks. benefit: stores it. gets backed up in benefitBak.
    //weightBase: hard coded
    //weightUser: overall value multiplier
    var bHel    = {calc: benefitHeliumCalc};
    var bAtk    = {calc: benefitAttackCalc};
    var bHlth   = {calc: benefitHealthCalc};
    var bFluff  = {calc: benefitFluffyCalc};
    var bDG     = {calc: benefitDGCalc}; //user must prove he can enter magma before DG is valued
    
    AutoPerks.benefitHolderObj = {Helium:bHel, Attack:bAtk, Health:bHlth, Fluffy:bFluff, DG:bDG};
    AutoPerks.benefitHolder    = [bHel, bAtk, bHlth, bFluff, bDG];
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++){
        AutoPerks.benefitHolder[i].weightBase   = 1;
        AutoPerks.benefitHolder[i].getValue     = getBenefitValue; //weightBase * benefit * weightUser
        AutoPerks.benefitHolder[i].benefitBak   = 0; //AutoPerks.benefitHolder[i].benefit;
        AutoPerks.benefitHolder[i].save         = benefitSave;
        AutoPerks.benefitHolder[i].getZeroStateValue = benefitGetZeroStateValue;
    }
    AutoPerks.resetBenefits();
    
    var cunning      = {name: "Cunning",                                        benefits: [bFluff],            baseCost: 1e11,  getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var curious      = {name: "Curious",                                        benefits: [bFluff],            baseCost: 1e14,  getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var classy       = {name: "Classy",                                         benefits: [bFluff],            baseCost: 1e17,  getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var pheromones   = {name: "Pheromones",   popBreedFlag:true,                benefits: [bHlth],             baseCost: 3,     getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var artisanistry = {name: "Artisanistry", incomeFlag: true,                 benefits: [bHlth, bAtk],       baseCost: 15,    getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var resilience   = {name: "Resilience",                                     benefits: [bHlth],             baseCost: 100,   getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var coordinated  = {name: "Coordinated",  popBreedFlag:true,                benefits: [bHlth, bAtk, bDG],  baseCost: 150000,getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    var resourceful  = {name: "Resourceful",  incomeFlag: true,                 benefits: [bHlth],             baseCost: 50000, getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc};
    
    var carpentry    = {name: "Carpentry",    incomeFlag: true, popBreedFlag:true, benefits: [bHlth, bAtk, bDG],  baseCost: 25,    getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc, hasChild: !game.portal["Carpentry_II"].locked, childLevelFunc: carp2LevelFunc}; 
    var looting      = {name: "Looting",      incomeFlag: true,                 benefits: [bHlth, bAtk, bHel], baseCost: 1,     getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc, hasChild: !game.portal["Looting_II"].locked,   childLevelFunc: looting2LevelFunc};
    var toughness    = {name: "Toughness",                                      benefits: [bHlth],             baseCost: 1,     getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc, hasChild: !game.portal["Toughness_II"].locked, childLevelFunc: toughness2LevelFunc};
    var power        = {name: "Power",                                          benefits: [bAtk],              baseCost: 1,     getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc, hasChild: !game.portal["Power_II"].locked,     childLevelFunc: power2LevelFunc};
    var motivation   = {name: "Motivation",   incomeFlag: true,                 benefits: [bHlth, bAtk],       baseCost: 2,     getPrice: compoundingPriceFunc, getTotalPrice: compoundingTotalPriceFunc, hasChild: !game.portal["Motivation_II"].locked,childLevelFunc: motivation2LevelFunc};
    
    //Tier2 perks
    var carpentry_II = {name: "Carpentry_II", incomeFlag: true, popBreedFlag:true, benefits: [bHlth, bAtk, bDG],  baseCost: 100000,increase: 10000, getPrice: linearPriceFunc, getTotalPrice: linearTotalPriceFunc, getBulkAmountT2:getBulkT2, parent: carpentry};
    var looting_II   = {name: "Looting_II",   incomeFlag: true,                 benefits: [bHlth, bAtk, bHel], baseCost: 100000,increase: 10000, getPrice: linearPriceFunc, getTotalPrice: linearTotalPriceFunc, getBulkAmountT2:getBulkT2, parent: looting};
    var toughness_II = {name: "Toughness_II",                                   benefits: [bHlth],             baseCost: 20000, increase: 500,   getPrice: linearPriceFunc, getTotalPrice: linearTotalPriceFunc, getBulkAmountT2:getBulkT2, parent: toughness};
    var power_II     = {name: "Power_II",                                       benefits: [bAtk],              baseCost: 20000, increase: 500,   getPrice: linearPriceFunc, getTotalPrice: linearTotalPriceFunc, getBulkAmountT2:getBulkT2, parent: power};
    var motivation_II= {name: "Motivation_II",incomeFlag: true,                 benefits: [bHlth, bAtk],       baseCost: 50000, increase: 1000,  getPrice: linearPriceFunc, getTotalPrice: linearTotalPriceFunc, getBulkAmountT2:getBulkT2, parent: motivation};    
        
    if(carpentry.hasChild)  carpentry.child  = carpentry_II;
    if(looting.hasChild)    looting.child    = looting_II;
    if(toughness.hasChild)  toughness.child  = toughness_II;
    if(power.hasChild)      power.child      = power_II;
    if(motivation.hasChild) motivation.child = motivation_II;
    
    //gather these into an array of objects
    AutoPerks.perkHolder = [siphonology, anticipation, meditation, relentlessness, range, agility, bait, trumps, packrat, looting, toughness, power, motivation, pheromones, artisanistry, carpentry, resilience, coordinated, resourceful, overkill, capable, cunning, curious, classy, toughness_II, power_II, motivation_II, carpentry_II, looting_II];
    AutoPerks.additivePerks = [looting_II, toughness_II, power_II, motivation_II, carpentry_II];
    //initialize basics on all.
    for(var i in AutoPerks.perkHolder){
        AutoPerks.perkHolder[i].level       = 0;
        AutoPerks.perkHolder[i].spent       = 0;
        AutoPerks.perkHolder[i].efficiency  = 1;
        AutoPerks.perkHolder[i].isLocked    = typeof game.portal[AutoPerks.perkHolder[i].name].locked === 'undefined' ? false : game.portal[AutoPerks.perkHolder[i].name].locked;
        AutoPerks.perkHolder[i].getBenefit  = calcBenefits;
        AutoPerks.perkHolder[i].buyLevel    = buyLevel;
        if(typeof AutoPerks.perkHolder[i].max === 'undefined') AutoPerks.perkHolder[i].max = Number.MAX_VALUE;
    }
    
    for(var i in AutoPerks.perkHolder)
        AutoPerks.perksByName[AutoPerks.perkHolder[i].name] = AutoPerks.perkHolder[i];
};

carp2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/100*(Math.sqrt(5)*Math.sqrt(x + Math.pow(2,1-x)*Math.pow(5,2-x)*Math.pow(13,x)+76050000)-20500));
};

looting2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/25*(Math.pow(2,-x-5/2)*Math.sqrt(Math.pow(2,2*x) * Math.pow(x,2) + Math.pow(2,x + 1) * Math.pow(13/5,x)*x + 5*Math.pow(2,2*x + 2)*x + Math.pow(2,x + 3) * Math.pow(5,1 - x) * Math.pow(13,x) + 23765625 * Math.pow(2,2*x + 5)) - 5125));
};

toughness2LevelFunc = function(){
    var x = this.level;
    return Math.floor(0.0005*Math.pow(2,-x)*(Math.sqrt(125*Math.pow(2,2*x + 5)*Math.pow(x,2) + 8000*Math.pow(5.2,x)*x + 625*Math.pow(2,2*x + 7)*x + Math.pow(2,x + 8)*Math.pow(5,4 - x)*Math.pow(13,x) + 3515625*Math.pow(2,2*x + 10)) - 4375*Math.pow(2,x + 5)));
};

motivation2LevelFunc = function(){
    var x = this.level;
    return Math.floor(1/25*(Math.sqrt(5)* Math.pow(2,-x - 2) * Math.sqrt( Math.pow(2,2* x)*Math.pow(x,2)+Math.pow(2,x + 2)*Math.pow(13/5,x)*x + 5*Math.pow(2,2*x + 2)*x + Math.pow(2,x + 4)*Math.pow(5,1 - x)*Math.pow(13,x)+ 78125*Math.pow(2,2* x + 4) ) - 1875));
};

power2LevelFunc = function(){
    var x = this.level;
    return Math.floor(0.0005*Math.pow(2,-x)*(Math.sqrt(125*Math.pow(2,2*x + 5)*Math.pow(x,2) + 8000*Math.pow(5.2,x)*x + 625*Math.pow(2,2*x + 7)*x + Math.pow(2,x + 8)*Math.pow(5,4 - x)*Math.pow(13,x) + 3515625*Math.pow(2,2*x + 10)) - 4375*Math.pow(2,x + 5)));
};

//create a 2nd array (perksByName) of the contents of perkHolder, indexed by name (easy access w/ getPerkByName)
AutoPerks.perksByName = {};

function calcBasePopArr(){
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //max possible fuel
    AutoPerks.basePopArr = [];
    for (AutoPerks.fuelMaxZones = 0; AutoPerks.fuelMaxZones <= AutoPerks.amalZone - 230; AutoPerks.fuelMaxZones += AutoPerks.FuelZoneCutoff){
        AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)] = calcBasePop();
    }
    AutoPerks.maxFuelBasePopAtMaxZ = calcBasePop(true); //basepop if we fuel from 230 to maxZ
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //set max possible fuel until amalZ
    return AutoPerks.basePopArr;
}

//base pop only depends on DG stats and fuel zones.
function calcBasePop(useMaxFuel){
    findStartEndFuel();
    //fuel and tauntimps
    var eff = game.generatorUpgrades["Efficiency"].upgrades;
    var fuelCapacity = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var supMax = 0.2 + 0.02 * game.generatorUpgrades["Supply"].upgrades;
    var OCEff = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var magmaCells = (game.talents.magmaFlow.purchased ? 18 : 16);
    var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    
    var pop = 1;
    var currFuel = 0;
    
    var popTick = Math.floor(Math.sqrt(fuelCapacity)* 500000000 * (1 + 0.1*eff) * OCEff);
    if(useMaxFuel){
        var start   = 230;
        var endFuel = AutoPerks.maxZone;
        var endZone = AutoPerks.maxZone;
    }
    else{
        var start   = AutoPerks.fuelStartZone;
        var endFuel = AutoPerks.fuelEndZone;
        var endZone = AutoPerks.amalZone;
    }
    for (var i = start; i < endZone; i++){
        pop *= 1.009; //tauntimp average increase
        
        if(i < endFuel){
            var fuelFromMagmaCell = Math.min(0.2 + (i-230) * 0.01, supMax);
            var fuelFromZone = magmaCells * fuelFromMagmaCell;
            currFuel += fuelFromZone;
            if(currFuel > 2*fuelCapacity){
                var ticks = Math.ceil((currFuel - 2*fuelCapacity) / burn);
                pop += ticks * popTick;
                currFuel -= burn * ticks;
            }
        }
    }
    
    return Math.floor(pop * AutoPerks.DailyHousingMult);
}

//base pop at maxZ, used for respec
function calcBasePopMaintain(){
    var eff = game.generatorUpgrades["Efficiency"].upgrades;
    var fuelCapacity = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var supMax = 0.2 + 0.02 * game.generatorUpgrades["Supply"].upgrades;
    var OCEff = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var magmaCells = (game.talents.magmaFlow.purchased ? 18 : 16);
    var burn = game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    
    var currCarp1Bonus = Math.pow(1.1, game.portal["Carpentry"].level);
    var currCarp2Bonus = 1 + 0.0025 * game.portal["Carpentry_II"].level;
    var basePop = game.resources.trimps.realMax() / currCarp1Bonus / currCarp2Bonus;
    var currFuel = game.global.magmaFuel;
    
    var popTick = Math.floor(Math.sqrt(fuelCapacity)* 500000000 * (1 + 0.1*eff) * OCEff);
    
    for (var i = game.global.world; i < AutoPerks.maxZone; i++){
        basePop *= 1.009; //tauntimp average increase        
        var fuelFromMagmaCell = Math.min(0.2 + (i-230) * 0.01, supMax);
        var fuelFromZone = magmaCells * fuelFromMagmaCell;
        currFuel += fuelFromZone;
        if(currFuel > 2*fuelCapacity){
            var ticks = Math.ceil((currFuel - 2*fuelCapacity) / burn);
            basePop += ticks * popTick;
            currFuel -= burn * ticks;
        }
    }
    
    return Math.floor(basePop);
}

function popMultiplier(){
    var carp1 = Math.pow(1.1, AutoPerks.perksByName.Carpentry.level);
    var carp2 = 1 + 0.0025 * AutoPerks.perksByName.Carpentry_II.level;
    return carp1 * carp2;
}

function calcCoords(coordsUsed, coordinated){
    var armySize = 1;
    var level = (typeof coordinated === 'undefined' ? AutoPerks.perksByName.Coordinated.level : coordinated);
    var coordMult = 1 + 0.25 * Math.pow(0.98, level);
    for(var i = 0; i < coordsUsed; i++){
        armySize = Math.ceil(armySize * coordMult);
    }
    return armySize;
}

function getAmalFinal(basePopAtZ){
    return basePopAtZ * AutoPerks.popMult / AutoPerks.finalArmySize / AutoPerks.amalMultPre / AutoPerks.RatioToAmal;
}

function findStartEndFuel(){
    AutoPerks.fuelStartZone = Math.max(230, 320 - Math.ceil(AutoPerks.fuelMaxZones/2));
    AutoPerks.fuelEndZone = Math.min(AutoPerks.amalZone, AutoPerks.fuelStartZone + AutoPerks.fuelMaxZones - 1);
    AutoPerks.totalMi = (game.talents.magmaFlow.purchased ? 18 : 16) * (AutoPerks.maxZone - 230 - AutoPerks.fuelMaxZones);
}

function saveSecondLine(){
    secondLine = [AutoPerks.maxZone, AutoPerks.amalGoal, AutoPerks.amalZone, AutoPerks.coordsBehind, AutoPerks.userMaxFuel, AutoPerks.userRespecAfterAmal, AutoPerks.userMaintainMode, AutoPerks.userSaveATSettings];
}

function minMaxMi(print){
    //for a given carp1/2/coordinated/amalgamator, figure out min fuel zones in jumps of 10
    AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
    AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated
    if(AutoPerks.userMaxFuel)
        AutoPerks.fuelMaxZones = AutoPerks.maxZone - 230;
    else
        AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230;
    
    if(AutoPerks.benefitHolderObj.DG.weightUser > 0 && !AutoPerks.userMaxFuel && !AutoPerks.userMaintainMode){ //if DG weight is 0, always use max fuel
        var maxLoops = 500;
        while(maxLoops--){
            if(AutoPerks.fuelMaxZones <= 10) break;
            AutoPerks.fuelMaxZones -= AutoPerks.FuelZoneCutoff;
            AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)]; //must be called before every getAmalFinal
            AutoPerks.finalAmalRatio = getAmalFinal(AutoPerks.basePopAtAmalZ);
            if(AutoPerks.finalAmalRatio < 1){ //below threshold, undo last
                AutoPerks.fuelMaxZones += AutoPerks.FuelZoneCutoff;
                AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)]; //must be called before every getAmalFinal
                AutoPerks.finalAmalRatio = getAmalFinal(AutoPerks.basePopAtAmalZ);
                break;
            }
        }
    }
    
    findStartEndFuel(); //updates start zone, end zone and Mi
    if(AutoPerks.userMaxFuel) AutoPerks.totalMi = 0;
    if(print){
        //printSomeStatsForGraph(); //for csv format
        //var msg1 = "Final - Carp1: " + AutoPerks.perksByName.Carpentry.level + " Carp2: " + AutoPerks.perksByName.Carpentry_II.level.toExponential(2) + " Coordinated: " + AutoPerks.perksByName.Coordinated.level;
        //var msg2 = "Amalgamators: "+AutoPerks.currAmalgamators + " Start Fuel: " + AutoPerks.fuelStartZone + " End Fuel: " + AutoPerks.fuelEndZone + " pop/army Goal " + AutoPerks.finalAmalRatio.toFixed(2) + " Mi collected: " + AutoPerks.totalMi;
        var fluffyXP = Fluffy.currentExp[1]; //xp in current evolution only
        var currEvo = game.global.fluffyPrestige;
		var prestigeEvoZero = 1000;
		var xpCount = 0;
		for(var i = 0; i < 10; i++){
			xpCount += prestigeEvoZero;
			prestigeEvoZero *= 4;
		}
        for (var i = 0; i < currEvo; i++){
            fluffyXP += xpCount;
            xpCount *= 5;
        }
        var fluffyGrowth = (AutoPerks.benefitHolderObj.Fluffy.benefit*100 / fluffyXP).toFixed(3) + "%";
        var heliumMod = AutoPerks.benefitHolderObj.Helium.benefit.toExponential(2);
        var lastZoneLength = timeEstimator(false, 0, approxZoneHP(AutoPerks.maxZone), false);
        var healthMod = AutoPerks.benefitHolderObj.Health.benefit.toExponential(2); //this includes gear, amalgamators, toughness1/2, resil, and anything breeding related
        if(AutoPerks.userMaxFuel) AutoPerks.fuelEndZone = AutoPerks.maxZone;
        
        

        var timeText = "";
        if(lastZoneLength < 60) timeText = Math.floor(lastZoneLength) + "s";
        else if (lastZoneLength < 3600) timeText = Math.floor(lastZoneLength/60) + "m" + Math.floor(lastZoneLength % 60) + "s";
        else timeText = Math.floor(lastZoneLength / 3600) + "h" + Math.floor(lastZoneLength % 60) + "m";
        var msg2 = "Helium: " + heliumMod + " zone " + AutoPerks.maxZone + " will take approx " + timeText + ". Health: " + healthMod + " Start Fuel: " + AutoPerks.fuelStartZone + " End Fuel: " + AutoPerks.fuelEndZone + " Pop/Army Goal: " + AutoPerks.finalAmalRatio.toFixed(2) + " Carp1/2/Coord: " + AutoPerks.getPct().toFixed(2)+"%";
        var msg3 = "Fluffy Growth: " + fluffyGrowth + " DG Growth: " + (AutoPerks.DGGrowthRun*100).toFixed(3) + "% ("+AutoPerks.totalMi + " Mi)";
        var $text = document.getElementById("textAreaAllocate");
        $text.innerHTML += msg2 + '<br>' + msg3;
    }
    
    return AutoPerks.totalMi;
}

//internal
function printSomeStatsForGraph(){
    var popMult = popMultiplier();
    debug("Zone, BasePop, TotalPop, ArmySize, Ratio");
    for (var currZone = 230; currZone <= AutoPerks.amalZone; currZone++){
        var coordsUsed = currZone+100-AutoPerks.coordsBehind-1;
        var basePop = AutoPerks.basePopArr[currZone-230];
        var totalPop = basePop * popMult;
        var armySize = calcCoords(coordsUsed);
        var clearedSpiresBonus = Math.min(4, Math.floor((currZone - 200) / 100));
        var ratioToAmal = Math.pow(10, 10-clearedSpiresBonus);
        var ratio = totalPop / armySize / AutoPerks.amalMultPre / ratioToAmal;
        debug(", " +currZone + ", " + basePop.toExponential(2) + ", " + totalPop.toExponential(2) + ", " + armySize.toExponential(2) + ", " + ratio.toFixed(2));
    }
}

//printout
function printBenefitsPerks(levels){
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++)
        debug(AutoPerks.benefitHolder[i].getValue());
    for(var i = 0; i < AutoPerks.perkHolder.length; i++){
        if(AutoPerks.perkHolder[i].isFixed) continue;
        debug(AutoPerks.perkHolder[i].name + (typeof levels === 'undefined' ? " " : " " + AutoPerks.perkHolder[i].level + " ") + AutoPerks.perkHolder[i].getBenefit());
    }
}

//we care about DG growth, not straight Mi numbers, so convert the two based off how fast we can expect our DG to grow.
function MiToDGGrowth(MiPerRun){
    if(MiPerRun === 0) return AutoPerks.DGGrowthRun = 0;
    
    //get levels
    var effCurr         = game.generatorUpgrades["Efficiency"].upgrades;
    var effPlusOne      = game.generatorUpgrades["Efficiency"].upgrades + 1;
    var capacityCurr    = 3 + game.generatorUpgrades["Capacity"].baseIncrease * game.generatorUpgrades["Capacity"].upgrades;
    var capacityPlusOne = 3 + game.generatorUpgrades["Capacity"].baseIncrease * (game.generatorUpgrades["Capacity"].upgrades+1);
    var OCNow           = 1 - game.generatorUpgrades["Overclocker"].modifier;
    var OCPlusOne       = 1 - game.generatorUpgrades["Overclocker"].nextModifier();
    
    //costs in absolute Mi
    var effCost         = game.generatorUpgrades["Efficiency"].cost();
    var capCost         = game.generatorUpgrades["Capacity"].cost();
    var OCCost          = game.generatorUpgrades["Overclocker"].cost();
    
    //Mi decays and what we actually care about is how long is takes us to afford an upgrade. translate costs into #runs needed
    var effRuns = runsToGetMi(effCost, MiPerRun);
    var capRuns = runsToGetMi(capCost, MiPerRun);
    var OCRuns  = runsToGetMi(OCCost , MiPerRun);
    
    //base population, population if we increase efficiency, capacity and OC
    var popCurr         = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effCurr)    * OCNow);
    var effPopPlusOne   = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effPlusOne) * OCNow);
    var capPopPlusOne   = Math.floor(Math.sqrt(capacityPlusOne)* 500000000 * (1 + 0.1*effCurr)    * OCNow);
    var OCPopPlusOne    = Math.floor(Math.sqrt(capacityCurr)   * 500000000 * (1 + 0.1*effCurr)    * OCPlusOne);
    
    //efficiency expressed as pop increase divided by number of runs to get it. the more Mi per run we get, the greater these values will be
    var effEff = (effPopPlusOne/popCurr - 1) / effRuns;
    var capEff = (capPopPlusOne/popCurr - 1) / capRuns;
    var OCEff  = (OCPopPlusOne /popCurr - 1) / OCRuns;
    
    AutoPerks.DGGrowthRun = Math.max(effEff, capEff, OCEff);
    return AutoPerks.DGGrowthRun;
}

//how many runs to afford upgrade
function runsToGetMi(MiCost, MiPerRun){
    var runsForUpgrade = 0;
    var currMi = 0;
    var decay = ((game.permanentGeneratorUpgrades.Shielding.owned) ? 0.2 : 0.3);
    if(MiPerRun >= MiCost)
        runsForUpgrade = MiCost/MiPerRun; //this is an approximation because decay still plays a role
    else while (runsForUpgrade <= 20){
        currMi += MiPerRun;
        
        if(currMi >= MiCost){
            currMi -= MiCost;
            currMi *= 1 - decay;
            runsForUpgrade += 1-currMi/MiCost; //factor in any leftover Mi we'll be taking over to our next run
            break;
        }
        currMi *= 1 - decay;
        runsForUpgrade++;
    }
    return runsForUpgrade;
}

AutoPerks.getPct = function(){
    return (AutoPerks.perksByName.Carpentry.spent + AutoPerks.perksByName.Carpentry_II.spent + AutoPerks.perksByName.Coordinated.spent) / AutoPerks.totalHelium * 100;
}

//get ready / initialize
AutoPerks.initializeAmalg = function() {
    AutoPerks.MAXPCT = 85;      //maximum helium we're willing to spend in carp1/2/coordinated
    AutoPerks.FuelZoneCutoff = 1; //initially had this at 10 but wasnt sensitive enough to +1 carp level changes
    AutoPerks.DGGrowthRun = 0; //initialize
    //input checks
    if(AutoPerks.amalZone < 230) AutoPerks.amalZone = 230;
    if(AutoPerks.amalZone > 650) AutoPerks.amalZone = 650;
    if(AutoPerks.amalGoal < 0) AutoPerks.amalGoal = 0;
    if(AutoPerks.maxZone < AutoPerks.amalZone) AutoPerks.maxZone = AutoPerks.amalZone;
    if(AutoPerks.coordsBehind < 0) AutoPerks.coordsBehind = 0;
    saveSecondLine();
    AutoPerks.updateFromBoxes();                                                                     //update the boxes
    
    //army calc
    AutoPerks.coordsUsed = AutoPerks.userMaintainMode ? AutoPerks.maxZone+100-1 : AutoPerks.amalZone+100-AutoPerks.coordsBehind-1;
    AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated
    
    //step 1: find max amalgamators we can afford. calculate carp1/2/coordinated along the way
    var carp1perk = AutoPerks.perksByName.Carpentry;
    var carp2perk = AutoPerks.perksByName.Carpentry_II;
    var coordperk = AutoPerks.perksByName.Coordinated;
    var pct = AutoPerks.getPct();
    var carp1 = 0;
    var carp2 = 0;
    var coordinated = 0;
    var carp1cost = 0;
    var carp2cost = 0;
    var coordinatedcost = 0;
    var finalMsg = '';
    
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //max possible fuel
    
    //calcBasePop only needs to be calculated once for each AutoPerks.fuelMaxZones and AutoPerks.amalZone
    //we can save the results and pull the previously calculated values for speed
    calcBasePopArr();
    
    AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)];
    AutoPerks.basePopAtMaxZ  = AutoPerks.basePopAtAmalZ * Math.pow(1.009, AutoPerks.maxZone-AutoPerks.amalZone);
    AutoPerks.basePopToUse  = AutoPerks.userMaxFuel ? AutoPerks.maxFuelBasePopAtMaxZ : AutoPerks.basePopAtMaxZ; //needed for efficiency calculations, but do we need to worry about efficiency in initializeAmalg()?
    if(AutoPerks.userMaintainMode){ //only need to maintain our amalg at maxZone
        AutoPerks.currAmalgamators = game.jobs.Amalgamator.owned;
        AutoPerks.amalGoal = game.jobs.Amalgamator.owned;
        AutoPerks.RatioToAmal = 1000000;
        var basePopAtZToUse = calcBasePopMaintain();
    }
    else{
        AutoPerks.currAmalgamators = 0;
        AutoPerks.clearedSpiresBonus = Math.min(4, Math.floor((AutoPerks.amalZone - 200) / 100));
        AutoPerks.RatioToAmal = Math.pow(10, 10-AutoPerks.clearedSpiresBonus);
        var basePopAtZToUse = AutoPerks.basePopAtAmalZ;
    }
    
    while(AutoPerks.currAmalgamators <= AutoPerks.amalGoal){
        AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
        AutoPerks.popMult = popMultiplier(); //carp1/2 multiplier
        AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
        while(AutoPerks.finalAmalRatio < 1 && pct < AutoPerks.MAXPCT){
            //we cant reach our amalgamators, so increase carp1/coordinated/carp2 until we can
            //increase carp1
            var price = carp1perk.getPrice();
            carp1perk.buyLevel();
            carp1perk.spent+= price;
            pct = AutoPerks.getPct();
            AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
            AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
            if(AutoPerks.finalAmalRatio >= 1 || pct >= AutoPerks.MAXPCT)
                break;
            //if coordinated level costs less than double carp level, buy coord TODO: use exact efficiency increase
            var price2 = coordperk.getPrice();
            if(price2 < 2*price){
                coordperk.buyLevel();
                coordperk.spent+= price2;
                pct = AutoPerks.getPct();
                AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated //recalculate army size
                AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
                if(AutoPerks.finalAmalRatio >= 1 || pct >= AutoPerks.MAXPCT)
                    break;
            }
            //calculate carp2 based off of carp1.
            var levelTarget = carp1perk.childLevelFunc();
            var newLevel = Math.max(0, levelTarget);
            if(newLevel > carp2perk.level){
                var packLevel = newLevel - carp2perk.level;
                var packPrice = carp2perk.getTotalPrice(newLevel) - carp2perk.spent;
                carp2perk.level += packLevel;
                carp2perk.spent += packPrice;
            }

            pct = AutoPerks.getPct();
            AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
            AutoPerks.finalAmalRatio = getAmalFinal(basePopAtZToUse);
            if(AutoPerks.finalAmalRatio >= 1 || pct >= AutoPerks.MAXPCT)
                break;
        }
        if(AutoPerks.finalAmalRatio >= 1){
            //store successful carp1/2/coordinated
            carp1 =             carp1perk.level;
            carp2 =             carp2perk.level;
            coordinated =       coordperk.level;
            carp1cost =         carp1perk.spent;
            carp2cost =         carp2perk.spent;
            coordinatedcost =   coordperk.spent;
                
            var msg = "Amalgamator #"+AutoPerks.currAmalgamators+(AutoPerks.userMaintainMode ? " maintained. " : " found. ");//+pct.toFixed(2)+"% of total helium used.";
            debug(msg, "perks");
            finalMsg = msg + '<br>';
            if(AutoPerks.currAmalgamators == AutoPerks.amalGoal)
                break;
            else
                AutoPerks.currAmalgamators++;
        }
        else{
            var msg1 = "Could not reach Amalgamator #"+AutoPerks.currAmalgamators+". Carp1: " + carp1perk.level + " Carp2: " + carp2perk.level.toExponential(2) + " Coordinated: " + coordperk.level + " "+pct.toFixed(2)+"% of total helium used. Pop/Army Goal: " + (AutoPerks.finalAmalRatio).toFixed(2);
            finalMsg = msg1 + '<br>' + finalMsg;
            debug(msg1);
            
            AutoPerks.currAmalgamators--;
            break;
        }
    }   
    
    document.getElementById("textAreaAllocate").innerHTML = finalMsg;
    if(AutoPerks.currAmalgamators < 0) AutoPerks.currAmalgamators = 0;
    AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
    
    carp1perk.level = carp1;
    carp2perk.level = carp2;
    coordperk.level = coordinated;
    carp1perk.spent = carp1cost;
    carp2perk.spent = carp2cost;
    coordperk.spent = coordinatedcost;
};

AutoPerks.firstRun = function(){
    AutoPerks.updateDailyMods(); // current (or selected) challenge modifiers
    AutoPerks.initializePerks();        //create data structures
    AutoPerks.initializeGUI();          //create UI elements
    AutoPerks.initializeRatioPreset();  //loads last selected preset.
    AutoPerks.updateFromBoxes();        //populate UI boxes based on selected preset. also updates userWeights from box values
}

AutoPerks.firstRun(); //set some things up on loading. click Allocate does everything else












const topPQ = 0;
const parentPQ = i => ((i + 1) >>> 1) - 1;
const leftPQ = i => (i << 1) + 1;
const rightPQ = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[topPQ];
  }
  add(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  poll() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > topPQ) {
      this._swap(topPQ, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[topPQ] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > topPQ && this._greater(node, parentPQ(node))) {
      this._swap(node, parentPQ(node));
      node = parentPQ(node);
    }
  }
  _siftDown() {
    let node = topPQ;
    while (
      (leftPQ(node) < this.size() && this._greater(leftPQ(node), node)) ||
      (rightPQ(node) < this.size() && this._greater(rightPQ(node), node))
    ) {
      let maxChild = (rightPQ(node) < this.size() && this._greater(rightPQ(node), leftPQ(node))) ? rightPQ(node) : leftPQ(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}