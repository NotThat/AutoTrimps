//Create blank AutoPerks object
var AutoPerks = {};
MODULES.perks = {};
MODULES.perks.showDetails = true;   //show which individual perks are spent;   //use algorithm 2 instead.

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
AutoPerks.createInput = function(perkname,div) {
    var perk1input = document.createElement("Input");
    perk1input.id = perkname + 'Ratio';
    perk1input.perkname = perkname;
    //var oldstyle = 'text-align: center; width: calc(100vw/36); font-size: 1.0vw; ';
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

    //1 empty row
    //apGUI.$spacer = document.createElement("DIV");
    //apGUI.$spacer.innerHTML = " ";
    //text area
    apGUI.$textArea = document.createElement("DIV");
    apGUI.$textArea.setAttribute('style', 'display: inline-block; text-align: left; width: 100%; background-color: #ffffff; font-size: 15px; color: #000000'); //black on white background
    //apGUI.$textArea.setAttribute('style', 'display: inline-block; text-align: left; width: 100%; color: white !important; font-size: 15px'); //white on purple
    //white !important
    //apGUI.$textArea.innerHTML = "                          ";
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
    //apGUI.$customRatios.appendChild(apGUI.$spacer);
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
        if(chosenPreset.hasOwnProperty(perkname))
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
    
    secondLine = [AutoPerks.maxZone, AutoPerks.amalGoal, AutoPerks.amalZone, AutoPerks.coordsBehind];
    
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
    
    if(secondLine == null){
        $perkRatioBoxes[5].value = 560;
        $perkRatioBoxes[6].value = 6;
        $perkRatioBoxes[7].value = 420;
        $perkRatioBoxes[8].value = 105;        
    }
    else{
        $perkRatioBoxes[5].value = secondLine[0];
        $perkRatioBoxes[6].value = secondLine[1];
        $perkRatioBoxes[7].value = secondLine[2];
        $perkRatioBoxes[8].value = secondLine[3];
    }
    
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

//green "Allocate Perks" button:
AutoPerks.clickAllocate = function() {
    if(!game.global.canRespecPerks){
        var $text = document.getElementById("textAreaAllocate");
        var msg = "A respec is needed to Auto Allocate. Try again after portal.";
        debug(msg);
        $text.innerHTML = msg;
        return;
    }
    AutoPerks.totalHelium = AutoPerks.getHelium(); //differs whether we're in the portal screen or mid run respec
    AutoPerks.gearLevels  = 1;
    AutoPerks.breedMult   = 1;
    AutoPerks.compoundingImp   = 1;
    for(var i = 1; i <= AutoPerks.maxZone * 3; i++)
        AutoPerks.compoundingImp = AutoPerks.compoundingImp * 1.003;
    
    /* most of these will be user adjustable. These weights are baseline, and each gets multiplied by their relevant benefits and multiplied again by userWeight
     * benefitStat captures how much of a stat we have, and what the change will be from increasing a perk.
     * increasing a weight by a factor of 2 means we are willing to spend twice as much helium for the same increase.
     * calculateBenefit(): each perk has its own calculateBenefit function. it calculates the relevant increases of stat(s) associated with a weight type(s)
     * looting for example, increases our helium, but also slightly increases our attack. 
     * so looting.calculateBenefit() multiplies a large increase in helium * weightHelium + a small increase in attack * weightAttack
     * finally, perk.efficiency equals perk.calculateBenefit() / perk.cost
     */

    AutoPerks.resetPerks();      // set all perks to level 0
    AutoPerks.resetBenefits();   // benefit and benefitBak = 1;
    AutoPerks.initializeAmalg(); // calculates amalgamator related variables. also pumps carp1/2/coord. doing this every allocate instead of 
                                 // on firstRun() because DG stats and helium mightve changed

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
        debug("AutoPerks: Major Error - Not enough helium to buy fixed perks.","perks");
        return false;
    }
    if (Number.isNaN(helium)) {
        debug("AutoPerks: Major Error - Helium is Not a Number!","perks");
        return false;
    }

    var perks = AutoPerks.perkHolder;

    var effQueue = new PriorityQueue(function(a,b) { return a.efficiency > b.efficiency; } ); // Queue that keeps most efficient purchase at the top
    // Calculate base efficiency of all perks
    for(var i in perks) {
        if(perks[i].isLocked || perks[i].isFixed || typeof perks[i].parent !== 'undefined') //skip unowned, fixed, and T2 perks.
            continue;
        var inc = perks[i].getBenefit();
        var price = perks[i].getPrice();
        perks[i].efficiency = inc/price;
        if(perks[i].efficiency < 0) {
            debug("Error: Perk ratios must be positive values.","perks");
            return false;
        }
        if(perks[i].efficiency > 0)
            effQueue.add(perks[i]);
    }
    if (effQueue.isEmpty()) {
        debug("All Perk Ratios were 0, or some other error.","perks");
        return false;
    }
    
    var mostEff, price, inc;
    var packPrice,packLevel;
    var i=0;
    
    //Change the way we iterate.
    function iterateQueue() {
        mostEff = effQueue.poll();
        inc = mostEff.getBenefit();
        price = mostEff.getPrice(); // Price of *next* purchase.
        mostEff.efficiency = inc / price;
        i++;
    }
    for (iterateQueue() ; !effQueue.isEmpty() ; iterateQueue() ) {
        if(mostEff.level < mostEff.max) { // check if the perk has reached its maximum value
            if (helium <= price) continue;
            //if(mostEff.name === "")
            //    debug("here");
            helium -= price;
            mostEff.buyLevel();
            mostEff.spent += price;            
            inc = mostEff.getBenefit();
            price = mostEff.getPrice(); // Price of *next* purchase.
            mostEff.efficiency = inc / price;
            
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
            effQueue.add(mostEff);  // Add back into queue run again until out of helium
        }
    }
    debug("AutoPerks2: Pass One Complete. Loops ran: " + i, "perks");
    
    var calcHe = AutoPerks.applyCalculations(true);
    if(calcHe !== helium) //this can (and will) happen due to large number rounding errors. thought about using bigInt, but since the game doesnt there's no point.
        helium = calcHe;
    
    //add T2 perks into queue
    for (var i = 0; i < AutoPerks.additivePerks.length; i++){
        if(!AutoPerks.additivePerks[i].isLocked){
            var perk = AutoPerks.additivePerks[i];
            //calc price, benefit, and efficiency
            inc =   perk.getBenefit();
            price = perk.getPrice();
            perk.efficiency = inc/price;
            effQueue.add(perk);
        }
    }

    //dump into looting2
    /*var dumpPerk = AutoPerks.perksByName["Looting_II"];
    var amt = Math.floor(1/100*(Math.sqrt(2)*Math.sqrt(dumpPerk.spent+helium+451250)-950)) - dumpPerk.level - 1; //-1 needed due to large number rounding issues
    var totalCostNew = dumpPerk.getTotalPrice(dumpPerk.level + amt);
    var packCost = totalCostNew - dumpPerk.spent;
    dumpPerk.spent += packCost;
    dumpPerk.level += amt;
    helium -= packCost;
    debug("dumped " + prettify(packCost) + " helium into " + prettify(amt) + " levels of" + dumpPerk.name, "perks");
    
    var calcHe = AutoPerks.applyCalculations(true);
    if(calcHe !== helium)
        helium = calcHe;*/

    debug("Spending remainder " + prettify(helium), "perks");
    i = 0;
    //Repeat the process for spending round 2. This spends any extra helium we have that is less than the cost of the last point of the dump-perk.
    while (!effQueue.isEmpty()) {
        mostEff = effQueue.poll();
        if (mostEff.level >= mostEff.max) continue; //check if the perk has reached its maximum value
        price = mostEff.getPrice();
        if (helium < price) continue;
        //Purchase the most efficient perk
        //when a T2 perk is most efficient, buy as many as we can afford with 1% of our total helium (min 1)
        if(typeof mostEff.parent !== 'undefined'){ //T2
            var pct = helium * 0.001;
            var extraLevels = mostEff.getBulkAmountT2(pct); //returns how many additional levels of this perk we can afford with helium. minimum 0;
            var newCost = mostEff.getTotalPrice(mostEff.level + extraLevels);
            var oldCost = mostEff.spent;
            var packPrice = newCost-oldCost;
            if(packPrice > helium){
                debug("error, can't afford " + (extraLevels - mostEff.level), "perks");
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
        // Reduce its efficiency
        inc = mostEff.getBenefit();
        price = mostEff.getPrice();
        mostEff.efficiency = inc/price;
        // Add back into queue run again until out of helium
        effQueue.add(mostEff);
        i++;
    }

    debug("AutoPerks2: Pass Two Complete. Loops ran: " + i + " Leftover Helium: " + prettify(helium),"perks");
    minMaxMi(true); //recalculate mi efficiency, and also printout amalgamator/fuel info
};

AutoPerks.applyCalculations = function(testValidOnly){
    game.global.lockTooltip = true;
    //AutoPerks.perksByName.Looting_II.level--; //sometime the game wont let us buy the level right away, but will let us buy it -1, then 1 more. weird.

    if(!game.global.canRespecPerks && !portalWindowOpen){
        debug("AutoPerks - A Respec is required but no respec available. Try again on next portal.");
        return;
    }
    //debug("AutoPerks - Respecing...", "perks");
    if(!game.global.viewingUpgrades && !portalWindowOpen) //we need some sort of screen open to do this.. right?
        viewPortalUpgrades(); //open 'view perks'
    
    //Pushes the respec button, then the Clear All button, then assigns perk points based on what was calculated.
    // *Apply calculations with respec
    if (game.global.canRespecPerks && !portalWindowOpen) {
        respecPerksAT(); //without drawing
    }
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
        benefit.calc();
    });
}

