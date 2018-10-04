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

function handleGA(){
    if(game.global.world < 71 || !game.global.Geneticistassist)
        return;
    
    var GATimer = -1;
    if(getPageSetting('GASetting')){ //AT controls GA timer
        GATimer = (game.talents.patience.purchased ? 45 : 30);
        if (typeof game.global.dailyChallenge.bogged != 'undefined' || game.global.challengeActive == "Nom"){ //fixed %dmg taken every attack
            var stacks = 0;
            if (game.global.challengeActive == "Nom")
                stacks = 5;
            else
                stacks = game.global.dailyChallenge.bogged.strength;
            GATimer = Math.floor(100/(4*stacks));
        }
        if (typeof game.global.dailyChallenge.plague != 'undefined' || game.global.challengeActive == "Electricity"){ //%dmg taken per stack, 1 stack every attack
            var stacks = 0;
            if(typeof game.global.dailyChallenge.plague != 'undefined')
                stacks = game.global.dailyChallenge.plague.strength;
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
    }
    else if(getPageSetting('GASettingManual') > 0) //manual input
        GATimer = getPageSetting('GASettingManual');
    
    if(isActiveSpireAT() && getPageSetting('GASettingSpire') > 0) //spire manual input
        GATimer = getPageSetting('GASettingSpire');
    if(game.global.Geneticistassist && GATimer > 0)
        game.global.GeneticistassistSteps = [-1, 0.5, 0.6, GATimer];

    switchOnGA(); //under normal uses getTargetAntiStack should turn autoGA back on, but if loading from a save it could stay off
}