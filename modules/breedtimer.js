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

function manualGeneticists(){
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
    if (typeof theDailyObj.bogged != 'undefined' || C2name == "Nom"){ //fixed %dmg taken every attack
        var stacks = 0;
        if (C2name == "Nom")
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

    if(getPageSetting('GASetting') && currentGame && game.global.Geneticistassist && GATimer > 0 && game.global.Geneticistassist)
        game.global.GeneticistassistSteps = [-1, 0.5, 0.6, GATimer];

    if(getPageSetting('GASetting') && currentGame)
        switchOnGA(); //under normal uses getTargetAntiStack should turn autoGA back on, but if loading from a save it could stay off
    
    return GATimer;
}