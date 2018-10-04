var chatIsOpen = false;
var chatWindowWidth = '500px';



function initializeChat(){
    //create the chat button (bottom toolbar)
    var newItem = document.createElement("TD");
    newItem.appendChild(document.createTextNode("Chat!"));
    newItem.setAttribute("class", "btn btn-default");
    newItem.setAttribute("onclick", "collapseChat()");
    var settingbarRow = document.getElementById("settingsTable").firstElementChild.firstElementChild;
    settingbarRow.insertBefore(newItem, settingbarRow.childNodes[10]);
    
    var chatFrame = document.createElement("div");
    //chatFrame.innerHTML = '<iframe src="https://titanembeds.com/embed/230899632777986048" style="resize: horizontal;position: relative;width: 431px;height: 90%; background-color: rgb(255, 255, 255);" frameborder="0"></iframe>'
    chatFrame.innerHTML = '<iframe src="https://titanembeds.com/embed/230899632777986048" style="resize: horizontal;position: relative;width: 431px; background-color: rgb(84, 110, 122); border: 8px; padding-right: 8px;" frameborder="0"></iframe>'
    chatFrame.setAttribute("id", "chatFrame");
    chatFrame.setAttribute("style", "display: block;float: left;background-color: rgb(255, 255, 255);color: rgb(255, 255, 255);");
    //chatFrame.setAttribute("style", "display: block;float: left;background-color: rgb(255, 255, 255);color: rgb(255, 255, 255);pointer-events: none;");
    
    
    
    
    var settingsRow = document.getElementById("settingsRow");
    settingsRow.setAttribute("style", "/* position: relative; */left: 0px;right: 0px;");
    
    //var settingsTable = document.getElementById("settingsTable").children[0].children[0].children;
    //for (var i = 0; i < settingsTable.length ; i++)
    //    settingsTable[i].style.padding = '0px'; 
    
    var wrapper = document.getElementById("wrapper");
    wrapper.setAttribute("style", "background: url('css/bg2_vert.png') center center repeat-y;opacity: 1.05207;/* position: relative; *//* overflow: auto; */display: flex;");
    var innerWrapper = document.getElementById("innerWrapper");
    innerWrapper.setAttribute("style", "/* position: relative; *//* left: auto; *//* right: 0px; *//* width: auto; */float: left;");
    wrapper.appendChild(chatFrame);
    wrapper.appendChild(innerWrapper);
    
    collapseChat(); //start minimized
}
initializeChat();

function collapseChat(){
    //var gameBackground = document.getElementById("wrapper");
    //var innerWrapper = document.getElementById("innerWrapper");
    //var chatButton = document.getElementById("chatBtn");
    //var settingsRow = document.getElementById("settingsRow");
    var chatFrame = document.getElementById("chatFrame");
    var iFrame = chatFrame.children[0];
    
    if(chatIsOpen){ //close chat
        chatFrame.style.display = 'none';
        chatIsOpen = !chatIsOpen;
    }
    else{ //open chat
        if(parseFloat(iFrame.style.width) < 350) iFrame.style.width = '350px';
        chatFrame.style.display = 'block';
        chatIsOpen = !chatIsOpen;
    }
}