function calcBenefits(){ //calculate the benefits of raising a perk by 1 
    this.level++;
    var sum = 0;
    this.benefits.forEach((benefit) => {
        sum += benefit.calc(this.incomeFlag, this.popBreedFlag);
        benefit.takeBack();
    });
    this.level--;
    return sum;
}

function getBenefitValue(){
    return this.weightBase * (this.benefit/this.benefitBak - 1) * this.weightUser;
}

function takeBackBenefit(){
    this.benefit = this.benefitBak;
}

function benefitHeliumCalc(){
    this.benefitBak = this.benefit; //first we backup the old value (we do this even if it doesnt change, because perk will call takeBack() shortly
    var looting1 = AutoPerks.perksByName.Looting;
    var looting2 = AutoPerks.perksByName.Looting_II;
    
    this.benefit = (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level);
    
    if(isNaN(this.benefit)) {
        debug("error - Helium NaN benefit");
        return 0;
    }
    
    return this.getValue();
}

function benefitAttackCalc(incomeFlag){
    this.benefitBak = this.benefit; //first we backup the old value (we do this even if it doesnt change, because perk will call takeBack() shortly
    var power1Perk = AutoPerks.perksByName.Power;
    var power2Perk = AutoPerks.perksByName.Power_II;
    //AutoPerks.benefitHolderObj.Helium
    var income;
    if(incomeFlag) income = calcIncome();
    else income = AutoPerks.gearLevels;
    var amalBonus = game.talents.amalg.purchased ? Math.pow(1.5, AutoPerks.currAmalgamators) : (1 + 0.5*AutoPerks.currAmalgamators);
    this.benefit = (1 + 0.05*power1Perk.level) * (1 + 0.01*power2Perk.level) * income * amalBonus;
    
    if(isNaN(this.benefit)) {
        debug("error - Attack NaN benefit");
        return 0;
    }
    
    return this.getValue();
}

