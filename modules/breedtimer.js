//Add breeding box (to GUI on startup):
var addbreedTimerInsideText;
function addBreedingBoxTimers() {
    var breedbarContainer = document.querySelector('#trimps > div.row');
    var addbreedTimerContainer = document.createElement("DIV");
    addbreedTimerContainer.setAttribute('class', "col-xs-11");
    addbreedTimerContainer.setAttribute('style', 'padding-right: 0;');
    addbreedTimerContainer.setAttribute("onmouseover", 'tooltip(\"Hidden Next Group Breed Timer\", \"customText\", event, \"How long your next army has been breeding for, or how many anticipation stacks you will have if you send a new army now. This number is what BetterAutoFight #4 refers to when it says NextGroupBreedTimer.\")');
    addbreedTimerContainer.setAttribute("onmouseout", 'tooltip("hide")');
    var addbreedTimerInside = document.createElement("DIV");
    addbreedTimerInside.setAttribute('style', 'display: block;');
    var addbreedTimerInsideIcon = document.createElement("SPAN");
    addbreedTimerInsideIcon.setAttribute('class', "icomoon icon-clock");
    addbreedTimerInsideText = document.createElement("SPAN"); //updated in the top of ATLoop() each cycle
    addbreedTimerInsideText.id = 'hiddenBreedTimer';
    addbreedTimerInside.appendChild(addbreedTimerInsideIcon);
    addbreedTimerInside.appendChild(addbreedTimerInsideText);
    addbreedTimerContainer.appendChild(addbreedTimerInside);
    breedbarContainer.appendChild(addbreedTimerContainer);
}
addBreedingBoxTimers();

//Add GUI popup for hovering over the army group size and translate that to breeding time
function addToolTipToArmyCount() {
    var $armycount = document.getElementById('trimpsFighting');
    $armycount.setAttribute("onmouseover", 'tooltip(\"Army Count\", \"customText\", event, \"To Fight now would add: \" + prettify(getArmyTime()) + \" seconds to the breed timer.\")');
    $armycount.setAttribute("onmouseout", 'tooltip("hide")');
    $armycount.setAttribute("class", 'tooltipadded');
}
addToolTipToArmyCount();

function manualGeneticists(){ //replaced by breedAT()
    var desiredBreedTime = handleGA(true);
    var armySize = game.portal.Coordinated.currentSend * Math.pow(1000, game.jobs.Amalgamator.owned);
    var breed =   0.0085        //how many trimps are bred each second before geneticists.
            * trimpsRealMax / 2
            * Math.pow(1.1, game.upgrades.Potency.done) //potency
            * Math.pow(1.003, game.unlocks.impCount.Venimp)
            * (game.global.world >= 60 ? 0.1 : 1)       //broken planet
            * (1 + 0.1*game.portal["Pheromones"].level)
            * Math.pow(1.01, game.buildings.Nursery.owned);
            //* AutoPerks.DailyBreedingMult; //toxic daily modifier

    var desiredBreedRate = (armySize / desiredBreedTime) / breed; //breed per sec
    var geneticists = Math.floor(Math.log(desiredBreedRate) / Math.log(0.98)); //geneticists amount
    var delta = geneticists - game.jobs.Geneticist.owned;
    if(delta > 0) safeBuyJob("Geneticist", delta);
    else if(delta < 0) safeFireJob("Geneticist", -delta);
}

