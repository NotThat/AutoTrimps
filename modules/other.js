MODULES["other"] = {};
MODULES["other"].enableRoboTrimpSpam = true;  //set this to false to stop Spam of "Activated Robotrimp MagnetoShriek Ability"
var bwraided = false;
var failbwraid = false;
var cost = (updateMapCost(true));


function autoRoboTrimp() {
    if (game.global.roboTrimpCooldown > 0 || !game.global.roboTrimpLevel) return;
    var robotrimpzone = parseInt(getPageSetting('AutoRoboTrimp'));
    if (robotrimpzone == 0) return;
    //activate the button when we are above the cutoff zone, and we are out of cooldown (and the button is inactive)
    if (game.global.world >= robotrimpzone && !game.global.useShriek && (game.global.world - robotrimpzone) % 5 === 0)
        magnetoShriek();
}

function autoGoldenUpgradesAT(){
    var setting = getPageSetting('AutoGoldenUpgrades');
    if(setting === 'Off') return;
    
    var initialLock = game.options.menu.lockOnUnlock.enabled;
    game.options.menu.lockOnUnlock.enabled = 0;
    while(getAvailableGoldenUpgrades() > 0){
        var what = "";
        if(!game.global.runningChallengeSquared && getPageSetting('MaxVoid')   && game.goldenUpgrades.Void.nextAmt() != 0.12 && buyGoldenUpgrade("Void")) continue;
        else if(game.global.runningChallengeSquared  && getPageSetting('MaxVoidC2') && game.goldenUpgrades.Void.nextAmt() != 0.12 && buyGoldenUpgrade("Void")) continue;
        else if(game.global.runningChallengeSquared || setting === "Battle") what = "Battle";
        else if (setting === "Helium") what = "Helium";
        else{ //'Match Perks' mode: aim to buy Helium/Battle at a ratio that matches our perk setup
            var helCurrMult  = game.goldenUpgrades.Helium.currentBonus + 1;
            var batCurrMult  = game.goldenUpgrades.Battle.currentBonus + 1;
            //var helNextBonus = game.goldenUpgrades.Helium.nextAmt();
            //var batNextBonus = game.goldenUpgrades.Battle.nextAmt();
            
            var helAtkGURatio = helCurrMult / batCurrMult;
            
            var looting = game.portal["Looting"].level;
            var power   = game.portal["Power"].level;
            
            var helBenefit  = ((1 + 0.05*(looting+1)) * (1 + 0.0025*(looting+1))) / ((1 + 0.05*looting) * (1 + 0.0025*looting)) - 1; //relative helium increase from 1 more looting1 level
            var atkBenefit  = ((1 + 0.05*(power+1)) * (1 + 0.01*(power+1))) / ((1 + 0.05*power) * (1 + 0.01*power)) - 1; //relative damage increase from 1 more power1 level
            var helCost     = Math.ceil(looting/2 + 1 * Math.pow(1.3, looting)); //looting1 cost
            var atkCost     = Math.ceil(power/2 + 1 * Math.pow(1.3, power)); //power1 cost
            var helEff      = helBenefit / helCost; //looting efficiency
            var atkEff      = atkBenefit / atkCost; //power efficiency
            var helAtkRatio = atkEff / helEff; //how many times we like helium better than attack
            
            debug("Auto GU: Helium / Attack Perk Ratio: " + helAtkRatio.toFixed(2) + " GU Ratio: " + helAtkGURatio.toFixed(2), "GU");
            if(helAtkGURatio > helAtkRatio){
                debug("Match Perks GU: Buying Battle GU", "GU");
                what = "Battle";
            }
            else what = "Helium";
        }
        
        try{
            if(!(what === "Helium" || what === "Battle" || what === "Void"))
                throw "buying Golden upgrade: " + what + " unknown GU type";
            
            if(!buyGoldenUpgrade(what))
                throw "General Golden Upgrade error - " + what;
        }
        catch(err){
            debug("Golden Upgrade Critical Error! Failed to buy " + what + " upgrade. z " + game.global.world + " getAvailableGoldenUpgrades() = " + getAvailableGoldenUpgrades());
            break;
        }
    }
    game.options.menu.lockOnUnlock.enabled = initialLock;
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

function fightManualAT(){
    //run a check to see how much health we'll have if we attack now, and compare it to enemy health. if its not looking good only fight when we have full pop.
    if(game.resources.trimps.owned/trimpsRealMax < 1){
        var nextArmyHealth = calcCurrSendHealth(true, false, game.global.world);
        var enemyDamage    = currEnemyDamage();
        
        if(nextArmyHealth/enemyDamage < 1000) return;
    }
    
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