function benefitHealthCalc(incomeFlag, popBreedFlag){
    this.benefitBak = this.benefit; //first we backup the old value (we do this even if it doesnt change, because perk will call takeBack() shortly
    
    var resilPerk      = AutoPerks.perksByName.Resilience;
    var toughness1Perk = AutoPerks.perksByName.Toughness;
    var toughness2Perk = AutoPerks.perksByName.Toughness_II;
    
    var income, popBreed;
    if(incomeFlag) 
        income = calcIncome();
    else income = AutoPerks.gearLevels;
    if(popBreedFlag) 
        popBreed = calcPopBreed(); //TODO
    else popBreed = AutoPerks.breedMult;
    
    this.benefit = (1 + 0.05*toughness1Perk.level) * (1 + 0.01*toughness2Perk.level)*Math.pow(1.1, resilPerk.level) * income * popBreed * Math.pow(40, AutoPerks.currAmalgamators);
    
    if(isNaN(this.benefit)) {
        debug("error - Health NaN benefit");
        return 0;
    }
    
    return this.getValue();
}

function benefitFluffyCalc(){
    this.benefitBak = this.benefit; //first we backup the old value (we do this even if it doesnt change, because perk will call takeBack() shortly
    var curiousPerk = AutoPerks.perksByName.Curious;
    var cunningPerk = AutoPerks.perksByName.Cunning;
    var classyPerk  = AutoPerks.perksByName.Classy;
    var maxZone = AutoPerks.maxZone;
    var startZone = 301 - 2*classyPerk.level;
    
    var sumBenefit = 0;
    for(var zone = startZone; zone <= maxZone; zone++)
        sumBenefit += (50 + (curiousPerk.level * 30)) * (Math.pow(1.015,zone - startZone)) * (1 + (cunningPerk.level * 0.25));
    
    this.benefit = sumBenefit;
    
	if(this.benefitBak === this.benefit){
		debug("error fluff");
	}

    if(isNaN(this.benefit)) {
        debug("error - Fluffy NaN benefit");
        return 0;
    }
    
    return this.getValue();
}