function breedAT(){
     var trimps = game.resources.trimps;

    var maxBreedable = new DecimalBreed(trimpsRealMax).minus(trimps.employed);
    var decimalOwned = missingTrimps.add(trimps.owned);
    var breeding = decimalOwned.minus(trimps.employed);
if (breeding.cmp(2) == -1 || game.global.challengeActive == "Trapper") {
    return;
    }
    var potencyMod = new DecimalBreed(trimps.potency);
    //Add potency (book)
    if (game.upgrades.Potency.done > 0) potencyMod = potencyMod.mul(Math.pow(1.1, game.upgrades.Potency.done));
    //Add Nurseries
    if (game.buildings.Nursery.owned > 0) potencyMod = potencyMod.mul(Math.pow(1.01, game.buildings.Nursery.owned));
    //Add Venimp
    if (game.unlocks.impCount.Venimp > 0) potencyMod = potencyMod.mul(Math.pow(1.003, game.unlocks.impCount.Venimp));
    //Broken Planet
    if (game.global.brokenPlanet) potencyMod = potencyMod.div(10);
    //Pheromones
    potencyMod = potencyMod.mul(1+ (game.portal.Pheromones.level * game.portal.Pheromones.modifier));

    //Quick Trimps
    if (game.singleRunBonuses.quickTrimps.owned) potencyMod = potencyMod.mul(2);
    //Challenges
    if (game.global.challengeActive == "Daily"){
        if (typeof game.global.dailyChallenge.dysfunctional !== 'undefined'){
            potencyMod = potencyMod.mul(dailyModifiers.dysfunctional.getMult(game.global.dailyChallenge.dysfunctional.strength));
        }
        if (typeof game.global.dailyChallenge.toxic !== 'undefined'){
            potencyMod = potencyMod.mul(dailyModifiers.toxic.getMult(game.global.dailyChallenge.toxic.strength, game.global.dailyChallenge.toxic.stacks));
        }
    }
    if (game.global.challengeActive == "Toxicity" && game.challenges.Toxicity.stacks > 0){
        potencyMod = potencyMod.mul(Math.pow(game.challenges.Toxicity.stackMult, game.challenges.Toxicity.stacks));
    }
    if (game.global.voidBuff == "slowBreed"){
        potencyMod = potencyMod.mul(0.2);
    } 
    potencyMod = calcHeirloomBonusDecimal("Shield", "breedSpeed", potencyMod);
    //console.log(getDesiredGenes(potencyMod.toNumber()));

    //Geneticist
    if (game.jobs.Geneticist.owned > 0) potencyMod = potencyMod.mul(Math.pow(.98, game.jobs.Geneticist.owned));

    breeding = potencyMod.mul(breeding);
    potencyMod = potencyMod.div(10).add(1);
    var timeRemaining = DecimalBreed.log10(maxBreedable.div(decimalOwned.minus(trimps.employed))).div(DecimalBreed.log10(potencyMod)).div(10);

    //Calculate full breed time
    var currentSend = game.resources.trimps.getCurrentSend();
    var totalTime = DecimalBreed.log10(maxBreedable.div(maxBreedable.minus(currentSend))).div(DecimalBreed.log10(potencyMod)).div(10);
    //breeding, potencyMod, timeRemaining, and totalTime are DecimalBreed

    var target = new Decimal(handleGA(true));
    var now = new Date().getTime();

    var thresh = new DecimalBreed(totalTime.mul(0.02));
    var compareTime;
    if (timeRemaining.cmp(1) > 0 && timeRemaining.cmp(target.add(1)) > 0){
        compareTime = new DecimalBreed(timeRemaining.add(-1));
    }
    else {
        compareTime = new DecimalBreed(totalTime);
    }
    if (!thresh.isFinite()) thresh = new Decimal(0);
    if (!compareTime.isFinite()) compareTime = new Decimal(999);
    var genDif = new DecimalBreed(Decimal.log10(target.div(compareTime)).div(Decimal.log10(1.02))).ceil();

    if (compareTime.cmp(target) < 0) {
        if (game.resources.food.owned * 0.01 < getNextGeneticistCost()){
        }
        else if (timeRemaining.cmp(1) < 0 || target.minus((now - game.global.lastSoldierSentAt) / 1000).cmp(timeRemaining) > 0){
            if (genDif.cmp(0) > 0){
                if (genDif.cmp(10) > 0) genDif = new Decimal(10);
                addGeneticist(genDif.toNumber());
            }
        }
    }
    else if (compareTime.add(thresh.mul(-1)).cmp(target) > 0  || (potencyMod.cmp(1) == 0)){
        if (!genDif.isFinite()) genDif = new Decimal(-1);
        if (genDif.cmp(0) < 0 && game.options.menu.gaFire.enabled != 2){
            if (genDif.cmp(-10) < 0) genDif = new Decimal(-10);
            removeGeneticist(genDif.abs().toNumber());
        }
    }   
    return;
}


function getDesiredGenes(ovr, weirdNum12){
    var breed_speed = 0.00085 * Math.pow(1.1,game.upgrades.Potency.done) * Math.pow(1.01,game.buildings.Nursery.owned) * (1 + 0.1*game.portal.Pheromones.level) * Math.pow(1.003,game.unlocks.impCount.Venimp);
    var maxGenes = (Math.floor(Math.log(weirdNum12 * breed_speed * game.resources.trimps.owned / game.resources.trimps.soldiers) / -Math.log(0.98)));
    return maxGenes;
}

function handleGA(currentGame, dailyObj){
    var theDailyObj = currentGame ? game.global.dailyChallenge  : dailyObj;
    var C2name      = currentGame ? game.global.challengeActive : AutoPerks.ChallengeName;
    var zone        = currentGame ? game.global.world           : autoTrimpSettings.APValueBoxes.maxZone;
    
    if(zone < 71) return 0;
    
    var GATimer = (game.talents.patience.purchased ? 45 : 30);
    
    if (typeof theDailyObj.bogged != 'undefined' || C2name == "Nom" || C2name == "Toxicity"){ //fixed %dmg taken every attack
        var stacks = 0;
        if (C2name == "Nom" || C2name == "Toxicity")
            stacks = 5;
        else
            stacks = theDailyObj.bogged.strength;
        GATimer = Math.floor(100/(attacksPerSecondAT*stacks));
    }
    if (typeof theDailyObj.plague != 'undefined' || C2name == "Electricity"){ //%dmg taken per stack, 1 stack every attack
        var stacks = 0;
        if(typeof theDailyObj.plague != 'undefined')
            stacks = theDailyObj.plague.strength;
        else
            stacks = game.challenges.Electricity.stacks;
        switch(stacks){
            case 1:
                GATimer = 3;
                break;
            case 2:
            case 3:
                GATimer = 2;
                break
            default:
                GATimer = 1;
        }
    }
    
    if(currentGame && !getPageSetting('GASetting') && getPageSetting('GASettingManual') > 0) //manual input
        GATimer = getPageSetting('GASettingManual');
    
    if(((currentGame && isActiveSpireAT()) || (!currentGame && zone >= 200 && zone % 100 === 0)) && getPageSetting('GASettingSpire') > 0) //spire manual input
        GATimer = getPageSetting('GASettingSpire');

    if(currentGame && game.global.Geneticistassist && GATimer > 0){
        game.global.GeneticistassistSteps = [-1, 0.5, 0.6, GATimer];
        switchOnGA(); //under normal uses getTargetAntiStack should turn autoGA back on, but if loading from a save it could stay off
    }
    
    return GATimer;
}