# AutoTrimps + NT

[![Join the chat at https://gitter.im/AutoTrimps/Lobby](https://badges.gitter.im/AutoTrimps/Lobby.svg)](https://gitter.im/AutoTrimps/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
## Discussion / Discord Channel
<a href="https://discord.gg/W2Ajv4j"><img src="https://pbs.twimg.com/profile_images/568588143226413056/9Lwrixxj.png" width=48></a>
Discord is a chat program. Come to talk about AutoTrimps, for help, or suggestions for new features : https://discord.gg/W2Ajv4j (same one as zininzinin)

## Script Installation
**Please backup your game via export before and during use to prevent losing your save due to corruption!**

***Your only Option***: Install TamperMonkey (Chrome) or GreaseMonkey (Firefox)

**EASY INSTALL click here: https://github.com/NotThat/AutoTrimps/raw/gh-pages/.user.js** (the Monkeys will detect this and prompt you to install it)

Overly detailed Chrome/TamperMonkey Instructions:
- Open the TamperMonkey dashboard and go to utilities – in the URL box paste https://github.com/NotThat/AutoTrimps/raw/gh-pages/.user.js and click IMPORT
- Alternatively, paste the contents of `.user.js` into a user script (pay attention, it says .user.js - this contains 4 lines of code that loads AutoTrimps2.js)
- The script should automatically load everytime you go to https://trimps.github.io or the game on Kongregate
- You will know you have the script loaded if you see the Automation and Graphs buttons in the game menu at the bottom
- DO NOT PASTE THE FULL 2000+ line contents of the script into TamperMonkey! It will not work properly!
- The .user.js file is a "stub" or "loader" that references the AutoTrimps2.js file which is where the actual script is located.
- The purpose of .user.js is so that you don't have to rely on TamperMonkey's update functionality - instead it will automaticaly download the updated copy from the URL provided everytime its loaded.

FireFox/GreaseMonkey instructions:
- GreaseMonkey identifies userscripts by visiting a URL that ends with ".user.js" in them:
- Visit this URL, and Agree to install the userscript:  https://github.com/NotThat/AutoTrimps/raw/gh-pages/.user.js

***LowLevelPlayer Notes:***

***PSA: AutoTrimps was not designed for  new/low-level players.***

The fact that it works at all is misleading new players into thinking its perfect. Its not. If your highest zone is under z60, you have not unlocked the stats required, and have not experienced the full meta with its various paradigm shifts. If you are just starting, my advice is to play along naturally and use AutoTrimps as a tool, not a crutch. Play with the settings as if it was the game, Dont expect to go unattended, if AT chooses wrong, and make the RIGHT choice yourself. Additionally, its not coded to run one-time challenges for you, only repeatable ones for helium. During this part of the game, content is king - automating literally removes the fun of the game. If you find that many flaws in the automation exist for you, level up. Keep in mind the challenge of maintaining the code is that it has to work for everyone. AT cant see the future and doesnt run simulations, it exists only in the present moment. Post any suggestions on how it can be better, or volunteer to adapt the code, or produce some sort of low-level player guide with what youve learned. Happy scripting! -genBTC

## Easy explanation of Colors for EquipUpgrades / prestiges highlights
- white - Upgrade is not available
- yellow - Upgrade is not affordable
- orange - Upgrade is affordable, but will lower stats
- red - Yes, do it now!

## Confusing original explanation of colors, (gl trying to understand this!)
- Red text on Equip - it's best in its category in terms of stat per resource. This also compares Gyms with Shields.
- Orange text - Upgrade is available and improving this will make the upgrade actually reduce stat in question and it's best in its category in terms of stat per resource.
- Yellow text - Upgrade is available and improving this will make the upgrade actually reduce stat in question
- White border - upgrade is not yet available
- Yellow border - upgrade is available, but not affordable
- Orange border - upgrade is available, affordable, but will actually reduce stat in question
- Red border - you have enough resources to level equip after upgrade to surpass it's current stats.
- Green border on buildings - Best for gems


## Detailed Code Documentation:
Read docs/main-doc.txt or docs/TODO.md for more complete info, the below is somewhat outdated.

Since javascript is easily human readable, Much can be learned by reading the source code, starting with this knowledge:

The script was faux-modularized on 12/4/2016, with the modules residing in the '/modules/' dir. This means that although the files are seperate, they are all still required for the script to run. In addition, the interoperability of the modules is still undocumented, and some(most) rely on other modules. Sometime in the future, you will be able to load/use different verisons of the various modules.
AutoTrimps2.js is the main file that loads the modules, and then runs its ATLoop.

The ATLoop() consists of the following subroutine functions, all of which are enable-able/disable-able by their buttons.:
-     exitSpireCell();        //"Exit Spire After Cell" (other.js)
-     buyUpgrades();          //"Buy Upgrades"
-     autoGoldenUpgrades();   //"AutoGoldenUpgrades" (genBTC settings area)
-     buyStorage();           //"Buy Storage"
-     buyBuildings();         //"Buy Buildings"
-     buyJobs();              //"Buy Jobs"
-     manualLabor();          //"Auto Gather/Build"
-     autoMap();              //"Auto Maps"
-     autoPortal();           //"Auto Portal" (hidden until level 40)
-     autoHeirlooms();       //"Auto Heirlooms" (genBTC settings area)
-     autoNull();             //"Auto Upgrade Heirlooms" (genBTC settings area)
-     toggleAutoTrap();       //"Trap Trimps"
-     autoRoboTrimp();        //"AutoRoboTrimp" (genBTC settings area)
-     autoLevelEquipment();   //"Buy Armor", "Buy Armor Upgrades", "Buy Weapons","Buy Weapons Upgrades"
-     autoStance();           //"Auto Stance"
-     prestigeChanging2();    //"Dynamic Prestige" (genBTC settings area)
-     userscripts();          //Runs any user provided scripts - by copying and pasting a function named userscripts() into the Chrome Dev console. (F12)

Once you have determined the function you wish to examine, CTRL+F to find it and read its code. There are lots of comments. In this way you can determine why AutoTrimps is acting a certain way.