function calcIncome(){
    var artisanPerk     = AutoPerks.perksByName.Artisanistry;
    var motivation1Perk = AutoPerks.perksByName.Motivation;
    var motivation2Perk = AutoPerks.perksByName.Motivation_II;
    var looting1        = AutoPerks.perksByName.Looting;
    var looting2        = AutoPerks.perksByName.Looting_II;
    
    var miningMults =   0.5 *                               //base
                        Math.pow(1.25, 60) *                //basic books
                        Math.pow(1.6, AutoPerks.maxZone-60) * //advanced books
                        2 *                                 //bounty
                        AutoPerks.compoundingImp *          //same bonus as whipimp
                        AutoPerks.basePopAtMaxZ;
                        
    var staffMult = 15;
    var gatheredResources = 1e36*((1 + 0.05*motivation1Perk.level) * (1 + 0.01*motivation2Perk.level))*miningMults*staffMult; //benefit from miners
    var lootedToGatheredRatio = 1/20000000; //TODO: calculate based on base zone drop
    var spireBonus = 10 * Math.floor((AutoPerks.maxZone - 100) / 100) * (1 + (game.talents.stillRowing.purchased ? 0.03 : 0.02));
    
    //var baseZoneLoot =  //TODO
    var lootedResources = lootedToGatheredRatio * AutoPerks.compoundingImp * spireBonus * staffMult * (1 + 0.05*looting1.level) * (1 + 0.0025*looting2.level);
    var totalResources = gatheredResources + lootedResources;
    //TODO: we can calculate prestige/gearcost/how much 1 level of every gear costs once per button click.
    var prestiges = Math.floor(AutoPerks.maxZone/10)*2+3; //roundup to next xx5 zone for prestige
    var baseCost = (2+3+4+7+9+15) * Math.pow(0.95, artisanPerk.level);
    var prestigeMod = (prestiges - 3) * 0.85 + 2;
    var gearCost = baseCost * Math.pow(1.069, prestigeMod * game.global.prestige.cost + 1); //hopefully this is the cost of all gear at max prestige level 1
    //now lets see how many levels we can afford
    var level = Math.log(totalResources/gearCost) - Math.log(1.2) - 4;
    if(level < 1) level = 1;

    AutoPerks.gearLevels = level;
    return AutoPerks.gearLevels;
}

