//MODULES["upgrades"] = {};
var upgradeList = ['Miners', 'Scientists', 'Coordination', 'Speedminer', 'Speedlumber', 'Speedfarming', 'Speedscience', 'Speedexplorer', 'Megaminer', 'Megalumber', 'Megafarming', 'Megascience', 'Efficiency', 'TrainTacular', 'Trainers', 'Explorers', 'Blockmaster', 'Battle', 'Bloodlust', 'Bounty', 'Egg', 'Anger', 'Formations', 'Dominance', 'Barrier', 'UberHut', 'UberHouse', 'UberMansion', 'UberHotel', 'UberResort', 'Trapstorm', 'Gigastation', 'Shieldblock', 'Potency', 'Magmamancers'];

//Buys all available non-equip upgrades listed in var upgradeList
function buyUpgrades() {
    if (getPageSetting('BuyUpgradesNew') != 2){ //skip this calculation if AT isnt allowed to buy coords
        var popArmyRatio = game.resources.trimps.realMax()/game.resources.trimps.getCurrentSend();    
        var buyCoords = true;
        if(popArmyRatio < 1350 ){ //skip this calculation unless we're dangerously close to losing amalgamator
            var coordinatedLevel = game.portal.Coordinated.level;
            var coordinationMult = 1+0.25*Math.pow(0.98, coordinatedLevel);
            var currentSendAfter = game.resources.trimps.getCurrentSend()*coordinationMult;
            var popArmyRatioAfter = game.resources.trimps.realMax()/currentSendAfter;
            //debug("popArmyRatio = " + popArmyRatio);
            //debug("popArmyRatioAfter = " + popArmyRatioAfter);
            if (popArmyRatioAfter <= 1001){
                debug("Skipping coordination to preserve Amalgamator!");
                buyCoords = false;
            }
        }
        var dontBuyStartZ = getPageSetting('NoCoordBuyStartZ');
        
        if(!allowBuyingCoords){ //if autostance3 is on and we're in windstack zones, only buy coords if autostance3 allows it.
            if(game.upgrades.Coordination.done < maxCoords)
                buyCoords = true;
            else
                buyCoords = false;
            
            if (game.global.world == 500) //always want all coords for spire4
                buyCoords = true;
        }
        
        if (dontBuyStartZ > 0 && dontBuyStartZ <= game.global.world && getPageSetting('TillWeHaveAmalg') > 0) { //if dontBuyStartZ is set and we've passed it
            if (game.jobs.Amalgamator.owned < getPageSetting('TillWeHaveAmalg'))
                buyCoords = false;
        }
    }

    
    
    for (var upgrade in upgradeList) {
        upgrade = upgradeList[upgrade];
        var gameUpgrade = game.upgrades[upgrade];
        var available = (gameUpgrade.allowed > gameUpgrade.done && canAffordTwoLevel(gameUpgrade));
        if (upgrade == 'Coordination' && (getPageSetting('BuyUpgradesNew') == 2 || !canAffordCoordinationTrimps())) continue;
        if (upgrade == 'Shieldblock' && !getPageSetting('BuyShieldblock')) continue;
        if (upgrade == 'Gigastation' && (game.global.lastWarp ? game.buildings.Warpstation.owned < (Math.floor(game.upgrades.Gigastation.done * getPageSetting('DeltaGigastation')) + getPageSetting('FirstGigastation')) : game.buildings.Warpstation.owned < getPageSetting('FirstGigastation'))) continue;
        //skip bloodlust during scientist challenges and while we have autofight enabled.
        if (upgrade == 'Bloodlust' && game.global.challengeActive == 'Scientist' && getPageSetting('BetterAutoFight')) continue;
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
