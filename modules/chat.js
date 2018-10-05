var chatIsOpen = false;

function initializeChat(){
    //load jQuery-UI.css
    var link1 = document.createElement('link');
    link1.rel = "stylesheet";
    link1.type = "text/css";
    link1.href = basepath + modulepath + 'jQuery-UI.css';
    document.head.appendChild(link1);
    
    //create the chat button (bottom toolbar)
    var newItem = document.createElement("TD");
    newItem.appendChild(document.createTextNode("Chat!"));
    newItem.setAttribute("class", "btn btn-default");
    newItem.setAttribute("onclick", "collapseChat()");
    var settingbarRow = document.getElementById("settingsTable").firstElementChild.firstElementChild;
    settingbarRow.insertBefore(newItem, settingbarRow.childNodes[10]);
    
    var chatFrame = document.createElement("div");
    //chatFrame.innerHTML = innerHTMLText;
    
    chatFrame.setAttribute("id", "chatFrame");
    chatFrame.setAttribute("style", "display: block;float: left;background-color: rgb(255, 255, 255);color: rgb(255, 255, 255); width: 350px");
    chatFrame.style.display = 'none';
    
    var settingsRow = document.getElementById("settingsRow");
    settingsRow.setAttribute("style", "/* position: relative; */left: 0px;right: 0px;");
    
    var wrapper = document.getElementById("wrapper");
    wrapper.setAttribute("style", "background: url('css/bg2_vert.png') center center repeat-y;opacity: 1.05207;/* position: relative; *//* overflow: auto; */display: flex;");
    var innerWrapper = document.getElementById("innerWrapper");
    innerWrapper.setAttribute("style", "width: fit-content; float: left;");
    wrapper.appendChild(chatFrame);
    wrapper.appendChild(innerWrapper);
}
initializeChat();

function collapseChat(){
    //var gameBackground = document.getElementById("wrapper");
    //var innerWrapper = document.getElementById("innerWrapper");
    //var chatButton = document.getElementById("chatBtn");
    //var settingsRow = document.getElementById("settingsRow");
    var chatFrame = document.getElementById("chatFrame");
    
    if(chatIsOpen){ //close chat
        chatFrame.innerHTML = '';
        chatFrame.style.display = 'none';
        
        $(document).ready(function() {
            $("#innerWrapper").width($("#wrapper").width());            
        });
        
        
        chatIsOpen = !chatIsOpen;
    }
    else{ //open chat
        chatFrame.innerHTML = '<iframe src="https://titanembeds.com/embed/230899632777986048" id="chatIFrame" style="position: relative;width: 100%; background-color: rgb(84, 110, 122);" frameborder="0"></iframe>';
        chatFrame.style.display = 'block';
        
        $(document).ready(function() {
            //$("#chatFrame").width(350);
            $("#chatFrame").resizable({
                handles: 'e',
                maxWidth: 1050,
                minWidth: 100,
                //height: 900,
                resize: function(event, ui){
                    // this accounts for some lag in the ui.size value, if you take this away 
                    // you'll get some instable behaviour
                    $(this).width(ui.size.width);
                    
                    // set the content panel width
                    $("#innerWrapper").width($("#wrapper").width() - ui.size.width);            
                }
            });
        });
        chatIsOpen = !chatIsOpen;
    }
}