function calcPopBreed(){
    //we want the value of breeding translated into health. 
    //this accounts for coordination (army size), carp1/2 (pop size), and breeding
    var coordPerk = AutoPerks.perksByName.Coordinated;
    var pheroPerk = AutoPerks.perksByName.Pheromones;
    var finalArmySize =  calcCoords(AutoPerks.maxZone+99, coordPerk.level) * Math.pow(1000, AutoPerks.currAmalgamators);
    var finalPopSize  =  popMultiplier() * //carp1/2
                         AutoPerks.basePopAtMaxZ;
    AutoPerks.breed =   0.0085        //base
                        * finalPopSize/2
                        * Math.pow(1.1, Math.floor(AutoPerks.maxZone / 5)) //potency
                        * AutoPerks.compoundingImp
                        * 0.1           //broken planet
                        * (1 + 0.1*pheroPerk.level);
    //TODO: add nurseries based on income
    
    //AutoPerks.breed is how many trimps are bred each second before nurseries and geneticists.
    var desiredAmalMult = (finalArmySize / 45) / AutoPerks.breed;
    var geneticists = Math.floor(Math.log(desiredAmalMult) / Math.log(0.98));
    var genHealthBonus = Math.pow(1.01, geneticists);
    //debug(geneticists+" " + genHealthBonus.toFixed(0));
    AutoPerks.breedMult = genHealthBonus;
    return AutoPerks.breedMult;
}

function benefitDGCalc(){
    this.benefitBak = this.benefit; //first we backup the old value (we do this even if it doesnt change, because perk will call takeBack() shortly

    //when we change DG perks, we potentially change the amount of Mi we get and DG growth. if Mi changed we need to recalculate AutoPerks.benefitDG
    //var miBefore = AutoPerks.totalMi;
    var miPerRun = minMaxMi(); //calculates maximum Mi using carp1/carp2/coordinated to maintain amalgamator goal
    //if(miBefore !== miPerRun)
        this.benefit = MiToDGGrowth(miPerRun); //mi changed, update benefit
    
    if(isNaN(this.benefit)) {
        debug("error - DG NaN benefit");
        return 0;
    }
    
    return this.getValue();
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
        //AutoPerks.benefitHolder[i].weightUser   = 1;
        AutoPerks.benefitHolder[i].takeBack     = takeBackBenefit; //benefitBak -> benefit
        AutoPerks.benefitHolder[i].getValue     = getBenefitValue; //weightBase * benefit * weightUser
        AutoPerks.benefitHolder[i].benefitBak   = AutoPerks.benefitHolder[i].benefit;
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
    AutoPerks.amalZoneCalculated = AutoPerks.amalZone;
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //max possible fuel
    AutoPerks.basePopArr = [];
    for (AutoPerks.fuelMaxZones = 0; AutoPerks.fuelMaxZones <= AutoPerks.amalZone - 230; AutoPerks.fuelMaxZones+= AutoPerks.FuelZoneCutoff){
        AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)] = calcBasePop();
    }
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //max possible fuel
    return AutoPerks.basePopArr;
}

