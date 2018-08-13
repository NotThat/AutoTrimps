//MODULES["upgrades"] = {};
var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency', 'Magmamancers'];
var buyCoords = true;

function buyUpgradesCaller(){
    /*var temp = highDamageHeirloom;
    if(goodShieldActuallyEquipped) equipMainShield();
    else equipLowDmgShield();
    calcBaseDamageinS();*/
    
    buyUpgrades();
    
    /*if(temp) equipMainShield();
    else equipLowDmgShield();
    calcBaseDamageinS();
    updateAllBattleNumbers(true);*/
}

//Buys all available non-equip upgrades listed in var upgradeList
function buyUpgrades() {
    //debug("buyUpgrades buyWeaponsMode " + buyWeaponsMode + " baseDamage " + baseDamage.toExponential(2));
    if (getPageSetting('BuyUpgradesNew') != 2){ //skip this calculation if AT isnt allowed to buy coords
        var popArmyRatio = game.resources.trimps.realMax()/game.resources.trimps.getCurrentSend();    
        buyCoords = true;
        
        if(getPageSetting('AutoStance') && getPageSetting('DelayCoordsForWind')){
            if(!allowBuyingCoords){ //only buy coords if autostance3 allows it
                if(game.upgrades.Coordination.done < maxCoords)
                    buyCoords = true;
                else
                    buyCoords = false;

                var stackSpire = (game.global.world == 500) && ((getPageSetting('StackSpire4') == 1 && game.global.challengeActive == "Daily") || getPageSetting('StackSpire4') == 2) && (game.global.spireDeaths <= 5);
                if (((isActiveSpireAT() || PRaidingActive) && !stackSpire) || game.global.world == getPageSetting('VoidMaps') || BWRaidNowLogic()) //always want all coords for active spires and void maps
                    buyCoords = true;
            }

            if(AutoMapsCoordOverride) //we dont want to farm maps for damage when we have unspent coordinations, so allow automaps to override AS
                buyCoords = true;
        }
        
        if(game.global.runningChallengeSquared)
            buyCoords = true;
        
        if(popArmyRatio < 1350){ //we're dangerously close to losing amalgamator
            var coordinationMult = 1+0.25*Math.pow(0.98, game.portal.Coordinated.level);
            var currentSendAfter = game.resources.trimps.getCurrentSend()*coordinationMult;
            var popArmyRatioAfter = game.resources.trimps.realMax()/currentSendAfter;
            if (popArmyRatioAfter <= 1001){
                debug("Skipping coordination to preserve Amalgamator!");
                buyCoords = false;
            }
        }
        
        var dontBuyStartZ = getPageSetting('NoCoordBuyStartZ');
        if(dontBuyStartZ == game.global.world + 1)
            buyCoords = true;
        else if (dontBuyStartZ > 0 && game.global.world > dontBuyStartZ && getPageSetting('TillWeHaveAmalg') > 0) { //if dontBuyStartZ is set and we've passed it
            if (game.jobs.Amalgamator.owned < getPageSetting('TillWeHaveAmalg'))
                buyCoords = false;
        }
        if (game.global.challengeActive == "Trapper") //no amalgamators in trapper
            buyCoords = true;
    }
    
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
        if (upgrade == 'Coordination' && (getPageSetting('BuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;
        if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
        if (upgrade == 'Gigastation' && (game.global.lastWarp ? game.buildings.Warpstation.owned < (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')) : game.buildings.Warpstation.owned < getPageSetting('FirstGigastation'))) continue;
        //skip bloodlust during scientist challenges and while we have autofight enabled.
        if (upgrade == 'Bloodlust' && game.global.challengeActive == 'Scientist') continue;
        //skip potency when autoBreedTimer is disabled
        if (upgrade == 'Potency' && getPageSetting('GeneticistTimer') >= 0) continue;

        //Main logics:
        if (!available) continue;
        if (game.upgrades.Scientists.done < game.upgrades.Scientists.allowed && upgrade != 'Scientists') continue;
        
        if (upgrade == 'Coordination'){
            //need to make sure next coordination wont fire amalgamator
            if(buyCoords)
                buyUpgrade(upgrade, true, true);
        }
        else
            buyUpgrade(upgrade, true, true);
        debug('Upgraded ' + upgrade, "upgrades", "*upload2");
    //loop again.
    }
}