//base pop only depends on DG stats and fuel zones.
function calcBasePop(){
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
    AutoPerks.totalFuelGathered = 0;
    
    var popTick = Math.floor(Math.sqrt(fuelCapacity)* 500000000 * (1 + 0.1*eff) * OCEff);
    
    for (var i = AutoPerks.fuelStartZone; i <  AutoPerks.amalZone; i++){
        pop *= 1.009; //tauntimp average increase
        
        if(i <  AutoPerks.fuelEndZone){
            var fuelFromMagmaCell = Math.min(0.2 + (i-230) * 0.01, supMax);
            var fuelFromZone = magmaCells * fuelFromMagmaCell;
            currFuel += fuelFromZone;
            AutoPerks.totalFuelGathered += fuelFromZone;
            if(currFuel > 2*fuelCapacity){
                var ticks = Math.ceil((currFuel - 2*fuelCapacity) / burn);
                pop += ticks * popTick;
                currFuel -= burn * ticks;
            }
        }
    }
    
    return Math.floor(pop);
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

function getAmalFinal(){
    AutoPerks.endPopAtAmalZ = AutoPerks.basePopAtAmalZ * AutoPerks.popMult;
    return AutoPerks.endPopAtAmalZ / AutoPerks.finalArmySize / AutoPerks.amalMultPre / AutoPerks.RatioToAmal;
}

function findStartEndFuel(){
    AutoPerks.fuelStartZone = Math.max(230, 320 - Math.ceil(AutoPerks.fuelMaxZones/2));
    AutoPerks.fuelEndZone = Math.min(AutoPerks.amalZone, AutoPerks.fuelStartZone + AutoPerks.fuelMaxZones - 1);
    AutoPerks.totalMi = (game.talents.magmaFlow.purchased ? 18 : 16) * (AutoPerks.maxZone - 230 - AutoPerks.fuelMaxZones);
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
    secondLine = [AutoPerks.maxZone, AutoPerks.amalGoal, AutoPerks.amalZone, AutoPerks.coordsBehind];//update the boxes
    AutoPerks.updateFromBoxes();                                                                     //update the boxes
    
    //amal calc
    AutoPerks.clearedSpiresBonus = Math.min(4, Math.floor((AutoPerks.amalZone - 200) / 100));
    AutoPerks.RatioToAmal = Math.pow(10, 10-AutoPerks.clearedSpiresBonus);
    
    //army calc
    AutoPerks.coordsUsed = AutoPerks.amalZone+100-AutoPerks.coordsBehind-1;
    
    //step 1: find max amalgamators we can afford. calculate carp1/2/coordinated along the way
    var carp1perk = AutoPerks.perksByName.Carpentry;
    var carp2perk = AutoPerks.perksByName.Carpentry_II;
    var coordperk = AutoPerks.perksByName.Coordinated;
    var pct = (carp1perk.spent + carp2perk.spent + coordperk.spent) / AutoPerks.totalHelium * 100;
    AutoPerks.currAmalgamators = 0;
    var carp1 = 0;
    var carp2 = 0;
    var coordinated = 0;
    var carp1cost = 0;
    var carp2cost = 0;
    var coordinatedcost = 0;
    //debug("Using zone: " + AutoPerks.amalZone + " Coords behind: " + AutoPerks.coordsBehind);
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230; //max possible fuel
    
    //calcBasePop only needs to be calculated once for each AutoPerks.fuelMaxZones and AutoPerks.amalZone
    //we can save the results and pull the previously calculated values for speed
    AutoPerks.amalZoneCalculated = AutoPerks.amalZone;
    calcBasePopArr();
    
    var $text = document.getElementById("textAreaAllocate");
    var finalMsg = '';
    
    AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)];
    while(AutoPerks.currAmalgamators <= AutoPerks.amalGoal){
        AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
        
        AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated
        AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
        AutoPerks.finalAmalRatio = getAmalFinal();
        while(AutoPerks.finalAmalRatio < 1 && pct < AutoPerks.MAXPCT){
            //we cant reach our amalgamators, so increase carp1/coordinated/carp2 until we can
            //increase carp1
            var price = carp1perk.getPrice();
            carp1perk.buyLevel();
            carp1perk.spent+= price;
            var pct = (carp1perk.spent + carp2perk.spent + coordperk.spent) / AutoPerks.totalHelium * 100;
            AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
            AutoPerks.finalAmalRatio = getAmalFinal();
            if(AutoPerks.finalAmalRatio >= 1 || pct >= AutoPerks.MAXPCT)
                break;
            //if coordinated level costs less than double carp level, buy coord TODO: use exact efficiency increase
            var price2 = coordperk.getPrice();
            if(price2 < 2*price){
                coordperk.buyLevel();
                coordperk.spent+= price2;
                var pct = (carp1perk.spent + carp2perk.spent + coordperk.spent) / AutoPerks.totalHelium * 100;
                AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated
                AutoPerks.finalAmalRatio = getAmalFinal();
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

            var pct = (carp1perk.spent + carp2perk.spent + coordperk.spent) / AutoPerks.totalHelium * 100;
            AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
            AutoPerks.finalAmalRatio = getAmalFinal();
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
                
            var msg = "Amalgamator #"+AutoPerks.currAmalgamators+" found. Carp1: " + carp1perk.level + " Carp2: " + carp2perk.level.toExponential(2) + " Coordinated: " + coordperk.level + " "+pct.toFixed(2)+"% of total helium used.";
            //var msg = "Amalgamator #"+AutoPerks.currAmalgamators+" found. "+pct.toFixed(2)+"% of total helium used.";
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
    
    $text.innerHTML = finalMsg;
    AutoPerks.basePopAtMaxZ  = AutoPerks.basePopAtAmalZ * Math.pow(1.009, AutoPerks.maxZone-AutoPerks.amalZone);
    if(AutoPerks.currAmalgamators < 0) AutoPerks.currAmalgamators = 0;
    AutoPerks.amalMultPre = Math.pow(1000, AutoPerks.currAmalgamators-1);
    
    carp1perk.level = carp1;
    carp2perk.level = carp2;
    coordperk.level = coordinated;
    carp1perk.spent = carp1cost;
    carp2perk.spent = carp2cost;
    coordperk.spent = coordinatedcost;
};

function minMaxMi(print, maxFuel){
    //for a given carp1/2/coordinated/amalgamator, figure out min fuel zones in jumps of 10
    AutoPerks.popMult = popMultiplier(); //pop calc, uses carp1/2
    AutoPerks.finalArmySize = calcCoords(AutoPerks.coordsUsed); //uses coordinated
    AutoPerks.fuelMaxZones = AutoPerks.amalZone - 230;
    //var maxFuel = true;
    if(!maxFuel){
        var maxLoops = 500;
        while(maxLoops--){
            if(AutoPerks.fuelMaxZones <= 10) break;
            AutoPerks.fuelMaxZones -= AutoPerks.FuelZoneCutoff;
            AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)]; //must be called before every getAmalFinal()
            AutoPerks.finalAmalRatio = getAmalFinal();
            if(AutoPerks.finalAmalRatio < 1){ //below threshold, undo last
                AutoPerks.fuelMaxZones += AutoPerks.FuelZoneCutoff;
                AutoPerks.basePopAtAmalZ = AutoPerks.basePopArr[Math.floor(AutoPerks.fuelMaxZones / AutoPerks.FuelZoneCutoff)]; //must be called before every getAmalFinal()
                AutoPerks.finalAmalRatio = getAmalFinal();
                break;
            }
        }
    }
    AutoPerks.basePopAtMaxZ  = AutoPerks.basePopAtAmalZ * Math.pow(1.009, AutoPerks.maxZone-AutoPerks.amalZone);
    
    findStartEndFuel(); //updates start zone, end zone and Mi
    
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
            fluffyXP += xpCount
            xpCount *= 5;
        }
        var fluffyGrowth = (AutoPerks.benefitHolderObj.Fluffy.benefit*100 / fluffyXP).toFixed(4) + "%";
        var heliumGrowth = AutoPerks.totalHelium;
        //var msg5 = "Fluffy Growth / Run: " + fluffyGrowth;
        var msg2 = "Start Fuel: " + AutoPerks.fuelStartZone + " End Fuel: " + AutoPerks.fuelEndZone + " Pop/Army Goal: " + AutoPerks.finalAmalRatio.toFixed(2) + " Fluffy Growth / Run: " + fluffyGrowth + " DG Growth/Run " + (AutoPerks.DGGrowthRun*100).toFixed(3) + "% ("+AutoPerks.totalMi + " Mi)";
        var msg3 = "";
        for(var i = 0; i < AutoPerks.benefitHolder.length; i++)
            msg3 += AutoPerks.benefitHolder[i].benefit.toExponential(2) + " ";
        var msg4 = "Gear levels: " + AutoPerks.gearLevels;
        var $text = document.getElementById("textAreaAllocate");
        //$text.innerHTML += msg2 + '<br>' + msg3 + '<br>' + msg4 + '<br>' + msg5;
        $text.innerHTML += msg2;
        
        //debug(msg1);
        debug(msg2);
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
function printBenefitsPerks(){
    for(var i = 0; i < AutoPerks.benefitHolder.length; i++)
        debug(AutoPerks.benefitHolder[i].getValue());
    for(var i = 0; i < AutoPerks.perkHolder.length; i++){
        if(AutoPerks.perkHolder[i].isFixed) continue;
        debug(AutoPerks.perkHolder[i].name + " " + AutoPerks.perkHolder[i].getBenefit());
    }
}

//we care about DG growth, not straight Mi numbers, so convert the two based off how fast we can expect our DG to grow.
function MiToDGGrowth(MiPerRun){
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
    //if(runsForUpgrade === 0 || isNaN(runsForUpgrade))
    //    debug(runsForUpgrade);
    return runsForUpgrade;
}

AutoPerks.firstRun = function(){
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